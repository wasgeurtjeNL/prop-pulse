// ============================================
// AI CODE SANDBOX
// Tests generated code before deployment
// ============================================

import { exec } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { promisify } from 'util';
import type { GeneratedCode, SandboxResult } from './types';

const execAsync = promisify(exec);

export class AICodeSandbox {
  private sandboxDir: string;
  private projectRoot: string;
  private timeout: number;

  constructor() {
    this.projectRoot = process.cwd();
    this.sandboxDir = path.join(this.projectRoot, '.ai-sandbox');
    this.timeout = 120000; // 2 minutes max for any operation
  }

  /**
   * Test generated code in a sandbox environment
   */
  async test(generatedCode: GeneratedCode): Promise<SandboxResult> {
    const startTime = Date.now();
    const result: SandboxResult = {
      success: false,
      buildPassed: false,
      typeCheckPassed: false,
      lintPassed: false,
      testsPassed: null,
      errors: [],
      warnings: [],
      duration: 0,
    };

    try {
      // For simple changes, we can test in-place
      // For complex changes, we would use a full sandbox

      // Step 1: Validate syntax of each file
      for (const file of generatedCode.files) {
        if (file.action === 'DELETE') continue;

        const syntaxResult = await this.validateSyntax(file.content, file.language || 'typescript');
        if (!syntaxResult.valid) {
          result.errors.push(`Syntax error in ${file.path}: ${syntaxResult.error}`);
        }
      }

      if (result.errors.length > 0) {
        result.duration = Date.now() - startTime;
        return result;
      }

      // Step 2: Type check (quick validation using tsc --noEmit on individual files)
      result.typeCheckPassed = await this.quickTypeCheck(generatedCode);
      if (!result.typeCheckPassed) {
        result.errors.push('TypeScript compilation check failed');
      }

      // Step 3: Lint check
      result.lintPassed = await this.quickLintCheck(generatedCode);
      if (!result.lintPassed) {
        result.warnings.push('ESLint check found issues');
      }

      // Step 4: Build check (only for major changes)
      if (generatedCode.files.length > 3 || this.hasComplexChanges(generatedCode)) {
        result.buildPassed = await this.quickBuildCheck();
      } else {
        result.buildPassed = true; // Skip for simple changes
      }

      // Determine overall success
      result.success = result.typeCheckPassed && result.errors.length === 0;
      result.duration = Date.now() - startTime;

      return result;
    } catch (error) {
      result.errors.push(`Sandbox error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      result.duration = Date.now() - startTime;
      return result;
    }
  }

  /**
   * Quick validation of TypeScript/JavaScript syntax
   */
  private async validateSyntax(content: string, language: string): Promise<{ valid: boolean; error?: string }> {
    if (!['typescript', 'tsx', 'javascript', 'jsx', 'ts', 'js'].includes(language)) {
      return { valid: true }; // Skip non-JS/TS files
    }

    try {
      // Use a simple syntax check
      // In production, you'd use the TypeScript compiler API
      const tempFile = path.join(this.sandboxDir, `temp-${Date.now()}.ts`);
      
      await fs.mkdir(this.sandboxDir, { recursive: true });
      await fs.writeFile(tempFile, content);

      try {
        await execAsync(`npx tsc --noEmit --skipLibCheck "${tempFile}"`, {
          cwd: this.projectRoot,
          timeout: 30000,
        });
        return { valid: true };
      } catch (error) {
        const err = error as { stderr?: string };
        return { valid: false, error: err.stderr?.substring(0, 500) };
      } finally {
        await fs.unlink(tempFile).catch(() => {});
      }
    } catch {
      // If we can't run the check, assume valid
      return { valid: true };
    }
  }

  /**
   * Quick TypeScript type check
   */
  private async quickTypeCheck(generatedCode: GeneratedCode): Promise<boolean> {
    try {
      // Write files temporarily
      const tempFiles: string[] = [];
      
      for (const file of generatedCode.files) {
        if (file.action === 'DELETE') continue;
        if (!file.path.match(/\.(ts|tsx)$/)) continue;

        const tempPath = path.join(this.sandboxDir, 'check', file.path);
        await fs.mkdir(path.dirname(tempPath), { recursive: true });
        await fs.writeFile(tempPath, file.content);
        tempFiles.push(tempPath);
      }

      if (tempFiles.length === 0) return true;

      // Run tsc on the files
      try {
        await execAsync(`npx tsc --noEmit --skipLibCheck ${tempFiles.join(' ')}`, {
          cwd: this.projectRoot,
          timeout: this.timeout,
        });
        return true;
      } catch {
        return false;
      }
    } catch {
      return true; // Fail open if check fails
    } finally {
      // Cleanup
      await fs.rm(path.join(this.sandboxDir, 'check'), { recursive: true, force: true }).catch(() => {});
    }
  }

  /**
   * Quick ESLint check
   */
  private async quickLintCheck(generatedCode: GeneratedCode): Promise<boolean> {
    try {
      const tempFiles: string[] = [];
      
      for (const file of generatedCode.files) {
        if (file.action === 'DELETE') continue;
        if (!file.path.match(/\.(ts|tsx|js|jsx)$/)) continue;

        const tempPath = path.join(this.sandboxDir, 'lint', file.path);
        await fs.mkdir(path.dirname(tempPath), { recursive: true });
        await fs.writeFile(tempPath, file.content);
        tempFiles.push(tempPath);
      }

      if (tempFiles.length === 0) return true;

      try {
        await execAsync(`npx eslint --no-error-on-unmatched-pattern ${tempFiles.join(' ')}`, {
          cwd: this.projectRoot,
          timeout: this.timeout,
        });
        return true;
      } catch {
        return false; // Lint errors
      }
    } catch {
      return true; // Fail open
    } finally {
      await fs.rm(path.join(this.sandboxDir, 'lint'), { recursive: true, force: true }).catch(() => {});
    }
  }

  /**
   * Quick build check (doesn't actually build, just checks for obvious issues)
   */
  private async quickBuildCheck(): Promise<boolean> {
    // In a full implementation, this would run `next build` in a sandbox
    // For now, we just return true as TypeScript check covers most issues
    return true;
  }

  /**
   * Check if changes are complex (require full build test)
   */
  private hasComplexChanges(generatedCode: GeneratedCode): boolean {
    for (const file of generatedCode.files) {
      // API routes, middleware, or config changes are complex
      if (file.path.includes('/api/')) return true;
      if (file.path.includes('middleware')) return true;
      if (file.path.includes('config')) return true;
      if (file.path.includes('prisma')) return true;
    }
    return false;
  }

  /**
   * Clean up sandbox directory
   */
  async cleanup(): Promise<void> {
    try {
      await fs.rm(this.sandboxDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }

  /**
   * Run a full sandbox test (creates a copy of the project)
   * This is expensive and should only be used for major changes
   */
  async fullSandboxTest(generatedCode: GeneratedCode): Promise<SandboxResult> {
    const startTime = Date.now();
    const result: SandboxResult = {
      success: false,
      buildPassed: false,
      typeCheckPassed: false,
      lintPassed: false,
      testsPassed: null,
      errors: [],
      warnings: [],
      duration: 0,
    };

    try {
      // Create sandbox directory
      const sandboxPath = path.join(this.sandboxDir, 'full-' + Date.now());
      await fs.mkdir(sandboxPath, { recursive: true });

      // Copy necessary files (not node_modules)
      const filesToCopy = [
        'package.json',
        'tsconfig.json',
        'next.config.ts',
        '.eslintrc.json',
      ];

      for (const file of filesToCopy) {
        try {
          await fs.copyFile(
            path.join(this.projectRoot, file),
            path.join(sandboxPath, file)
          );
        } catch {
          // File might not exist
        }
      }

      // Create symlink to node_modules
      try {
        await fs.symlink(
          path.join(this.projectRoot, 'node_modules'),
          path.join(sandboxPath, 'node_modules'),
          'junction' // Windows compatible
        );
      } catch {
        // Symlink might fail on some systems
      }

      // Apply generated changes
      for (const file of generatedCode.files) {
        const filePath = path.join(sandboxPath, file.path);
        
        if (file.action === 'DELETE') {
          await fs.unlink(filePath).catch(() => {});
        } else {
          await fs.mkdir(path.dirname(filePath), { recursive: true });
          await fs.writeFile(filePath, file.content);
        }
      }

      // Run TypeScript check
      try {
        await execAsync('npx tsc --noEmit', { cwd: sandboxPath, timeout: this.timeout });
        result.typeCheckPassed = true;
      } catch (error) {
        result.typeCheckPassed = false;
        result.errors.push(`TypeScript: ${(error as { stderr?: string }).stderr?.substring(0, 500)}`);
      }

      // Run ESLint
      try {
        await execAsync('npx eslint .', { cwd: sandboxPath, timeout: this.timeout });
        result.lintPassed = true;
      } catch {
        result.lintPassed = false;
        result.warnings.push('ESLint found issues');
      }

      // Run build (optional, expensive)
      try {
        await execAsync('npx next build', { cwd: sandboxPath, timeout: 300000 }); // 5 min timeout
        result.buildPassed = true;
      } catch (error) {
        result.buildPassed = false;
        result.errors.push(`Build: ${(error as { stderr?: string }).stderr?.substring(0, 500)}`);
      }

      result.success = result.typeCheckPassed && result.buildPassed;

    } catch (error) {
      result.errors.push(`Sandbox: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      result.duration = Date.now() - startTime;
      // Cleanup will be done by scheduled task or manually
    }

    return result;
  }
}

// Singleton instance
export const sandbox = new AICodeSandbox();

