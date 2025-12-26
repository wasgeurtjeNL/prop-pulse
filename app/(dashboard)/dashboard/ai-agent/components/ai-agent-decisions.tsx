'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Check, 
  X, 
  Play, 
  Brain, 
  FileCode, 
  Search,
  TrendingUp,
  Bug,
  Loader2,
  RotateCcw,
  Download,
  Eye,
  ExternalLink,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Database,
  Target,
  Zap,
  ImageOff,
  MapPinOff,
  BarChart3,
  Users,
  Activity
} from 'lucide-react';

interface Decision {
  id: string;
  type: string;
  subType?: string;
  priority: string;
  confidence: number;
  reasoning: string;
  status: string;
  wasSuccessful?: boolean;
  createdAt: string;
  executedAt?: string;
  dataSnapshot?: {
    missing_images?: number;
    missing_location?: number;
    total_views?: number;
    unique_visitors?: number;
    conversion_rate?: number;
    error_count?: number;
    [key: string]: unknown;
  };
  actionPayload?: {
    files?: string[];
    modifications?: Array<{
      target: string;
      fix: string;
    }>;
    [key: string]: unknown;
  };
  estimatedImpact?: string;
  executionResult?: {
    mode?: string;
    filesChanged?: string[];
    downloadUrl?: string;
    githubPrUrl?: string;
    message?: string;
  };
}

interface CodeChange {
  filePath: string;
  action: string;
  originalContent: string | null;
  newContent: string | null;
  syntaxValid: boolean;
  typesValid: boolean;
  lintPassed: boolean;
  appliedAt: string | null;
}

const typeIcons: Record<string, React.ReactNode> = {
  CONTENT_CREATION: <FileCode className="h-4 w-4" />,
  SEO_OPTIMIZATION: <Search className="h-4 w-4" />,
  CONVERSION_OPTIMIZATION: <TrendingUp className="h-4 w-4" />,
  BUG_FIX: <Bug className="h-4 w-4" />,
  default: <Brain className="h-4 w-4" />,
};

const priorityColors: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-500',
};

export function AIAgentDecisions() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; decisionId: string | null }>({
    open: false,
    decisionId: null,
  });
  const [rejectReason, setRejectReason] = useState('');
  const [codePreview, setCodePreview] = useState<{ 
    open: boolean; 
    decisionId: string | null;
    codeChanges: CodeChange[];
    loading: boolean;
  }>({
    open: false,
    decisionId: null,
    codeChanges: [],
    loading: false,
  });

  useEffect(() => {
    fetchDecisions();
  }, []);

  const fetchDecisions = async () => {
    try {
      const response = await fetch('/api/ai-agent?action=decisions');
      if (response.ok) {
        const data = await response.json();
        setDecisions(data.decisions || []);
      }
    } catch (error) {
      console.error('Failed to fetch decisions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (decisionId: string) => {
    setActionLoading(decisionId);
    try {
      const response = await fetch('/api/ai-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', decisionId }),
      });
      
      if (response.ok) {
        await fetchDecisions();
      }
    } catch (error) {
      console.error('Failed to approve:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleExecute = async (decisionId: string) => {
    setActionLoading(decisionId);
    try {
      const response = await fetch('/api/ai-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'execute', decisionId }),
      });
      
      if (response.ok) {
        await fetchDecisions();
      }
    } catch (error) {
      console.error('Failed to execute:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectDialog.decisionId || !rejectReason) return;
    
    setActionLoading(rejectDialog.decisionId);
    try {
      const response = await fetch('/api/ai-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'reject', 
          decisionId: rejectDialog.decisionId,
          reason: rejectReason,
        }),
      });
      
      if (response.ok) {
        await fetchDecisions();
      }
    } catch (error) {
      console.error('Failed to reject:', error);
    } finally {
      setActionLoading(null);
      setRejectDialog({ open: false, decisionId: null });
      setRejectReason('');
    }
  };

  const handleRollback = async (decisionId: string) => {
    if (!confirm('Are you sure you want to rollback this decision?')) return;

    setActionLoading(decisionId);
    try {
      const response = await fetch('/api/ai-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'rollback', 
          decisionId,
          reason: 'Manual rollback from dashboard',
        }),
      });
      
      if (response.ok) {
        await fetchDecisions();
      }
    } catch (error) {
      console.error('Failed to rollback:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewCode = async (decisionId: string) => {
    setCodePreview({ open: true, decisionId, codeChanges: [], loading: true });
    try {
      const response = await fetch(`/api/ai-agent/download/${decisionId}?format=json`);
      if (response.ok) {
        const data = await response.json();
        setCodePreview({ 
          open: true, 
          decisionId, 
          codeChanges: data.codeChanges || [], 
          loading: false 
        });
      }
    } catch (error) {
      console.error('Failed to fetch code changes:', error);
      setCodePreview(prev => ({ ...prev, loading: false }));
    }
  };

  const handleDownload = async (decisionId: string) => {
    window.open(`/api/ai-agent/download/${decisionId}?format=json`, '_blank');
  };

  const handleMarkApplied = async (decisionId: string) => {
    try {
      const response = await fetch(`/api/ai-agent/download/${decisionId}`, {
        method: 'POST',
      });
      if (response.ok) {
        alert('Code changes marked as applied!');
        setCodePreview({ open: false, decisionId: null, codeChanges: [], loading: false });
        await fetchDecisions();
      }
    } catch (error) {
      console.error('Failed to mark as applied:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (decisions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Brain className="h-12 w-12 mx-auto mb-3 opacity-20" />
        <p>No decisions yet. Run an analysis to generate decisions.</p>
      </div>
    );
  }

  const pendingDecisions = decisions.filter(d => d.status === 'PENDING');
  const approvedDecisions = decisions.filter(d => d.status === 'APPROVED');
  const executedDecisions = decisions.filter(d => d.status === 'EXECUTED');

  return (
    <div className="space-y-6">
      {/* Pending Decisions */}
      {pendingDecisions.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
            Pending Approval ({pendingDecisions.length})
          </h3>
          {pendingDecisions.map(decision => (
            <DecisionCard
              key={decision.id}
              decision={decision}
              onApprove={() => handleApprove(decision.id)}
              onReject={() => setRejectDialog({ open: true, decisionId: decision.id })}
              loading={actionLoading === decision.id}
            />
          ))}
        </div>
      )}

      {/* Approved (ready to execute) */}
      {approvedDecisions.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Ready to Execute ({approvedDecisions.length})
          </h3>
          {approvedDecisions.map(decision => (
            <DecisionCard
              key={decision.id}
              decision={decision}
              onExecute={() => handleExecute(decision.id)}
              loading={actionLoading === decision.id}
            />
          ))}
        </div>
      )}

      {/* Executed (recent) */}
      {executedDecisions.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            Recently Executed ({executedDecisions.length})
          </h3>
          {executedDecisions.slice(0, 5).map(decision => (
            <DecisionCard
              key={decision.id}
              decision={decision}
              onRollback={() => handleRollback(decision.id)}
              onViewCode={() => handleViewCode(decision.id)}
              onDownload={() => handleDownload(decision.id)}
              loading={actionLoading === decision.id}
            />
          ))}
        </div>
      )}

      {/* Reject Dialog */}
      <AlertDialog open={rejectDialog.open} onOpenChange={(open) => {
        if (!open) setRejectDialog({ open: false, decisionId: null });
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Decision</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting this decision. This helps the AI learn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Reason for rejection..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} disabled={!rejectReason}>
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Code Preview Dialog */}
      <AlertDialog open={codePreview.open} onOpenChange={(open) => {
        if (!open) setCodePreview({ open: false, decisionId: null, codeChanges: [], loading: false });
      }}>
        <AlertDialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <FileCode className="h-5 w-5" />
              Generated Code Changes
            </AlertDialogTitle>
            <AlertDialogDescription>
              Review the AI-generated code changes below. Apply them manually or download as a patch file.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {codePreview.loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : codePreview.codeChanges.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No code changes found for this decision.
            </div>
          ) : (
            <div className="flex-1 overflow-auto space-y-4 pr-2">
              {codePreview.codeChanges.map((change, index) => (
                <div key={index} className="border rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b">
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        change.action === 'CREATE' ? 'default' :
                        change.action === 'DELETE' ? 'destructive' : 'secondary'
                      }>
                        {change.action}
                      </Badge>
                      <code className="text-sm font-mono">{change.filePath}</code>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {change.syntaxValid && (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Syntax OK
                        </span>
                      )}
                      {change.appliedAt && (
                        <Badge variant="outline" className="text-green-600">
                          Applied
                        </Badge>
                      )}
                    </div>
                  </div>
                  {change.newContent && (
                    <pre className="p-4 text-sm overflow-auto max-h-64 bg-zinc-950 text-zinc-100">
                      <code>{change.newContent}</code>
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}

          <AlertDialogFooter className="gap-2">
            {codePreview.decisionId && (
              <>
                <Button
                  variant="outline"
                  onClick={() => window.open(`/api/ai-agent/download/${codePreview.decisionId}?format=patch`, '_blank')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Patch
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleMarkApplied(codePreview.decisionId!)}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark as Applied
                </Button>
              </>
            )}
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function DecisionCard({
  decision,
  onApprove,
  onReject,
  onExecute,
  onRollback,
  onViewCode,
  onDownload,
  loading,
}: {
  decision: Decision;
  onApprove?: () => void;
  onReject?: () => void;
  onExecute?: () => void;
  onRollback?: () => void;
  onViewCode?: () => void;
  onDownload?: () => void;
  loading?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const icon = typeIcons[decision.type] || typeIcons.default;
  const priorityColor = priorityColors[decision.priority] || priorityColors.medium;

  const hasDetails = decision.dataSnapshot || decision.actionPayload || decision.estimatedImpact;

  return (
    <div className="border rounded-lg hover:bg-muted/50 transition-colors overflow-hidden">
      {/* Main Card Content */}
      <div className="flex items-start gap-4 p-4">
        <div className={`p-2 rounded-full ${priorityColor} text-white flex-shrink-0`}>
          {icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">{decision.type}</Badge>
            {decision.subType && (
              <Badge variant="secondary" className="text-xs">{decision.subType}</Badge>
            )}
            <Badge variant="secondary">{decision.priority}</Badge>
            <span className="text-xs text-muted-foreground">
              {Math.round(decision.confidence)}% confidence
            </span>
          </div>
          <p className="mt-1 text-sm">{decision.reasoning}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <p className="text-xs text-muted-foreground">
              {new Date(decision.createdAt).toLocaleString()}
            </p>
            {decision.executionResult?.githubPrUrl && (
              <a 
                href={decision.executionResult.githubPrUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center"
              >
                <Badge variant="default" className="text-xs bg-green-600 hover:bg-green-700 cursor-pointer">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View GitHub PR
                </Badge>
              </a>
            )}
            {decision.executionResult?.mode === 'serverless' && !decision.executionResult?.githubPrUrl && (
              <Badge variant="outline" className="text-xs">
                <ExternalLink className="h-3 w-3 mr-1" />
                Code Ready for Manual Apply
              </Badge>
            )}
            {decision.executionResult?.filesChanged && decision.executionResult.filesChanged.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {decision.executionResult.filesChanged.length} file(s) changed
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              {hasDetails && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setExpanded(!expanded)}
                  className="text-muted-foreground"
                >
                  {expanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  Details
                </Button>
              )}
              {onApprove && (
                <Button size="sm" variant="outline" onClick={onApprove}>
                  <Check className="h-4 w-4 mr-1" />
                  Approve
                </Button>
              )}
              {onReject && (
                <Button size="sm" variant="outline" onClick={onReject}>
                  <X className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              )}
              {onExecute && (
                <Button size="sm" onClick={onExecute}>
                  <Play className="h-4 w-4 mr-1" />
                  Execute
                </Button>
              )}
              {onViewCode && decision.status === 'EXECUTED' && (
                <Button size="sm" variant="outline" onClick={onViewCode}>
                  <Eye className="h-4 w-4 mr-1" />
                  View Code
                </Button>
              )}
              {onDownload && decision.status === 'EXECUTED' && (
                <Button size="sm" variant="outline" onClick={onDownload}>
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              )}
              {onRollback && decision.status === 'EXECUTED' && (
                <Button size="sm" variant="outline" onClick={onRollback}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Rollback
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Expanded Details Section */}
      {expanded && hasDetails && (
        <div className="border-t bg-muted/30 p-4 space-y-4">
          {/* Data Snapshot - What the AI saw */}
          {decision.dataSnapshot && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-500" />
                Data Basis (Wat de AI zag)
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {decision.dataSnapshot.missing_images !== undefined && decision.dataSnapshot.missing_images > 0 && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                    <ImageOff className="h-4 w-4 text-red-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Ontbrekende afbeeldingen</p>
                      <p className="text-sm font-semibold text-red-600">{decision.dataSnapshot.missing_images}</p>
                    </div>
                  </div>
                )}
                {decision.dataSnapshot.missing_location !== undefined && decision.dataSnapshot.missing_location > 0 && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <MapPinOff className="h-4 w-4 text-orange-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Ontbrekende locatie</p>
                      <p className="text-sm font-semibold text-orange-600">{decision.dataSnapshot.missing_location}</p>
                    </div>
                  </div>
                )}
                {decision.dataSnapshot.total_views !== undefined && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <BarChart3 className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Totale views</p>
                      <p className="text-sm font-semibold">{decision.dataSnapshot.total_views}</p>
                    </div>
                  </div>
                )}
                {decision.dataSnapshot.unique_visitors !== undefined && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                    <Users className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Unieke bezoekers</p>
                      <p className="text-sm font-semibold">{decision.dataSnapshot.unique_visitors}</p>
                    </div>
                  </div>
                )}
                {decision.dataSnapshot.conversion_rate !== undefined && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <TrendingUp className="h-4 w-4 text-purple-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Conversie rate</p>
                      <p className="text-sm font-semibold">{decision.dataSnapshot.conversion_rate}%</p>
                    </div>
                  </div>
                )}
                {decision.dataSnapshot.error_count !== undefined && decision.dataSnapshot.error_count > 0 && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Totaal fouten</p>
                      <p className="text-sm font-semibold text-red-600">{decision.dataSnapshot.error_count}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Payload - What the AI wants to do */}
          {decision.actionPayload && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4 text-green-500" />
                Geplande Acties (Wat de AI wil doen)
              </h4>
              <div className="space-y-2">
                {decision.actionPayload.modifications?.map((mod, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-background border">
                    <div className="p-1.5 rounded-full bg-green-500/10">
                      <Activity className="h-3 w-3 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium capitalize">{mod.target.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{mod.fix}</p>
                    </div>
                  </div>
                ))}
                {decision.actionPayload.files && decision.actionPayload.files.length > 0 && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-background border">
                    <div className="p-1.5 rounded-full bg-blue-500/10">
                      <FileCode className="h-3 w-3 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Bestanden</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {decision.actionPayload.files.map((file, index) => (
                          <code key={index} className="text-xs px-1.5 py-0.5 rounded bg-muted">
                            {file}
                          </code>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Estimated Impact */}
          {decision.estimatedImpact && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                Verwachte Impact
              </h4>
              <p className="text-sm text-muted-foreground bg-background p-3 rounded-lg border">
                {decision.estimatedImpact}
              </p>
            </div>
          )}

          {/* Files that will be changed (for executed) */}
          {decision.executionResult?.filesChanged && decision.executionResult.filesChanged.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <FileCode className="h-4 w-4 text-blue-500" />
                Gewijzigde Bestanden
              </h4>
              <div className="flex flex-wrap gap-2">
                {decision.executionResult.filesChanged.map((file, index) => (
                  <code key={index} className="text-xs px-2 py-1 rounded bg-background border font-mono">
                    {file}
                  </code>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

