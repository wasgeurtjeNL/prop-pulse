// ============================================
// AI AGENT GITHUB SERVICE
// Creates PRs automatically from AI-generated code
// ============================================

import { Octokit } from '@octokit/rest';
import prisma from '@/lib/prisma';
import type { GeneratedCode } from './types';

interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  baseBranch: string;
}

interface PRResult {
  success: boolean;
  prUrl?: string;
  prNumber?: number;
  branchName?: string;
  error?: string;
}

export class GitHubService {
  private octokit: Octokit | null = null;
  private config: GitHubConfig | null = null;

  constructor() {
    this.initializeFromEnv();
  }

  private initializeFromEnv() {
    const token = process.env.GITHUB_TOKEN;
    const repoFullName = process.env.GITHUB_REPO; // format: "owner/repo"

    if (!token || !repoFullName) {
      console.log('GitHub integration not configured. Set GITHUB_TOKEN and GITHUB_REPO.');
      return;
    }

    const [owner, repo] = repoFullName.split('/');
    if (!owner || !repo) {
      console.error('Invalid GITHUB_REPO format. Expected "owner/repo".');
      return;
    }

    this.config = {
      token,
      owner,
      repo,
      baseBranch: process.env.GITHUB_BASE_BRANCH || 'main',
    };

    this.octokit = new Octokit({ auth: token });
  }

  /**
   * Check if GitHub integration is available
   */
  isConfigured(): boolean {
    return this.octokit !== null && this.config !== null;
  }

  /**
   * Create a Pull Request with the AI-generated code changes
   */
  async createPullRequest(
    generatedCode: GeneratedCode,
    decisionId: string,
    options: {
      title?: string;
      description?: string;
      autoMerge?: boolean;
    } = {}
  ): Promise<PRResult> {
    if (!this.octokit || !this.config) {
      return { success: false, error: 'GitHub not configured' };
    }

    const { owner, repo, baseBranch } = this.config;
    const branchName = `ai-agent/${decisionId.substring(0, 12)}`;
    const timestamp = new Date().toISOString().split('T')[0];

    try {
      // 1. Get the SHA of the base branch
      const { data: baseBranchData } = await this.octokit.repos.getBranch({
        owner,
        repo,
        branch: baseBranch,
      });
      const baseSha = baseBranchData.commit.sha;

      // 2. Create a new branch from the base
      await this.octokit.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branchName}`,
        sha: baseSha,
      });

      // 3. Get the current tree
      const { data: baseCommit } = await this.octokit.git.getCommit({
        owner,
        repo,
        commit_sha: baseSha,
      });

      // 4. Create blobs for each file
      const treeItems: Array<{
        path: string;
        mode: '100644' | '100755' | '040000' | '160000' | '120000';
        type: 'blob' | 'tree' | 'commit';
        sha?: string | null;
      }> = [];

      for (const file of generatedCode.files) {
        if (file.action === 'DELETE') {
          // Mark file for deletion by setting sha to null
          treeItems.push({
            path: file.path,
            mode: '100644',
            type: 'blob',
            sha: null,
          });
        } else {
          // Create or update file
          const { data: blob } = await this.octokit.git.createBlob({
            owner,
            repo,
            content: Buffer.from(file.content).toString('base64'),
            encoding: 'base64',
          });

          treeItems.push({
            path: file.path,
            mode: '100644',
            type: 'blob',
            sha: blob.sha,
          });
        }
      }

      // 5. Create a new tree with the changes
      const { data: newTree } = await this.octokit.git.createTree({
        owner,
        repo,
        base_tree: baseCommit.tree.sha,
        tree: treeItems,
      });

      // 6. Create a commit
      const commitMessage = options.title || `🤖 AI Agent: ${generatedCode.description || 'Code improvement'}`;
      const { data: newCommit } = await this.octokit.git.createCommit({
        owner,
        repo,
        message: commitMessage,
        tree: newTree.sha,
        parents: [baseSha],
        author: {
          name: 'AI Agent',
          email: 'ai-agent@prop-pulse.com',
          date: new Date().toISOString(),
        },
      });

      // 7. Update the branch reference
      await this.octokit.git.updateRef({
        owner,
        repo,
        ref: `heads/${branchName}`,
        sha: newCommit.sha,
      });

      // 8. Create the Pull Request
      const prTitle = options.title || `🤖 AI: ${generatedCode.description || 'Automated improvement'}`;
      const prBody = this.generatePRDescription(generatedCode, decisionId, options.description);

      const { data: pr } = await this.octokit.pulls.create({
        owner,
        repo,
        title: prTitle,
        body: prBody,
        head: branchName,
        base: baseBranch,
      });

      // 9. Add labels to the PR
      await this.octokit.issues.addLabels({
        owner,
        repo,
        issue_number: pr.number,
        labels: ['ai-generated', 'automated'],
      }).catch(() => {
        // Labels might not exist, ignore error
      });

      // 10. Log the successful PR creation
      await prisma.aIAgentLog.create({
        data: {
          level: 'INFO',
          category: 'github',
          message: `Created GitHub PR #${pr.number}: ${prTitle}`,
          decisionId,
          data: {
            prNumber: pr.number,
            prUrl: pr.html_url,
            branchName,
            filesChanged: generatedCode.files.map(f => f.path),
          },
        },
      });

      // 11. Enable auto-merge if requested and available
      if (options.autoMerge) {
        try {
          await this.octokit.pulls.merge({
            owner,
            repo,
            pull_number: pr.number,
            merge_method: 'squash',
          });

          await prisma.aIAgentLog.create({
            data: {
              level: 'INFO',
              category: 'github',
              message: `Auto-merged PR #${pr.number}`,
              decisionId,
            },
          });
        } catch (mergeError) {
          // Auto-merge might fail due to branch protection rules
          console.log('Auto-merge not available:', mergeError);
        }
      }

      return {
        success: true,
        prUrl: pr.html_url,
        prNumber: pr.number,
        branchName,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await prisma.aIAgentLog.create({
        data: {
          level: 'ERROR',
          category: 'github',
          message: `Failed to create GitHub PR: ${errorMessage}`,
          decisionId,
          errorCode: 'GITHUB_PR_FAILED',
          errorStack: error instanceof Error ? error.stack : undefined,
        },
      });

      // Try to clean up the branch if it was created
      if (this.octokit && this.config) {
        try {
          await this.octokit.git.deleteRef({
            owner: this.config.owner,
            repo: this.config.repo,
            ref: `heads/${branchName}`,
          });
        } catch {
          // Ignore cleanup errors
        }
      }

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Generate a detailed PR description
   */
  private generatePRDescription(
    generatedCode: GeneratedCode,
    decisionId: string,
    customDescription?: string
  ): string {
    const lines: string[] = [
      '## 🤖 AI Agent Generated Changes',
      '',
      customDescription || generatedCode.description || 'Automated code improvement generated by the AI Agent.',
      '',
      '### 📁 Files Changed',
      '',
    ];

    for (const file of generatedCode.files) {
      const emoji = file.action === 'CREATE' ? '➕' : file.action === 'DELETE' ? '🗑️' : '📝';
      lines.push(`- ${emoji} \`${file.path}\` (${file.action})`);
    }

    lines.push(
      '',
      '### 🔍 Details',
      '',
      `- **Decision ID**: \`${decisionId}\``,
      `- **Confidence**: ${generatedCode.confidence || 'N/A'}%`,
      `- **Generated at**: ${new Date().toISOString()}`,
      '',
      '### ⚠️ Review Notes',
      '',
      '> This PR was automatically generated by the AI Agent. Please review the changes carefully before merging.',
      '',
      '---',
      '',
      '*Generated by [AI Agent](https://prop-pulse.com/dashboard/ai-agent)*',
    );

    return lines.join('\n');
  }

  /**
   * Check the status of a PR
   */
  async getPRStatus(prNumber: number): Promise<{
    state: 'open' | 'closed' | 'merged';
    mergeable: boolean | null;
    merged: boolean;
  } | null> {
    if (!this.octokit || !this.config) {
      return null;
    }

    try {
      const { data: pr } = await this.octokit.pulls.get({
        owner: this.config.owner,
        repo: this.config.repo,
        pull_number: prNumber,
      });

      return {
        state: pr.state as 'open' | 'closed',
        mergeable: pr.mergeable,
        merged: pr.merged,
      };
    } catch {
      return null;
    }
  }

  /**
   * Close a PR (e.g., on rollback)
   */
  async closePR(prNumber: number, reason: string): Promise<boolean> {
    if (!this.octokit || !this.config) {
      return false;
    }

    try {
      await this.octokit.pulls.update({
        owner: this.config.owner,
        repo: this.config.repo,
        pull_number: prNumber,
        state: 'closed',
      });

      await this.octokit.issues.createComment({
        owner: this.config.owner,
        repo: this.config.repo,
        issue_number: prNumber,
        body: `🤖 This PR was closed by the AI Agent.\n\n**Reason**: ${reason}`,
      });

      return true;
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const githubService = new GitHubService();

