// ============================================
// AI AGENT TYPE DEFINITIONS
// Core types for the Autonomous AI Agent System
// ============================================

// Decision Types - What kinds of decisions can the AI make?
export type DecisionType =
  | 'CONTENT_CREATION'      // Create new blogs, landing pages
  | 'CONTENT_OPTIMIZATION'  // Improve existing content
  | 'BUG_FIX'               // Fix detected bugs/errors
  | 'SEO_OPTIMIZATION'      // Meta tags, keywords, structure
  | 'PERFORMANCE_FIX'       // Speed, loading issues
  | 'CONVERSION_OPTIMIZATION' // Improve lead capture
  | 'PROPERTY_PROMOTION'    // Highlight specific properties
  | 'PRICING_SUGGESTION'    // Suggest price adjustments
  | 'FEATURE_CREATION'      // Build new features
  | 'CODE_REFACTOR'         // Improve code quality
  | 'SECURITY_FIX'          // Security vulnerabilities
  | 'ALERT'                 // Send notifications/warnings
  | 'DATA_CLEANUP'          // Clean up data issues
  | 'INTEGRATION'           // Add new integrations
  | 'A_B_TEST';             // Start experiments

export type DecisionPriority = 'critical' | 'high' | 'medium' | 'low';

export type ActionType =
  | 'CREATE_FILE'
  | 'MODIFY_FILE'
  | 'DELETE_FILE'
  | 'CREATE_BLOG'
  | 'UPDATE_BLOG'
  | 'CREATE_API'
  | 'UPDATE_DATABASE'
  | 'SEND_EMAIL'
  | 'SEND_NOTIFICATION'
  | 'CREATE_COMPONENT'
  | 'RUN_MIGRATION'
  | 'DEPLOY_PREVIEW'
  | 'SCHEDULE_TASK';

// Core interfaces
export interface AIDecisionPayload {
  type: DecisionType;
  subType?: string;
  priority: DecisionPriority;
  confidence: number; // 0-100
  reasoning: string;
  action: AIAction;
  expectedImpact: string;
  rollbackPlan?: string;
  requiresApproval: boolean;
  autoExecute: boolean;
  dataSnapshot?: Record<string, unknown>;
}

export interface AIAction {
  type: ActionType;
  payload: Record<string, unknown>;
}

export interface GeneratedCode {
  files: GeneratedFile[];
  testFiles?: GeneratedFile[];
  explanation: string;
  estimatedImpact: string;
  rollbackPlan: string;
}

export interface GeneratedFile {
  path: string;
  content: string;
  action: 'CREATE' | 'MODIFY' | 'DELETE';
  language?: string;
}

// Data Collection Types
export interface DataSnapshot {
  // Traffic & Views
  traffic: {
    totalViews: number;
    uniqueVisitors: number;
    bounceRate: number | null;
    avgSessionDuration: number | null;
    viewsByCountry: Array<{ country: string; views: number }>;
    topPages: Array<{ path: string; views: number }>;
  };

  // Leads & Conversions
  leads: {
    totalInquiries: number;
    viewingRequests: number;
    investorLeads: number;
    rentalLeads: number;
    conversionRate: number | null;
    leadsBySource: Array<{ source: string; count: number }>;
  };

  // Properties
  properties: {
    total: number;
    active: number;
    new: number;
    avgViews: number;
    topViewed: Array<{ id: string; title: string; views: number }>;
    lowPerforming: Array<{ id: string; title: string; views: number; conversionRate: number }>;
  };

  // Content
  content: {
    totalBlogs: number;
    publishedBlogs: number;
    avgBlogViews: number;
    topBlogs: Array<{ id: string; title: string; views: number }>;
    underperformingBlogs: Array<{ id: string; title: string; views: number }>;
  };

  // System Health
  systemHealth: {
    errorCount: number;
    errorsByType: Record<string, number>;
    slowPages: Array<{ path: string; loadTime: number }>;
    brokenLinks: Array<{ url: string; source: string }>;
  };

  // Search & SEO
  seo: {
    organicTraffic: number | null;
    topKeywords: Array<{ keyword: string; position: number; clicks: number }>;
    missingMetaTags: Array<{ path: string; missing: string[] }>;
    contentGaps: Array<{ keyword: string; searchVolume: number }>;
  };

  // Timestamp
  collectedAt: Date;
  periodStart: Date;
  periodEnd: Date;
}

// Opportunity Types
export interface Opportunity {
  type: OpportunityType;
  subType?: string;
  title: string;
  description: string;
  trigger: string;
  priority: number; // 1-10
  estimatedEffort: 'small' | 'medium' | 'large';
  estimatedImpact: 'low' | 'medium' | 'high';
  potentialRevenue?: number;
  potentialLeads?: number;
  dataEvidence: Record<string, unknown>;
}

export type OpportunityType =
  | 'content_gap'
  | 'bug'
  | 'performance'
  | 'seo'
  | 'conversion'
  | 'feature'
  | 'market_trend'
  | 'competitor'
  | 'pricing'
  | 'engagement';

// Execution Results
export interface ExecutionResult {
  success: boolean;
  executedAt: Date;
  duration: number; // ms
  filesChanged: string[];
  error?: string;
  output?: string;
  rollbackAvailable: boolean;
}

export interface SandboxResult {
  success: boolean;
  buildPassed: boolean;
  typeCheckPassed: boolean;
  lintPassed: boolean;
  testsPassed: boolean | null;
  errors: string[];
  warnings: string[];
  duration: number;
}

// Learning Types
export interface Learning {
  category: string;
  insight: string;
  confidence: number;
  impactArea: string;
  adjustment: string;
  sourceDecisionId?: string;
}

// Agent Configuration
export interface AgentConfig {
  enabled: boolean;
  autonomousMode: boolean;
  minConfidenceThreshold: number;
  dailyDecisionLimit: number;
  dailyAutoExecuteLimit: number;
  notifyOnDecision: boolean;
  notifyOnAutoExecute: boolean;
  notifyEmail: string | null;
  allowedAutonomousTypes: DecisionType[];
  forbiddenPatterns: string[];
  learningEnabled: boolean;
  feedbackLoopDays: number;
  killSwitch: boolean;
  pausedUntil: Date | null;
  pauseReason: string | null;
}

// Agent State
export interface AgentState {
  isRunning: boolean;
  lastRunAt: Date | null;
  decisionsToday: number;
  autoExecutesToday: number;
  pendingDecisions: number;
  currentTask: string | null;
}

// Analysis Request
export interface AnalysisRequest {
  type: 'full' | 'quick' | 'focused';
  focusAreas?: DecisionType[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  includeCodeAnalysis?: boolean;
  includeSeoAnalysis?: boolean;
  includeCompetitorAnalysis?: boolean;
}

// Analysis Result
export interface AnalysisResult {
  opportunities: Opportunity[];
  decisions: AIDecisionPayload[];
  insights: string[];
  warnings: string[];
  dataSnapshot: DataSnapshot;
  analysisTime: number;
  confidence: number;
}

