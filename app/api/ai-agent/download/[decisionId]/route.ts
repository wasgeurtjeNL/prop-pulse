// ============================================
// AI AGENT CODE DOWNLOAD API
// Download generated code changes for manual application
// ============================================

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';

interface RouteContext {
  params: Promise<{ decisionId: string }>;
}

// GET - Download code changes as a zip or JSON
export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { decisionId } = await context.params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    // Get the decision and its code changes
    const decision = await prisma.aIDecision.findUnique({
      where: { id: decisionId },
      include: {
        codeChanges: true,
      },
    });

    if (!decision) {
      return NextResponse.json({ error: 'Decision not found' }, { status: 404 });
    }

    if (format === 'json') {
      // Return as structured JSON
      return NextResponse.json({
        decision: {
          id: decision.id,
          type: decision.type,
          priority: decision.priority,
          confidence: decision.confidence,
          reasoning: decision.reasoning,
          status: decision.status,
          createdAt: decision.createdAt,
        },
        codeChanges: decision.codeChanges.map(change => ({
          filePath: change.filePath,
          action: change.action,
          originalContent: change.originalContent,
          newContent: change.newContent,
          syntaxValid: change.syntaxValid,
          typesValid: change.typesValid,
          lintPassed: change.lintPassed,
          appliedAt: change.appliedAt,
          rolledBackAt: change.rolledBackAt,
        })),
        instructions: generateInstructions(decision.codeChanges),
      });
    }

    if (format === 'patch') {
      // Generate a unified diff patch file
      const patches = decision.codeChanges.map(change => {
        return generatePatch(change.filePath, change.originalContent, change.newContent, change.action);
      }).join('\n');

      return new NextResponse(patches, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="ai-changes-${decisionId.substring(0, 8)}.patch"`,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid format. Use json or patch' }, { status: 400 });
  } catch (error) {
    console.error('AI Agent Download Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST - Mark changes as applied
export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { decisionId } = await context.params;

    // Mark all code changes as applied
    await prisma.aICodeChange.updateMany({
      where: { 
        decisionId,
        appliedAt: null,
      },
      data: {
        appliedAt: new Date(),
      },
    });

    // Log the action
    await prisma.aIAgentLog.create({
      data: {
        level: 'INFO',
        category: 'execution',
        message: `Code changes marked as manually applied by ${session.user.name || session.user.email}`,
        decisionId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('AI Agent Mark Applied Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Generate human-readable instructions for applying changes
function generateInstructions(codeChanges: Array<{
  filePath: string;
  action: string;
  newContent: string | null;
}>): string[] {
  const instructions: string[] = [
    '# How to apply these changes',
    '',
    '## Option 1: Manual Application',
    'Copy each file\'s content below to the corresponding path in your project.',
    '',
    '## Option 2: Download Patch',
    'Use format=patch to download a .patch file, then run:',
    '```',
    'git apply ai-changes-*.patch',
    '```',
    '',
    '## Files to change:',
  ];

  for (const change of codeChanges) {
    if (change.action === 'CREATE') {
      instructions.push(`- CREATE: ${change.filePath}`);
    } else if (change.action === 'UPDATE') {
      instructions.push(`- UPDATE: ${change.filePath}`);
    } else if (change.action === 'DELETE') {
      instructions.push(`- DELETE: ${change.filePath}`);
    }
  }

  return instructions;
}

// Generate a unified diff for a file change
function generatePatch(
  filePath: string,
  originalContent: string | null,
  newContent: string | null,
  action: string
): string {
  const oldContent = originalContent || '';
  const newContentStr = newContent || '';
  
  const lines: string[] = [
    `--- a/${filePath}`,
    `+++ b/${filePath}`,
  ];

  if (action === 'CREATE') {
    lines.push('@@ -0,0 +1,' + newContentStr.split('\n').length + ' @@');
    for (const line of newContentStr.split('\n')) {
      lines.push('+' + line);
    }
  } else if (action === 'DELETE') {
    lines.push('@@ -1,' + oldContent.split('\n').length + ' +0,0 @@');
    for (const line of oldContent.split('\n')) {
      lines.push('-' + line);
    }
  } else {
    // UPDATE - simple diff (shows all old as removed, all new as added)
    // In production, you'd want a proper diff algorithm
    const oldLines = oldContent.split('\n');
    const newLines = newContentStr.split('\n');
    
    lines.push(`@@ -1,${oldLines.length} +1,${newLines.length} @@`);
    for (const line of oldLines) {
      lines.push('-' + line);
    }
    for (const line of newLines) {
      lines.push('+' + line);
    }
  }

  return lines.join('\n');
}

