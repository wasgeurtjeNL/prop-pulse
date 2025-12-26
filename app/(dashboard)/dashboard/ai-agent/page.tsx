// ============================================
// AI AGENT DASHBOARD
// Control panel for the autonomous AI system
// ============================================

import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bot, Brain, Zap, Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AIAgentStatus } from './components/ai-agent-status';
import { AIAgentDecisions } from './components/ai-agent-decisions';
import { AIAgentLogs } from './components/ai-agent-logs';
import { AIAgentConfig } from './components/ai-agent-config';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'AI Agent | Dashboard',
  description: 'Autonomous AI Agent control panel',
};

export default function AIAgentPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>

      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-blue-600">
          <Bot className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Autonomous AI Agent</h1>
          <p className="text-muted-foreground">
            Self-improving AI that optimizes your real estate platform
          </p>
        </div>
      </div>

      {/* Warning Banner */}
      <Card className="border-yellow-500/50 bg-yellow-500/5">
        <CardContent className="flex items-center gap-3 py-3">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          <p className="text-sm text-yellow-600 dark:text-yellow-400">
            <strong>Experimental:</strong> The AI Agent can make autonomous changes to your codebase. 
            Always review pending decisions before approving.
          </p>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agent Status</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-8 w-24" />}>
              <AIAgentStatus />
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Decisions Today</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-8 w-16" />}>
              <DecisionsTodayCount />
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto-Executed</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-8 w-16" />}>
              <AutoExecutedCount />
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-8 w-16" />}>
              <SuccessRateDisplay />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Decisions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Pending Decisions
            </CardTitle>
            <CardDescription>
              Review and approve AI-generated decisions before execution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<DecisionsSkeleton />}>
              <AIAgentDecisions />
            </Suspense>
          </CardContent>
        </Card>

        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Agent Configuration</CardTitle>
            <CardDescription>
              Control how the AI agent behaves
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<ConfigSkeleton />}>
              <AIAgentConfig />
            </Suspense>
          </CardContent>
        </Card>

        {/* Recent Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
            <CardDescription>
              Recent agent activities and decisions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<LogsSkeleton />}>
              <AIAgentLogs />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Server components for stats
async function DecisionsTodayCount() {
  const { agent } = await import('@/lib/ai-agent');
  const state = await agent.getState();
  return (
    <div className="text-2xl font-bold">{state.decisionsToday}</div>
  );
}

async function AutoExecutedCount() {
  const { agent } = await import('@/lib/ai-agent');
  const state = await agent.getState();
  return (
    <div className="text-2xl font-bold">{state.autoExecutesToday}</div>
  );
}

async function SuccessRateDisplay() {
  const { dataCollector } = await import('@/lib/ai-agent');
  const stats = await dataCollector.getQuickStats();
  return (
    <div className="text-2xl font-bold text-green-600">{stats.successRate}%</div>
  );
}

// Loading skeletons
function DecisionsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-96" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}

function ConfigSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-6 w-12" />
        </div>
      ))}
    </div>
  );
}

function LogsSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="flex items-center gap-2">
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 flex-1" />
        </div>
      ))}
    </div>
  );
}

