// ============================================
// AI DECISION ENGINE
// Uses OpenAI to analyze data and make decisions
// ============================================

import OpenAI from 'openai';
import prisma from '@/lib/prisma';
import type {
  AIDecisionPayload,
  DataSnapshot,
  Opportunity,
  AnalysisRequest,
  AnalysisResult,
  DecisionType,
  AgentConfig,
} from './types';
import { dataCollector } from './data-collector';

export class AIDecisionEngine {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Run a complete analysis and generate decisions
   */
  async analyze(request: AnalysisRequest): Promise<AnalysisResult> {
    const startTime = Date.now();
    
    // Get agent config
    const config = await this.getConfig();
    
    if (config.killSwitch) {
      throw new Error('AI Agent is disabled via kill switch');
    }

    if (config.pausedUntil && new Date() < config.pausedUntil) {
      throw new Error(`AI Agent is paused until ${config.pausedUntil.toISOString()}: ${config.pauseReason}`);
    }

    // Collect data
    const daysBack = request.type === 'quick' ? 7 : 30;
    const snapshot = await dataCollector.collectSnapshot(daysBack);

    // Store snapshot for history
    await dataCollector.storeSnapshot(snapshot, 'triggered');

    // Identify opportunities
    const opportunities = await this.identifyOpportunities(snapshot, config);

    // Generate decisions for high-priority opportunities
    const decisions = await this.generateDecisions(opportunities, snapshot, config);

    // Extract insights
    const insights = this.extractInsights(snapshot);
    const warnings = this.extractWarnings(snapshot);

    // Calculate overall confidence
    const confidence = this.calculateConfidence(snapshot, decisions);

    return {
      opportunities,
      decisions,
      insights,
      warnings,
      dataSnapshot: snapshot,
      analysisTime: Date.now() - startTime,
      confidence,
    };
  }

  /**
   * Identify improvement opportunities from data
   */
  private async identifyOpportunities(snapshot: DataSnapshot, config: AgentConfig): Promise<Opportunity[]> {
    const opportunities: Opportunity[] = [];

    // 1. Check for content gaps
    if (snapshot.seo.contentGaps.length > 0) {
      for (const gap of snapshot.seo.contentGaps.slice(0, 3)) {
        opportunities.push({
          type: 'content_gap',
          title: `Create content for "${gap.keyword}"`,
          description: `There's search demand for "${gap.keyword}" with ${gap.searchVolume} monthly searches, but we have no content targeting this keyword.`,
          trigger: 'SEO content gap analysis',
          priority: Math.min(10, Math.floor(gap.searchVolume / 100) + 3),
          estimatedEffort: 'medium',
          estimatedImpact: 'medium',
          potentialLeads: Math.floor(gap.searchVolume * 0.02 * 0.05), // 2% CTR, 5% conversion
          dataEvidence: { keyword: gap.keyword, searchVolume: gap.searchVolume },
        });
      }
    }

    // 2. Check for low-performing properties
    for (const property of snapshot.properties.lowPerforming) {
      opportunities.push({
        type: 'conversion',
        subType: 'property_optimization',
        title: `Optimize property: ${property.title}`,
        description: `This property has ${property.views} views but 0% conversion rate. Consider updating images, description, or pricing.`,
        trigger: 'Conversion rate analysis',
        priority: 7,
        estimatedEffort: 'small',
        estimatedImpact: 'medium',
        potentialLeads: Math.floor(property.views * 0.03), // 3% expected conversion
        dataEvidence: property,
      });
    }

    // 3. Check for missing SEO elements
    if (snapshot.seo.missingMetaTags.length > 10) {
      opportunities.push({
        type: 'seo',
        subType: 'meta_optimization',
        title: 'Fix missing meta descriptions',
        description: `${snapshot.seo.missingMetaTags.length} pages are missing meta descriptions. This hurts SEO and click-through rates.`,
        trigger: 'SEO audit',
        priority: 6,
        estimatedEffort: 'medium',
        estimatedImpact: 'medium',
        dataEvidence: { count: snapshot.seo.missingMetaTags.length },
      });
    }

    // 4. Check for system errors
    if (snapshot.systemHealth.errorCount > 5) {
      opportunities.push({
        type: 'bug',
        title: 'Fix system errors',
        description: `${snapshot.systemHealth.errorCount} errors detected. Most common: ${Object.entries(snapshot.systemHealth.errorsByType).slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(', ')}`,
        trigger: 'Error monitoring',
        priority: 9,
        estimatedEffort: 'small',
        estimatedImpact: 'high',
        dataEvidence: snapshot.systemHealth.errorsByType,
      });
    }

    // 5. Check traffic trends
    if (snapshot.traffic.totalViews < 100) {
      opportunities.push({
        type: 'content_gap',
        title: 'Increase content production',
        description: `Low traffic detected (${snapshot.traffic.totalViews} views). Consider creating more content to drive organic traffic.`,
        trigger: 'Traffic analysis',
        priority: 8,
        estimatedEffort: 'large',
        estimatedImpact: 'high',
        dataEvidence: { totalViews: snapshot.traffic.totalViews },
      });
    }

    // 6. Check lead conversion rate
    if (snapshot.leads.conversionRate !== null && snapshot.leads.conversionRate < 1) {
      opportunities.push({
        type: 'conversion',
        title: 'Improve lead conversion',
        description: `Current conversion rate is ${snapshot.leads.conversionRate.toFixed(2)}%. Industry average is 2-3%. Consider A/B testing contact forms.`,
        trigger: 'Conversion analysis',
        priority: 8,
        estimatedEffort: 'medium',
        estimatedImpact: 'high',
        dataEvidence: { conversionRate: snapshot.leads.conversionRate },
      });
    }

    // Sort by priority
    return opportunities.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Generate actionable decisions from opportunities
   */
  private async generateDecisions(
    opportunities: Opportunity[],
    snapshot: DataSnapshot,
    config: AgentConfig
  ): Promise<AIDecisionPayload[]> {
    const decisions: AIDecisionPayload[] = [];

    // Check for existing pending/approved decisions to avoid duplicates
    const existingDecisions = await prisma.aIDecision.findMany({
      where: {
        status: { in: ['PENDING', 'APPROVED'] },
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
      },
      select: { type: true, subType: true },
    });

    const existingTypes = new Set(
      existingDecisions.map((d: { type: string; subType: string | null }) => `${d.type}:${d.subType || 'general'}`)
    );

    // Take top opportunities that we can act on
    const actionableOpportunities = opportunities.filter(o => 
      o.priority >= 5 && 
      ['content_gap', 'bug', 'seo', 'conversion'].includes(o.type)
    ).slice(0, 5);

    for (const opportunity of actionableOpportunities) {
      // Skip if we already have a pending/approved decision for this type
      const opportunityKey = `${this.mapOpportunityToDecisionType(opportunity.type)}:${opportunity.type}`;
      if (existingTypes.has(opportunityKey)) {
        console.log(`Skipping duplicate decision for: ${opportunityKey}`);
        continue;
      }

      try {
        const decision = await this.generateDecisionForOpportunity(opportunity, snapshot, config);
        if (decision) {
          decisions.push(decision);
          // Add to set to prevent duplicates within this run
          existingTypes.add(`${decision.type}:${decision.subType || 'general'}`);
        }
      } catch (error) {
        console.error(`Failed to generate decision for opportunity: ${opportunity.title}`, error);
      }
    }

    return decisions;
  }

  /**
   * Map opportunity type to decision type
   */
  private mapOpportunityToDecisionType(opportunityType: string): string {
    const mapping: Record<string, string> = {
      'content_gap': 'CONTENT_CREATION',
      'bug': 'BUG_FIX',
      'seo': 'SEO_OPTIMIZATION',
      'conversion': 'CONVERSION_OPTIMIZATION',
    };
    return mapping[opportunityType] || 'OTHER';
  }

  /**
   * Generate a specific decision for an opportunity using AI
   */
  private async generateDecisionForOpportunity(
    opportunity: Opportunity,
    snapshot: DataSnapshot,
    config: AgentConfig
  ): Promise<AIDecisionPayload | null> {
    const systemPrompt = `You are an AI agent for a real estate platform (PSM Phuket).
Your goal is to maximize revenue by improving the website, content, and lead generation.

You can make these types of decisions:
- CONTENT_CREATION: Generate new blog posts, landing pages
- BUG_FIX: Fix detected issues in the system
- SEO_OPTIMIZATION: Improve meta tags, structure, keywords
- CONVERSION_OPTIMIZATION: Improve forms, CTAs, user flows
- FEATURE_CREATION: Build new functionality

For each decision, provide:
1. The exact action to take
2. The expected impact
3. A rollback plan if things go wrong
4. Confidence level (0-100)

Be specific and actionable. Don't suggest vague improvements.
Return your response as valid JSON.`;

    const userPrompt = `Analyze this opportunity and create a concrete decision:

OPPORTUNITY:
Type: ${opportunity.type}
Title: ${opportunity.title}
Description: ${opportunity.description}
Priority: ${opportunity.priority}/10
Estimated Effort: ${opportunity.estimatedEffort}
Expected Impact: ${opportunity.estimatedImpact}

CURRENT DATA:
- Total views: ${snapshot.traffic.totalViews}
- Conversion rate: ${snapshot.leads.conversionRate?.toFixed(2) || 'N/A'}%
- Active properties: ${snapshot.properties.active}
- Published blogs: ${snapshot.content.publishedBlogs}
- Errors: ${snapshot.systemHealth.errorCount}

Create a decision with this exact JSON structure:
{
  "type": "CONTENT_CREATION | BUG_FIX | SEO_OPTIMIZATION | CONVERSION_OPTIMIZATION | FEATURE_CREATION",
  "subType": "optional specific type",
  "priority": "critical | high | medium | low",
  "confidence": 0-100,
  "reasoning": "Why this decision was made",
  "action": {
    "type": "CREATE_BLOG | MODIFY_FILE | CREATE_FILE | etc",
    "payload": { specific action details }
  },
  "expectedImpact": "What we expect to happen",
  "rollbackPlan": "How to undo this if needed",
  "requiresApproval": true/false,
  "autoExecute": true/false
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return null;

      const parsed = JSON.parse(content);
      
      // Validate and normalize the decision
      const decision: AIDecisionPayload = {
        type: parsed.type as DecisionType,
        subType: parsed.subType,
        priority: parsed.priority || 'medium',
        confidence: Math.min(100, Math.max(0, parsed.confidence || 50)),
        reasoning: parsed.reasoning || opportunity.description,
        action: parsed.action || { type: 'ALERT', payload: {} },
        expectedImpact: parsed.expectedImpact || opportunity.estimatedImpact,
        rollbackPlan: parsed.rollbackPlan,
        requiresApproval: parsed.requiresApproval !== false, // Default true
        autoExecute: parsed.autoExecute === true && 
                     config.autonomousMode && 
                     parsed.confidence >= config.minConfidenceThreshold &&
                     config.allowedAutonomousTypes.includes(parsed.type as DecisionType),
        dataSnapshot: opportunity.dataEvidence,
      };

      return decision;
    } catch (error) {
      console.error('Failed to generate decision with AI:', error);
      return null;
    }
  }

  /**
   * Extract insights from data snapshot
   */
  private extractInsights(snapshot: DataSnapshot): string[] {
    const insights: string[] = [];

    // Traffic insights
    if (snapshot.traffic.viewsByCountry.length > 0) {
      const topCountry = snapshot.traffic.viewsByCountry[0];
      insights.push(`Top traffic source: ${topCountry.country} with ${topCountry.views} views`);
    }

    // Conversion insights
    if (snapshot.leads.conversionRate !== null) {
      if (snapshot.leads.conversionRate >= 3) {
        insights.push(`Strong conversion rate of ${snapshot.leads.conversionRate.toFixed(2)}%`);
      } else if (snapshot.leads.conversionRate >= 1) {
        insights.push(`Conversion rate of ${snapshot.leads.conversionRate.toFixed(2)}% is below industry average (2-3%)`);
      }
    }

    // Property insights
    if (snapshot.properties.lowPerforming.length > 0) {
      insights.push(`${snapshot.properties.lowPerforming.length} properties with views but no inquiries`);
    }

    // Content insights
    const blogRatio = snapshot.content.publishedBlogs / Math.max(1, snapshot.content.totalBlogs);
    if (blogRatio < 0.5) {
      insights.push(`${Math.round((1 - blogRatio) * 100)}% of blogs are unpublished`);
    }

    return insights;
  }

  /**
   * Extract warnings from data snapshot
   */
  private extractWarnings(snapshot: DataSnapshot): string[] {
    const warnings: string[] = [];

    // Error warnings
    if (snapshot.systemHealth.errorCount > 10) {
      warnings.push(`High error count: ${snapshot.systemHealth.errorCount} errors detected`);
    }

    // Traffic warnings
    if (snapshot.traffic.totalViews === 0) {
      warnings.push('No traffic recorded in the analysis period');
    }

    // SEO warnings
    if (snapshot.seo.missingMetaTags.length > 20) {
      warnings.push(`${snapshot.seo.missingMetaTags.length} pages missing meta descriptions`);
    }

    // Slow pages
    const slowPages = snapshot.systemHealth.slowPages.filter(p => p.loadTime > 3000);
    if (slowPages.length > 0) {
      warnings.push(`${slowPages.length} pages loading slower than 3 seconds`);
    }

    return warnings;
  }

  /**
   * Calculate overall confidence in the analysis
   */
  private calculateConfidence(snapshot: DataSnapshot, decisions: AIDecisionPayload[]): number {
    let confidence = 70; // Base confidence

    // More data = higher confidence
    if (snapshot.traffic.totalViews > 1000) confidence += 10;
    if (snapshot.leads.totalInquiries > 10) confidence += 10;
    
    // Errors reduce confidence
    if (snapshot.systemHealth.errorCount > 10) confidence -= 10;

    // More decisions generated = higher confidence
    if (decisions.length > 3) confidence += 5;

    return Math.min(100, Math.max(0, confidence));
  }

  /**
   * Get agent configuration
   */
  async getConfig(): Promise<AgentConfig> {
    const config = await prisma.aIAgentConfig.findUnique({
      where: { id: 'default' },
    });

    if (!config) {
      // Create default config
      const newConfig = await prisma.aIAgentConfig.create({
        data: {
          id: 'default',
          enabled: true,
          autonomousMode: false,
          minConfidenceThreshold: 80,
          dailyDecisionLimit: 20,
          dailyAutoExecuteLimit: 5,
          notifyOnDecision: true,
          notifyOnAutoExecute: true,
          allowedAutonomousTypes: '["CONTENT_CREATION", "SEO_OPTIMIZATION"]',
          forbiddenPatterns: '["auth/", "prisma/schema.prisma", ".env"]',
        },
      });
      return this.parseConfig(newConfig);
    }

    return this.parseConfig(config);
  }

  /**
   * Parse config from database format
   */
  private parseConfig(config: {
    enabled: boolean;
    autonomousMode: boolean;
    minConfidenceThreshold: number;
    dailyDecisionLimit: number;
    dailyAutoExecuteLimit: number;
    notifyOnDecision: boolean;
    notifyOnAutoExecute: boolean;
    notifyEmail: string | null;
    allowedAutonomousTypes: string;
    forbiddenPatterns: string;
    learningEnabled: boolean;
    feedbackLoopDays: number;
    killSwitch: boolean;
    pausedUntil: Date | null;
    pauseReason: string | null;
  }): AgentConfig {
    return {
      ...config,
      allowedAutonomousTypes: JSON.parse(config.allowedAutonomousTypes || '[]'),
      forbiddenPatterns: JSON.parse(config.forbiddenPatterns || '[]'),
    };
  }

  /**
   * Store a decision in the database
   */
  async storeDecision(decision: AIDecisionPayload): Promise<string> {
    const created = await prisma.aIDecision.create({
      data: {
        type: decision.type,
        subType: decision.subType,
        priority: decision.priority,
        confidence: decision.confidence,
        reasoning: decision.reasoning,
        dataSnapshot: decision.dataSnapshot || {},
        actionType: decision.action.type,
        actionPayload: decision.action.payload,
        estimatedImpact: decision.expectedImpact,
        rollbackPlan: decision.rollbackPlan,
        requiresApproval: decision.requiresApproval,
        autoApproved: decision.autoExecute,
        status: decision.autoExecute ? 'APPROVED' : 'PENDING',
        feedbackDueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Log the decision
    await prisma.aIAgentLog.create({
      data: {
        level: 'INFO',
        category: 'decision',
        message: `Decision created: ${decision.type} - ${decision.reasoning.substring(0, 100)}`,
        data: { decision },
        decisionId: created.id,
      },
    });

    return created.id;
  }
}

// Singleton instance
export const decisionEngine = new AIDecisionEngine();

