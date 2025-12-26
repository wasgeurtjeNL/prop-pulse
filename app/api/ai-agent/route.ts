// ============================================
// AI AGENT API
// Main API for interacting with the AI Agent
// ============================================

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { agent } from '@/lib/ai-agent';

// GET - Get agent status and pending decisions
export async function GET(request: Request) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';

    switch (action) {
      case 'status': {
        const [state, config, pendingDecisions, recentDecisions] = await Promise.all([
          agent.getState(),
          agent.getConfig(),
          agent.getPendingDecisions(),
          agent.getRecentDecisions(10),
        ]);

        return NextResponse.json({
          state,
          config,
          pendingDecisions,
          recentDecisions,
        });
      }

      case 'logs': {
        const level = searchParams.get('level') as 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL' | null;
        const category = searchParams.get('category');
        const limit = parseInt(searchParams.get('limit') || '50');

        const logs = await agent.getLogs({
          level: level || undefined,
          category: category || undefined,
          limit,
        });

        return NextResponse.json({ logs });
      }

      case 'decisions': {
        const decisions = await agent.getRecentDecisions(50);
        return NextResponse.json({ decisions });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('AI Agent API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST - Trigger actions on the AI Agent
export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'analyze': {
        const analysisType = body.type || 'full';
        const result = await agent.runAnalysis({ type: analysisType });
        
        return NextResponse.json({
          success: true,
          result: {
            opportunities: result.opportunities.length,
            decisions: result.decisions.length,
            insights: result.insights,
            warnings: result.warnings,
            confidence: result.confidence,
            analysisTime: result.analysisTime,
          },
        });
      }

      case 'execute': {
        const { decisionId } = body;
        if (!decisionId) {
          return NextResponse.json({ error: 'decisionId required' }, { status: 400 });
        }

        const result = await agent.executeDecision(decisionId);
        return NextResponse.json({ success: result.success, result });
      }

      case 'approve': {
        const { decisionId } = body;
        if (!decisionId) {
          return NextResponse.json({ error: 'decisionId required' }, { status: 400 });
        }

        await agent.approveDecision(decisionId, session.user.id, session.user.name || 'Admin');
        return NextResponse.json({ success: true });
      }

      case 'reject': {
        const { decisionId, reason } = body;
        if (!decisionId || !reason) {
          return NextResponse.json({ error: 'decisionId and reason required' }, { status: 400 });
        }

        await agent.rejectDecision(decisionId, session.user.id, session.user.name || 'Admin', reason);
        return NextResponse.json({ success: true });
      }

      case 'rollback': {
        const { decisionId, reason } = body;
        if (!decisionId || !reason) {
          return NextResponse.json({ error: 'decisionId and reason required' }, { status: 400 });
        }

        const result = await agent.rollbackDecision(decisionId, session.user.id, reason);
        return NextResponse.json(result);
      }

      case 'feedback': {
        const { decisionId, wasSuccessful, successScore, notes } = body;
        if (!decisionId || wasSuccessful === undefined || successScore === undefined) {
          return NextResponse.json({ error: 'decisionId, wasSuccessful, and successScore required' }, { status: 400 });
        }

        await agent.provideFeedback(decisionId, wasSuccessful, successScore, notes || '');
        return NextResponse.json({ success: true });
      }

      case 'emergency-stop': {
        const { reason } = body;
        if (!reason) {
          return NextResponse.json({ error: 'reason required' }, { status: 400 });
        }

        await agent.emergencyStop(reason);
        return NextResponse.json({ success: true, message: 'Emergency stop activated' });
      }

      case 'resume': {
        await agent.resume();
        return NextResponse.json({ success: true, message: 'Agent resumed' });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('AI Agent API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PATCH - Update agent configuration
export async function PATCH(request: Request) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updates = await request.json();
    const config = await agent.updateConfig(updates);

    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error('AI Agent API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

