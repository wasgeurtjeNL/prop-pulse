// ============================================
// AI AGENT CRON JOB
// Scheduled task for daily AI analysis
// ============================================

import { NextResponse } from 'next/server';
import { agent } from '@/lib/ai-agent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

// This endpoint should be called by a cron job (e.g., Vercel Cron or external service)
// Configure in vercel.json:
// {
//   "crons": [
//     {
//       "path": "/api/cron/ai-agent",
//       "schedule": "0 8 * * *"  // Daily at 8 AM
//     }
//   ]
// }

export async function GET(request: Request) {
  try {
    // Verify cron secret (set in environment)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Allow if coming from Vercel Cron (has special header)
      const vercelCron = request.headers.get('x-vercel-cron');
      if (!vercelCron) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    console.log('🤖 Starting AI Agent daily analysis...');

    // Get agent config
    const config = await agent.getConfig();

    if (!config.enabled) {
      console.log('⚠️ AI Agent is disabled');
      return NextResponse.json({ 
        success: false, 
        message: 'AI Agent is disabled',
      });
    }

    if (config.killSwitch) {
      console.log('🛑 AI Agent kill switch is active');
      return NextResponse.json({ 
        success: false, 
        message: 'Kill switch is active',
      });
    }

    // Run analysis
    const startTime = Date.now();
    const result = await agent.runAnalysis({ type: 'full' });

    const summary = {
      success: true,
      duration: Date.now() - startTime,
      opportunities: result.opportunities.length,
      decisions: result.decisions.length,
      insights: result.insights,
      warnings: result.warnings,
      confidence: result.confidence,
    };

    console.log('✅ AI Agent analysis completed:', summary);

    return NextResponse.json(summary);
  } catch (error) {
    console.error('❌ AI Agent cron error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// POST endpoint for manual trigger
export async function POST(request: Request) {
  try {
    // For manual triggers, require authentication
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const analysisType = body.type || 'full';

    const result = await agent.runAnalysis({ type: analysisType });

    return NextResponse.json({
      success: true,
      result: {
        opportunities: result.opportunities.length,
        decisions: result.decisions.length,
        confidence: result.confidence,
        analysisTime: result.analysisTime,
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

