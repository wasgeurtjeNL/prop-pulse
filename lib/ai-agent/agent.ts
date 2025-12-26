// ============================================
// CORE AI AGENT
// The main orchestrator for the autonomous AI system
// ============================================

import prisma from '@/lib/prisma';
import type {
  AgentConfig,
  AgentState,
  AnalysisRequest,
  AnalysisResult,
  AIDecisionPayload,
  ExecutionResult,
  Opportunity,
} from './types';
import { dataCollector } from './data-collector';
import { decisionEngine } from './decision-engine';
import { codeGenerator } from './code-generator';
import { sandbox } from './sandbox';
import { deployer } from './deployer';

export class RealEstateAIAgent {
  private isRunning: boolean = false;
  private currentTask: string | null = null;

  /**
   * Run a complete analysis cycle
   */
  async runAnalysis(request: AnalysisRequest = { type: 'full' }): Promise<AnalysisResult> {
    // Check if agent is enabled
    const config = await this.getConfig();
    
    if (!config.enabled || config.killSwitch) {
      throw new Error('AI Agent is disabled');
    }

    if (config.pausedUntil && new Date() < config.pausedUntil) {
      throw new Error(`AI Agent is paused until ${config.pausedUntil}: ${config.pauseReason}`);
    }

    // Check daily limits
    const dailyStats = await this.getDailyStats();
    if (dailyStats.decisionsToday >= config.dailyDecisionLimit) {
      throw new Error(`Daily decision limit reached (${config.dailyDecisionLimit})`);
    }

    this.isRunning = true;
    this.currentTask = 'Analyzing data...';

    try {
      // Log start
      await this.log('INFO', 'analysis', 'Starting AI analysis cycle', { request });

      // Run analysis
      const result = await decisionEngine.analyze(request);

      // Store decisions
      const storedDecisions: string[] = [];
      for (const decision of result.decisions) {
        // Check if we're within limits
        if (storedDecisions.length >= config.dailyDecisionLimit - dailyStats.decisionsToday) {
          break;
        }

        const id = await decisionEngine.storeDecision(decision);
        storedDecisions.push(id);

        // Store opportunity
        const opportunity = result.opportunities.find(o => 
          o.title.includes(decision.reasoning.substring(0, 30))
        );
        if (opportunity) {
          await this.storeOpportunity(opportunity, id);
        }

        // Auto-execute if allowed
        if (decision.autoExecute && dailyStats.autoExecutesToday < config.dailyAutoExecuteLimit) {
          await this.executeDecision(id);
          dailyStats.autoExecutesToday++;
        }
      }

      // Log completion
      await this.log('INFO', 'analysis', 'AI analysis cycle completed', {
        opportunities: result.opportunities.length,
        decisions: storedDecisions.length,
        duration: result.analysisTime,
      });

      return result;
    } finally {
      this.isRunning = false;
      this.currentTask = null;
    }
  }

  /**
   * Execute a specific decision
   */
  async executeDecision(decisionId: string): Promise<ExecutionResult> {
    this.currentTask = `Executing decision ${decisionId}...`;

    try {
      // Get decision from database
      const decision = await prisma.aIDecision.findUnique({
        where: { id: decisionId },
      });

      if (!decision) {
        throw new Error(`Decision not found: ${decisionId}`);
      }

      if (decision.status !== 'PENDING' && decision.status !== 'APPROVED') {
        throw new Error(`Decision cannot be executed (status: ${decision.status})`);
      }

      // Update status to executing
      await prisma.aIDecision.update({
        where: { id: decisionId },
        data: { status: 'EXECUTING' },
      });

      // Generate code for the action
      const actionPayload = decision.actionPayload as Record<string, unknown>;
      const generatedCode = await codeGenerator.generateCode({
        type: decision.actionType as 'CREATE_FILE' | 'MODIFY_FILE',
        payload: actionPayload,
      });

      // Test in sandbox
      const sandboxResult = await sandbox.test(generatedCode);

      if (!sandboxResult.success) {
        await prisma.aIDecision.update({
          where: { id: decisionId },
          data: {
            status: 'FAILED',
            executionError: `Sandbox failed: ${sandboxResult.errors.join(', ')}`,
          },
        });

        return {
          success: false,
          executedAt: new Date(),
          duration: sandboxResult.duration,
          filesChanged: [],
          error: `Sandbox failed: ${sandboxResult.errors.join(', ')}`,
          rollbackAvailable: false,
        };
      }

      // Deploy the code
      const result = await deployer.deploy(generatedCode, sandboxResult, decisionId);

      // Schedule feedback check
      if (result.success) {
        const config = await this.getConfig();
        await prisma.aIDecision.update({
          where: { id: decisionId },
          data: {
            feedbackDueAt: new Date(Date.now() + config.feedbackLoopDays * 24 * 60 * 60 * 1000),
          },
        });
      }

      return result;
    } finally {
      this.currentTask = null;
    }
  }

  /**
   * Approve a pending decision
   */
  async approveDecision(decisionId: string, userId: string, userName: string): Promise<void> {
    await prisma.aIDecision.update({
      where: { id: decisionId },
      data: {
        status: 'APPROVED',
        approvedBy: userId,
        approvedByName: userName,
        approvedAt: new Date(),
      },
    });

    await this.log('INFO', 'approval', `Decision approved by ${userName}`, { decisionId });
  }

  /**
   * Reject a pending decision
   */
  async rejectDecision(decisionId: string, userId: string, userName: string, reason: string): Promise<void> {
    await prisma.aIDecision.update({
      where: { id: decisionId },
      data: {
        status: 'REJECTED',
        rejectedBy: userId,
        rejectedByName: userName,
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
    });

    await this.log('INFO', 'rejection', `Decision rejected by ${userName}: ${reason}`, { decisionId });
  }

  /**
   * Rollback a deployed decision
   */
  async rollbackDecision(decisionId: string, userId: string, reason: string): Promise<{ success: boolean; error?: string }> {
    const decision = await prisma.aIDecision.findUnique({
      where: { id: decisionId },
    });

    if (!decision) {
      return { success: false, error: 'Decision not found' };
    }

    const executionResult = decision.executionResult as { backupId?: string } | null;
    if (!executionResult?.backupId) {
      return { success: false, error: 'No backup available for rollback' };
    }

    const result = await deployer.rollback(executionResult.backupId);

    if (result.success) {
      await prisma.aIDecision.update({
        where: { id: decisionId },
        data: {
          status: 'ROLLED_BACK',
          rolledBackAt: new Date(),
          rolledBackBy: userId,
          rollbackReason: reason,
        },
      });

      await this.log('WARN', 'rollback', `Decision rolled back: ${reason}`, { decisionId, userId });
    }

    return result;
  }

  /**
   * Provide feedback on a decision's outcome
   */
  async provideFeedback(
    decisionId: string,
    wasSuccessful: boolean,
    successScore: number,
    notes: string
  ): Promise<void> {
    await prisma.aIDecision.update({
      where: { id: decisionId },
      data: {
        wasSuccessful,
        successScore,
        feedbackNotes: notes,
        actualImpact: { wasSuccessful, successScore, notes },
      },
    });

    // Store learning if successful patterns emerge
    if (wasSuccessful && successScore >= 80) {
      const decision = await prisma.aIDecision.findUnique({
        where: { id: decisionId },
      });

      if (decision) {
        await prisma.aILearning.create({
          data: {
            category: 'successful_pattern',
            insight: `Decision type "${decision.type}" with high confidence led to success`,
            sourceDecisionId: decisionId,
            confidence: successScore,
            impactArea: decision.type,
            adjustment: 'Increase confidence in similar decisions',
          },
        });
      }
    }

    await this.log('INFO', 'feedback', `Feedback provided: ${wasSuccessful ? 'Success' : 'Failure'} (${successScore}%)`, {
      decisionId,
      wasSuccessful,
      successScore,
    });
  }

  /**
   * Get agent configuration
   */
  async getConfig(): Promise<AgentConfig> {
    return decisionEngine.getConfig();
  }

  /**
   * Update agent configuration
   */
  async updateConfig(updates: Partial<AgentConfig>): Promise<AgentConfig> {
    const current = await this.getConfig();

    await prisma.aIAgentConfig.update({
      where: { id: 'default' },
      data: {
        enabled: updates.enabled ?? current.enabled,
        autonomousMode: updates.autonomousMode ?? current.autonomousMode,
        minConfidenceThreshold: updates.minConfidenceThreshold ?? current.minConfidenceThreshold,
        dailyDecisionLimit: updates.dailyDecisionLimit ?? current.dailyDecisionLimit,
        dailyAutoExecuteLimit: updates.dailyAutoExecuteLimit ?? current.dailyAutoExecuteLimit,
        notifyOnDecision: updates.notifyOnDecision ?? current.notifyOnDecision,
        notifyOnAutoExecute: updates.notifyOnAutoExecute ?? current.notifyOnAutoExecute,
        notifyEmail: updates.notifyEmail ?? current.notifyEmail,
        allowedAutonomousTypes: updates.allowedAutonomousTypes 
          ? JSON.stringify(updates.allowedAutonomousTypes)
          : JSON.stringify(current.allowedAutonomousTypes),
        forbiddenPatterns: updates.forbiddenPatterns
          ? JSON.stringify(updates.forbiddenPatterns)
          : JSON.stringify(current.forbiddenPatterns),
        learningEnabled: updates.learningEnabled ?? current.learningEnabled,
        feedbackLoopDays: updates.feedbackLoopDays ?? current.feedbackLoopDays,
        killSwitch: updates.killSwitch ?? current.killSwitch,
        pausedUntil: updates.pausedUntil ?? current.pausedUntil,
        pauseReason: updates.pauseReason ?? current.pauseReason,
      },
    });

    await this.log('INFO', 'config', 'Agent configuration updated', { updates });

    return this.getConfig();
  }

  /**
   * Get agent state
   */
  async getState(): Promise<AgentState> {
    const dailyStats = await this.getDailyStats();
    const pendingDecisions = await prisma.aIDecision.count({
      where: { status: 'PENDING' },
    });

    const lastLog = await prisma.aIAgentLog.findFirst({
      where: { category: 'analysis' },
      orderBy: { createdAt: 'desc' },
    });

    return {
      isRunning: this.isRunning,
      lastRunAt: lastLog?.createdAt || null,
      decisionsToday: dailyStats.decisionsToday,
      autoExecutesToday: dailyStats.autoExecutesToday,
      pendingDecisions,
      currentTask: this.currentTask,
    };
  }

  /**
   * Get daily statistics
   */
  private async getDailyStats(): Promise<{ decisionsToday: number; autoExecutesToday: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [decisionsToday, autoExecutesToday] = await Promise.all([
      prisma.aIDecision.count({
        where: { createdAt: { gte: today } },
      }),
      prisma.aIDecision.count({
        where: {
          createdAt: { gte: today },
          autoApproved: true,
          status: 'EXECUTED',
        },
      }),
    ]);

    return { decisionsToday, autoExecutesToday };
  }

  /**
   * Store an opportunity
   */
  private async storeOpportunity(opportunity: Opportunity, decisionId?: string): Promise<void> {
    await prisma.aIOpportunity.create({
      data: {
        type: opportunity.type,
        subType: opportunity.subType,
        title: opportunity.title,
        description: opportunity.description,
        trigger: opportunity.trigger,
        priority: opportunity.priority,
        estimatedEffort: opportunity.estimatedEffort,
        estimatedImpact: opportunity.estimatedImpact,
        potentialRevenue: opportunity.potentialRevenue,
        potentialLeads: opportunity.potentialLeads,
        decisionId,
        status: decisionId ? 'DECISION_MADE' : 'IDENTIFIED',
      },
    });
  }

  /**
   * Log agent activity
   */
  private async log(
    level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL',
    category: string,
    message: string,
    data?: Record<string, unknown>,
    decisionId?: string
  ): Promise<void> {
    await prisma.aIAgentLog.create({
      data: {
        level,
        category,
        message,
        data: data || {},
        decisionId,
      },
    });
  }

  /**
   * Get recent logs
   */
  async getLogs(options: {
    limit?: number;
    level?: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
    category?: string;
  } = {}): Promise<Array<{
    id: string;
    level: string;
    category: string;
    message: string;
    data: unknown;
    createdAt: Date;
  }>> {
    const where: Record<string, unknown> = {};
    if (options.level) where.level = options.level;
    if (options.category) where.category = options.category;

    return prisma.aIAgentLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options.limit || 50,
    });
  }

  /**
   * Get pending decisions
   */
  async getPendingDecisions(): Promise<Array<{
    id: string;
    type: string;
    priority: string;
    confidence: number;
    reasoning: string;
    createdAt: Date;
  }>> {
    return prisma.aIDecision.findMany({
      where: { status: 'PENDING' },
      orderBy: [
        { priority: 'asc' },
        { createdAt: 'desc' },
      ],
      select: {
        id: true,
        type: true,
        priority: true,
        confidence: true,
        reasoning: true,
        createdAt: true,
      },
    });
  }

  /**
   * Get recent decisions with full details including data snapshot and actions
   */
  async getRecentDecisions(limit: number = 20): Promise<Array<{
    id: string;
    type: string;
    subType: string | null;
    priority: string;
    confidence: number;
    reasoning: string;
    status: string;
    wasSuccessful: boolean | null;
    createdAt: Date;
    executedAt: Date | null;
    dataSnapshot: Record<string, unknown> | null;
    actionPayload: Record<string, unknown> | null;
    estimatedImpact: string | null;
    executionResult: Record<string, unknown> | null;
  }>> {
    return prisma.aIDecision.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        type: true,
        subType: true,
        priority: true,
        confidence: true,
        reasoning: true,
        status: true,
        wasSuccessful: true,
        createdAt: true,
        executedAt: true,
        dataSnapshot: true,
        actionPayload: true,
        estimatedImpact: true,
        executionResult: true,
      },
    });
  }

  /**
   * Emergency stop - disable all AI operations
   */
  async emergencyStop(reason: string): Promise<void> {
    await prisma.aIAgentConfig.update({
      where: { id: 'default' },
      data: {
        killSwitch: true,
        pauseReason: `EMERGENCY STOP: ${reason}`,
      },
    });

    await this.log('CRITICAL', 'emergency', `Emergency stop activated: ${reason}`);
  }

  /**
   * Resume after emergency stop
   */
  async resume(): Promise<void> {
    await prisma.aIAgentConfig.update({
      where: { id: 'default' },
      data: {
        killSwitch: false,
        pauseReason: null,
        pausedUntil: null,
      },
    });

    await this.log('INFO', 'resume', 'Agent resumed after emergency stop');
  }
}

// Singleton instance
export const agent = new RealEstateAIAgent();

