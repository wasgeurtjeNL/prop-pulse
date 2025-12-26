// ============================================
// AI SAFE DEPLOYER
// Deploys code changes with rollback capability
// 
// In serverless (Vercel), we can't write files directly.
// Instead, we store code changes in the database for review
// and the actual deployment happens via:
// 1. GitHub PR creation (automated)
// 2. Manual code apply (via dashboard)
// 3. Local CLI tool (for development)
// ============================================

import prisma from '@/lib/prisma';
import type { GeneratedCode, ExecutionResult, SandboxResult } from './types';
import { githubService } from './github-service';

interface DeploymentBackup {
  id: string;
  files: Array<{
    path: string;
    originalContent: string | null;
    existed: boolean;
  }>;
  createdAt: Date;
}

export class AISafeDeployer {
  private isServerless: boolean;

  constructor() {
    // Detect if we're running in serverless environment
    this.isServerless = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined;
  }

  /**
   * Deploy generated code with safety checks
   * In serverless mode, this stores the changes in the database for later application
   */
  async deploy(
    generatedCode: GeneratedCode,
    sandboxResult: SandboxResult,
    decisionId: string,
    options: {
      skipSafetyCheck?: boolean;
      force?: boolean;
    } = {}
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const filesChanged: string[] = [];

    // Safety check 1: Sandbox must pass (unless skipped)
    if (!options.skipSafetyCheck && !sandboxResult.success) {
      return {
        success: false,
        executedAt: new Date(),
        duration: Date.now() - startTime,
        filesChanged: [],
        error: 'Sandbox tests failed. Cannot deploy.',
        rollbackAvailable: false,
      };
    }

    // Safety check 2: Check for forbidden files
    const forbiddenFiles = this.checkForbiddenFiles(generatedCode);
    if (forbiddenFiles.length > 0 && !options.force) {
      return {
        success: false,
        executedAt: new Date(),
        duration: Date.now() - startTime,
        filesChanged: [],
        error: `Cannot modify protected files: ${forbiddenFiles.join(', ')}`,
        rollbackAvailable: false,
      };
    }

    try {
      // In serverless mode, store changes in database
      if (this.isServerless) {
        return await this.deployServerless(generatedCode, sandboxResult, decisionId, startTime);
      }

      // In local mode, apply changes directly (for development/testing)
      return await this.deployLocal(generatedCode, sandboxResult, decisionId, startTime);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Update decision status
      await prisma.aIDecision.update({
        where: { id: decisionId },
        data: {
          status: 'FAILED',
          executionError: errorMessage,
          executionDuration: Date.now() - startTime,
        },
      });

      // Log error
      await prisma.aIAgentLog.create({
        data: {
          level: 'ERROR',
          category: 'execution',
          message: `Deployment failed: ${errorMessage}`,
          decisionId,
          errorCode: 'DEPLOY_FAILED',
          errorStack: error instanceof Error ? error.stack : undefined,
        },
      });

      return {
        success: false,
        executedAt: new Date(),
        duration: Date.now() - startTime,
        filesChanged: [],
        error: errorMessage,
        rollbackAvailable: false,
      };
    }
  }

  /**
   * Serverless deployment - stores code changes in database
   * The actual file changes will be applied via:
   * - GitHub PR (if GITHUB_TOKEN is configured)
   * - Manual application (download from dashboard)
   */
  private async deployServerless(
    generatedCode: GeneratedCode,
    sandboxResult: SandboxResult,
    decisionId: string,
    startTime: number
  ): Promise<ExecutionResult> {
    const filesChanged: string[] = [];

    // Store each code change in the database
    for (const file of generatedCode.files) {
      await prisma.aICodeChange.create({
        data: {
          decisionId,
          filePath: file.path,
          action: file.action,
          originalContent: null, // In serverless, we can't read original files
          newContent: file.action === 'DELETE' ? null : file.content,
          syntaxValid: true,
          typesValid: sandboxResult.typeCheckPassed,
          lintPassed: sandboxResult.lintPassed,
          // Not applied yet - pending review
          appliedAt: null,
        },
      });

      filesChanged.push(file.path);
    }

    // Try to create GitHub PR if configured
    const githubPrUrl = await this.tryCreateGitHubPR(generatedCode, decisionId);

    // Update decision status to indicate changes are pending application
    const executionMessage = githubPrUrl 
      ? `GitHub PR created: ${githubPrUrl}` 
      : 'Code changes stored in database. Apply via dashboard or download.';

    await prisma.aIDecision.update({
      where: { id: decisionId },
      data: {
        status: 'EXECUTED',
        executedAt: new Date(),
        executionDuration: Date.now() - startTime,
        executionResult: {
          mode: 'serverless',
          filesChanged,
          message: executionMessage,
          downloadUrl: `/api/ai-agent/download/${decisionId}`,
          githubPrUrl,
        },
      },
    });

    // Log success
    const logMessage = githubPrUrl 
      ? `Created GitHub PR for ${filesChanged.length} files` 
      : `Code changes ready for ${filesChanged.length} files (download from dashboard)`;

    await prisma.aIAgentLog.create({
      data: {
        level: 'INFO',
        category: 'execution',
        message: logMessage,
        data: { 
          filesChanged, 
          mode: 'serverless',
          githubPrUrl,
          hasGitHubPR: !!githubPrUrl,
        },
        decisionId,
        durationMs: Date.now() - startTime,
      },
    });

    return {
      success: true,
      executedAt: new Date(),
      duration: Date.now() - startTime,
      filesChanged,
      rollbackAvailable: true,
    };
  }

  /**
   * Local deployment - applies changes directly to filesystem
   * Only used in development environment
   */
  private async deployLocal(
    generatedCode: GeneratedCode,
    sandboxResult: SandboxResult,
    decisionId: string,
    startTime: number
  ): Promise<ExecutionResult> {
    // Dynamic import for fs (not available in serverless)
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const projectRoot = process.cwd();
    const backupDir = path.join(projectRoot, '.ai-backups');
    const filesChanged: string[] = [];

    // Create backup before making changes
    const backup = await this.createLocalBackup(generatedCode, decisionId, fs, path, projectRoot, backupDir);

    // Apply changes
    for (const file of generatedCode.files) {
      const filePath = path.join(projectRoot, file.path);

      try {
        if (file.action === 'DELETE') {
          await fs.unlink(filePath);
        } else {
          // Ensure directory exists
          await fs.mkdir(path.dirname(filePath), { recursive: true });
          await fs.writeFile(filePath, file.content, 'utf-8');
        }

        filesChanged.push(file.path);

        // Store code change in database
        await prisma.aICodeChange.create({
          data: {
            decisionId,
            filePath: file.path,
            action: file.action,
            originalContent: backup.files.find(f => f.path === file.path)?.originalContent,
            newContent: file.action === 'DELETE' ? null : file.content,
            syntaxValid: true,
            typesValid: sandboxResult.typeCheckPassed,
            lintPassed: sandboxResult.lintPassed,
            appliedAt: new Date(),
          },
        });
      } catch (error) {
        // Rollback on error
        await this.rollbackLocal(backup.id, fs, path, projectRoot, backupDir);
        throw error;
      }
    }

    // Update decision status
    await prisma.aIDecision.update({
      where: { id: decisionId },
      data: {
        status: 'EXECUTED',
        executedAt: new Date(),
        executionDuration: Date.now() - startTime,
        executionResult: {
          mode: 'local',
          filesChanged,
          backupId: backup.id,
        },
      },
    });

    // Log success
    await prisma.aIAgentLog.create({
      data: {
        level: 'INFO',
        category: 'execution',
        message: `Successfully deployed ${filesChanged.length} files (local mode)`,
        data: { filesChanged, backupId: backup.id, mode: 'local' },
        decisionId,
        durationMs: Date.now() - startTime,
      },
    });

    return {
      success: true,
      executedAt: new Date(),
      duration: Date.now() - startTime,
      filesChanged,
      rollbackAvailable: true,
    };
  }

  /**
   * Create a local backup of files that will be changed
   */
  private async createLocalBackup(
    generatedCode: GeneratedCode, 
    decisionId: string,
    fs: typeof import('fs/promises'),
    path: typeof import('path'),
    projectRoot: string,
    backupDir: string
  ): Promise<DeploymentBackup> {
    const backupId = `${Date.now()}-${decisionId.substring(0, 8)}`;
    const backupPath = path.join(backupDir, backupId);

    await fs.mkdir(backupPath, { recursive: true });

    const backupFiles: DeploymentBackup['files'] = [];

    for (const file of generatedCode.files) {
      const filePath = path.join(projectRoot, file.path);
      let originalContent: string | null = null;
      let existed = false;

      try {
        originalContent = await fs.readFile(filePath, 'utf-8');
        existed = true;

        // Copy original to backup
        const backupFilePath = path.join(backupPath, file.path);
        await fs.mkdir(path.dirname(backupFilePath), { recursive: true });
        await fs.writeFile(backupFilePath, originalContent);
      } catch {
        // File doesn't exist
      }

      backupFiles.push({
        path: file.path,
        originalContent,
        existed,
      });
    }

    // Save manifest
    const manifest = {
      id: backupId,
      decisionId,
      files: backupFiles.map(f => ({ path: f.path, existed: f.existed })),
      createdAt: new Date().toISOString(),
    };

    await fs.writeFile(
      path.join(backupPath, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    );

    return {
      id: backupId,
      files: backupFiles,
      createdAt: new Date(),
    };
  }

  /**
   * Rollback a local deployment using backup
   */
  private async rollbackLocal(
    backupId: string,
    fs: typeof import('fs/promises'),
    path: typeof import('path'),
    projectRoot: string,
    backupDir: string
  ): Promise<{ success: boolean; error?: string }> {
    const backupPath = path.join(backupDir, backupId);

    try {
      // Read manifest
      const manifestPath = path.join(backupPath, 'manifest.json');
      const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));

      for (const file of manifest.files) {
        const filePath = path.join(projectRoot, file.path);
        const backupFilePath = path.join(backupPath, file.path);

        if (file.existed) {
          // Restore original file
          const originalContent = await fs.readFile(backupFilePath, 'utf-8');
          await fs.writeFile(filePath, originalContent);
        } else {
          // Delete file that was created
          await fs.unlink(filePath).catch(() => {});
        }
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Rollback failed',
      };
    }
  }

  /**
   * Public rollback method - works via database records
   */
  async rollback(decisionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get code changes for this decision
      const codeChanges = await prisma.aICodeChange.findMany({
        where: { decisionId },
      });

      if (codeChanges.length === 0) {
        return { success: false, error: 'No code changes found for this decision' };
      }

      // In serverless mode, we can only mark as rolled back
      // The actual file rollback would need to happen via GitHub PR or manual action
      if (this.isServerless) {
        await prisma.aIDecision.update({
          where: { id: decisionId },
          data: {
            status: 'ROLLED_BACK',
            rolledBackAt: new Date(),
          },
        });

        await prisma.aICodeChange.updateMany({
          where: { decisionId },
          data: { rolledBackAt: new Date() },
        });

        // Create rollback instructions in log
        await prisma.aIAgentLog.create({
          data: {
            level: 'WARN',
            category: 'rollback',
            message: 'Decision marked as rolled back. Apply original content via dashboard or GitHub.',
            decisionId,
            data: {
              mode: 'serverless',
              filesToRevert: codeChanges.map(c => ({
                path: c.filePath,
                hasOriginal: !!c.originalContent,
              })),
            },
          },
        });

        return { success: true };
      }

      // In local mode, we can try filesystem rollback
      const decision = await prisma.aIDecision.findUnique({
        where: { id: decisionId },
        select: { executionResult: true },
      });

      const backupId = (decision?.executionResult as { backupId?: string })?.backupId;
      
      if (backupId) {
        const fs = await import('fs/promises');
        const path = await import('path');
        const projectRoot = process.cwd();
        const backupDir = path.join(projectRoot, '.ai-backups');
        
        const result = await this.rollbackLocal(backupId, fs, path, projectRoot, backupDir);
        
        if (result.success) {
          await prisma.aIDecision.update({
            where: { id: decisionId },
            data: {
              status: 'ROLLED_BACK',
              rolledBackAt: new Date(),
            },
          });

          await prisma.aICodeChange.updateMany({
            where: { decisionId },
            data: { rolledBackAt: new Date() },
          });

          await prisma.aIAgentLog.create({
            data: {
              level: 'WARN',
              category: 'rollback',
              message: `Successfully rolled back deployment`,
              decisionId,
              data: { backupId },
            },
          });
        }

        return result;
      }

      return { success: false, error: 'No backup found for this decision' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Rollback failed',
      };
    }
  }

  /**
   * Try to create a GitHub PR with the code changes
   */
  private async tryCreateGitHubPR(
    generatedCode: GeneratedCode,
    decisionId: string
  ): Promise<string | null> {
    // Check if GitHub is configured
    if (!githubService.isConfigured()) {
      await prisma.aIAgentLog.create({
        data: {
          level: 'INFO',
          category: 'github',
          message: 'GitHub integration not configured. Code changes stored in database only.',
          decisionId,
        },
      });
      return null;
    }

    try {
      // Create a PR with the generated code
      const result = await githubService.createPullRequest(
        generatedCode,
        decisionId,
        {
          title: `🤖 AI Agent: ${generatedCode.description || 'Code improvement'}`,
          description: generatedCode.reasoning,
        }
      );

      if (result.success && result.prUrl) {
        return result.prUrl;
      }

      return null;
    } catch (error) {
      console.error('Failed to create GitHub PR:', error);
      return null;
    }
  }

  /**
   * Check for forbidden files that shouldn't be modified
   */
  private checkForbiddenFiles(generatedCode: GeneratedCode): string[] {
    const forbiddenPatterns = [
      /^\.env/,                    // Environment files
      /^prisma\/schema\.prisma$/,  // Database schema (needs migration)
      /^lib\/auth\.ts$/,           // Auth configuration
      /^middleware\.ts$/,          // Middleware
      /node_modules\//,            // Dependencies
      /\.git\//,                   // Git files
    ];

    const forbidden: string[] = [];

    for (const file of generatedCode.files) {
      for (const pattern of forbiddenPatterns) {
        if (pattern.test(file.path)) {
          forbidden.push(file.path);
          break;
        }
      }
    }

    return forbidden;
  }

  /**
   * Get pending code changes that need to be applied
   */
  async getPendingChanges(): Promise<Array<{
    decisionId: string;
    files: Array<{
      path: string;
      action: string;
      content: string | null;
    }>;
    createdAt: Date;
  }>> {
    const pendingChanges = await prisma.aICodeChange.findMany({
      where: {
        appliedAt: null,
        rolledBackAt: null,
      },
      include: {
        decision: {
          select: {
            id: true,
            type: true,
            createdAt: true,
          },
        },
      },
    });

    // Group by decision
    const grouped = pendingChanges.reduce((acc, change) => {
      if (!acc[change.decisionId]) {
        acc[change.decisionId] = {
          decisionId: change.decisionId,
          files: [],
          createdAt: change.decision.createdAt,
        };
      }
      acc[change.decisionId].files.push({
        path: change.filePath,
        action: change.action,
        content: change.newContent,
      });
      return acc;
    }, {} as Record<string, { decisionId: string; files: Array<{ path: string; action: string; content: string | null }>; createdAt: Date }>);

    return Object.values(grouped);
  }

  /**
   * Mark code changes as applied (for manual application tracking)
   */
  async markAsApplied(decisionId: string): Promise<void> {
    await prisma.aICodeChange.updateMany({
      where: { 
        decisionId,
        appliedAt: null,
      },
      data: {
        appliedAt: new Date(),
      },
    });

    await prisma.aIAgentLog.create({
      data: {
        level: 'INFO',
        category: 'execution',
        message: 'Code changes marked as manually applied',
        decisionId,
      },
    });
  }
}

// Singleton instance
export const deployer = new AISafeDeployer();
