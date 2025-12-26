// ============================================
// AI AGENT MODULE EXPORTS
// Central export point for the AI Agent system
// ============================================

// Core agent
export { agent, RealEstateAIAgent } from './agent';

// Components
export { dataCollector, AIDataCollector } from './data-collector';
export { decisionEngine, AIDecisionEngine } from './decision-engine';
export { codeGenerator, AICodeGenerator } from './code-generator';
export { sandbox, AICodeSandbox } from './sandbox';
export { deployer, AISafeDeployer } from './deployer';
export { selfImprovement, SelfImprovementEngine } from './self-improvement';

// Types
export type {
  // Core types
  DecisionType,
  DecisionPriority,
  ActionType,
  AIDecisionPayload,
  AIAction,
  
  // Generated code
  GeneratedCode,
  GeneratedFile,
  
  // Data types
  DataSnapshot,
  Opportunity,
  OpportunityType,
  
  // Results
  ExecutionResult,
  SandboxResult,
  
  // Analysis
  AnalysisRequest,
  AnalysisResult,
  
  // Config & State
  AgentConfig,
  AgentState,
  
  // Learning
  Learning,
} from './types';

