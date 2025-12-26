// ============================================
// SELF-IMPROVEMENT ENGINE
// Learns from past decisions and improves over time
// ============================================

import prisma from '@/lib/prisma';
import OpenAI from 'openai';
import type { Learning } from './types';

export class SelfImprovementEngine {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Analyze executed decisions and extract learnings
   */
  async analyzePastDecisions(): Promise<Learning[]> {
    // Get decisions that have feedback
    const decisionsWithFeedback = await prisma.aIDecision.findMany({
      where: {
        status: 'EXECUTED',
        wasSuccessful: { not: null },
      },
      orderBy: { executedAt: 'desc' },
      take: 100,
    });

    if (decisionsWithFeedback.length < 5) {
      return []; // Not enough data to learn from
    }

    // Separate successful and failed decisions
    const successful = decisionsWithFeedback.filter(d => d.wasSuccessful);
    const failed = decisionsWithFeedback.filter(d => !d.wasSuccessful);

    const learnings: Learning[] = [];

    // Learn from success patterns
    if (successful.length >= 3) {
      const successPatterns = await this.extractPatterns(successful, 'successful');
      learnings.push(...successPatterns);
    }

    // Learn from failure patterns
    if (failed.length >= 3) {
      const failurePatterns = await this.extractPatterns(failed, 'failed');
      learnings.push(...failurePatterns);
    }

    // Store learnings in database
    for (const learning of learnings) {
      await prisma.aILearning.create({
        data: {
          category: learning.category,
          insight: learning.insight,
          sourceDecisionId: learning.sourceDecisionId,
          confidence: learning.confidence,
          impactArea: learning.impactArea,
          adjustment: learning.adjustment,
        },
      });
    }

    return learnings;
  }

  /**
   * Extract patterns from a set of decisions
   */
  private async extractPatterns(
    decisions: Array<{
      id: string;
      type: string;
      subType: string | null;
      priority: string;
      confidence: number;
      reasoning: string;
      successScore: number | null;
      feedbackNotes: string | null;
    }>,
    outcome: 'successful' | 'failed'
  ): Promise<Learning[]> {
    const prompt = `Analyze these ${outcome} AI decisions and extract learnings:

${JSON.stringify(decisions.map(d => ({
  type: d.type,
  subType: d.subType,
  priority: d.priority,
  confidence: d.confidence,
  reasoning: d.reasoning.substring(0, 200),
  successScore: d.successScore,
  feedback: d.feedbackNotes,
})), null, 2)}

For each pattern you identify, provide:
1. What type of decisions tend to ${outcome === 'successful' ? 'succeed' : 'fail'}
2. What confidence levels are associated with ${outcome === 'successful' ? 'success' : 'failure'}
3. What adjustments should be made to future decision-making

Return a JSON array of learnings:
[{
  "category": "pattern type",
  "insight": "what was learned",
  "confidence": 0-100,
  "impactArea": "what area this affects",
  "adjustment": "how to adjust future behavior"
}]`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an AI system analyzing your own past decisions to improve future performance.',
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.5,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return [];

      const parsed = JSON.parse(content);
      const learningsArray = parsed.learnings || parsed;

      return (Array.isArray(learningsArray) ? learningsArray : []).map((l: Record<string, unknown>) => ({
        category: l.category as string || 'general',
        insight: l.insight as string || 'No insight extracted',
        confidence: typeof l.confidence === 'number' ? l.confidence : 50,
        impactArea: l.impactArea as string || 'decision_making',
        adjustment: l.adjustment as string || 'No adjustment suggested',
        sourceDecisionId: decisions[0]?.id,
      }));
    } catch (error) {
      console.error('Failed to extract patterns:', error);
      return [];
    }
  }

  /**
   * Get stored learnings for a specific area
   */
  async getLearningsForArea(impactArea: string): Promise<Learning[]> {
    const learnings = await prisma.aILearning.findMany({
      where: {
        impactArea,
        isValid: true,
      },
      orderBy: { confidence: 'desc' },
      take: 10,
    });

    return learnings.map(l => ({
      category: l.category,
      insight: l.insight,
      confidence: l.confidence,
      impactArea: l.impactArea,
      adjustment: l.adjustment,
      sourceDecisionId: l.sourceDecisionId || undefined,
    }));
  }

  /**
   * Apply learnings to improve decision confidence
   */
  async adjustConfidence(
    decisionType: string,
    baseConfidence: number
  ): Promise<number> {
    // Get relevant learnings
    const learnings = await prisma.aILearning.findMany({
      where: {
        OR: [
          { impactArea: decisionType },
          { category: 'confidence_calibration' },
        ],
        isValid: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    if (learnings.length === 0) return baseConfidence;

    // Calculate adjustment based on learnings
    let adjustment = 0;
    let totalWeight = 0;

    for (const learning of learnings) {
      const weight = learning.confidence / 100;
      
      // Check if adjustment suggests increasing or decreasing confidence
      if (learning.adjustment.toLowerCase().includes('increase confidence')) {
        adjustment += 5 * weight;
      } else if (learning.adjustment.toLowerCase().includes('decrease confidence')) {
        adjustment -= 5 * weight;
      }
      
      totalWeight += weight;
    }

    if (totalWeight > 0) {
      adjustment = adjustment / totalWeight;
    }

    // Apply adjustment within bounds
    return Math.min(100, Math.max(0, baseConfidence + adjustment));
  }

  /**
   * Get success rate by decision type
   */
  async getSuccessRateByType(): Promise<Record<string, { total: number; successful: number; rate: number }>> {
    const decisions = await prisma.aIDecision.groupBy({
      by: ['type'],
      where: {
        status: 'EXECUTED',
        wasSuccessful: { not: null },
      },
      _count: { id: true },
    });

    const successfulByType = await prisma.aIDecision.groupBy({
      by: ['type'],
      where: {
        status: 'EXECUTED',
        wasSuccessful: true,
      },
      _count: { id: true },
    });

    const result: Record<string, { total: number; successful: number; rate: number }> = {};

    for (const item of decisions) {
      const successItem = successfulByType.find(s => s.type === item.type);
      const successful = successItem?._count.id || 0;
      const total = item._count.id;
      
      result[item.type] = {
        total,
        successful,
        rate: total > 0 ? (successful / total) * 100 : 0,
      };
    }

    return result;
  }

  /**
   * Identify areas needing improvement
   */
  async identifyWeakAreas(): Promise<Array<{ type: string; issue: string; suggestion: string }>> {
    const successRates = await this.getSuccessRateByType();
    const weakAreas: Array<{ type: string; issue: string; suggestion: string }> = [];

    for (const [type, stats] of Object.entries(successRates)) {
      if (stats.total >= 5 && stats.rate < 50) {
        weakAreas.push({
          type,
          issue: `Low success rate: ${stats.rate.toFixed(1)}% (${stats.successful}/${stats.total})`,
          suggestion: `Consider requiring higher confidence for ${type} decisions or requesting human approval`,
        });
      }
    }

    return weakAreas;
  }

  /**
   * Generate improvement recommendations
   */
  async generateRecommendations(): Promise<string[]> {
    const [weakAreas, successRates, recentFailures] = await Promise.all([
      this.identifyWeakAreas(),
      this.getSuccessRateByType(),
      prisma.aIDecision.findMany({
        where: {
          status: 'EXECUTED',
          wasSuccessful: false,
        },
        orderBy: { executedAt: 'desc' },
        take: 10,
        select: {
          type: true,
          reasoning: true,
          feedbackNotes: true,
        },
      }),
    ]);

    const recommendations: string[] = [];

    // Recommendations based on weak areas
    for (const area of weakAreas) {
      recommendations.push(
        `⚠️ ${area.type}: ${area.issue}. ${area.suggestion}`
      );
    }

    // Recommendations based on success rates
    const highPerformers = Object.entries(successRates)
      .filter(([, stats]) => stats.total >= 5 && stats.rate >= 80)
      .map(([type]) => type);

    if (highPerformers.length > 0) {
      recommendations.push(
        `✅ Consider enabling autonomous mode for: ${highPerformers.join(', ')}`
      );
    }

    // General recommendations
    if (recentFailures.length >= 3) {
      const failureTypes = [...new Set(recentFailures.map(f => f.type))];
      recommendations.push(
        `🔍 Review recent failures in: ${failureTypes.join(', ')}`
      );
    }

    return recommendations;
  }

  /**
   * Check pending decisions for feedback collection
   */
  async collectDueFeedback(): Promise<number> {
    const dueDecisions = await prisma.aIDecision.findMany({
      where: {
        status: 'EXECUTED',
        wasSuccessful: null,
        feedbackDueAt: { lte: new Date() },
      },
    });

    // These decisions need feedback - in a full implementation,
    // we would send notifications or try to auto-assess based on metrics
    return dueDecisions.length;
  }
}

// Singleton instance
export const selfImprovement = new SelfImprovementEngine();

