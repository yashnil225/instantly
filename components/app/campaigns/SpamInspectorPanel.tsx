"use client"

import { useState } from "react"
import {
    ShieldCheck,
    ShieldAlert,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Sparkles,
    Wand2,
    RefreshCw,
    Link as LinkIcon,
    Type,
    FileText,
    ChevronDown,
    ChevronUp,
    Info,
    ArrowRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { SpamCheckResult, getSpamScoreColor, getSpamBadgeColor, autoFixSpamWords } from "@/lib/spam-checker"
import { cn } from "@/lib/utils"

interface SpamInspectorPanelProps {
    result: SpamCheckResult | null
    subject: string
    body: string
    onApplyFix: (fixedSubject: string, fixedBody: string) => void
    className?: string
}

export function SpamInspectorPanel({
    result,
    subject,
    body,
    onApplyFix,
    className
}: SpamInspectorPanelProps) {
    const [isExpanded, setIsExpanded] = useState(true)
    const [activeTab, setActiveTab] = useState<'words' | 'checklist' | 'tips'>('words')

    if (!result) return null

    const handleAutoFix = () => {
        const { fixedSubject, fixedBody, replacementsCount } = autoFixSpamWords(subject, body)
        onApplyFix(fixedSubject, fixedBody)
    }

    const hasTriggers = result.wordAnalysis.length > 0
    const scoreColor = getSpamScoreColor(result.score)
    const badgeColor = getSpamBadgeColor(result.status)

    return (
        <div className={cn("rounded-xl border border-border/70 bg-[#0d0d0d] shadow-lg transition-all", className)}>
            {/* Header / Summary Bar */}
            <div className="p-3.5 flex items-center justify-between border-b border-border/40 bg-muted/20">
                <div className="flex items-center gap-3">
                    <div className={cn("p-1.5 rounded-lg border", badgeColor)}>
                        {result.passed ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-foreground">Live Spam & Deliverability Inspector</span>
                            <Badge variant="outline" className={cn("text-[10px] font-bold px-1.5 py-0", badgeColor)}>
                                Grade {result.grade} • {result.status.toUpperCase()}
                            </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                            {result.score >= 85 ? "Inbox Ready: High probability of landing in Primary Inbox" :
                             result.score >= 70 ? "Moderate: Some spam triggers detected" :
                             "High Spam Risk: Likely to trigger spam filters or promotions tab"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Score Ring / Pill */}
                    <div className="text-right">
                        <div className={cn("text-lg font-black tracking-tight", scoreColor)}>
                            {result.score}<span className="text-xs font-medium text-muted-foreground">/100</span>
                        </div>
                    </div>

                    {hasTriggers && (
                        <Button
                            size="sm"
                            onClick={handleAutoFix}
                            className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-8 gap-1.5 shadow-sm font-semibold"
                            title="Auto-replace all spam trigger words with deliverability-friendly alternatives"
                        >
                            <Wand2 className="h-3.5 w-3.5" />
                            Auto-Fix ({result.wordAnalysis.length})
                        </Button>
                    )}

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            {/* Expanded Detailed Inspection */}
            {isExpanded && (
                <div className="p-4 space-y-4 text-xs">
                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-2 border-b border-border/40 pb-2.5">
                        <button
                            onClick={() => setActiveTab('words')}
                            className={cn(
                                "px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5",
                                activeTab === 'words'
                                    ? "bg-primary/10 text-primary border border-primary/20"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Sparkles className="h-3.5 w-3.5" />
                            Trigger Words ({result.wordAnalysis.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('checklist')}
                            className={cn(
                                "px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5",
                                activeTab === 'checklist'
                                    ? "bg-primary/10 text-primary border border-primary/20"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Deliverability Checklist ({result.issues.length} issues)
                        </button>
                        <button
                            onClick={() => setActiveTab('tips')}
                            className={cn(
                                "px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5",
                                activeTab === 'tips'
                                    ? "bg-primary/10 text-primary border border-primary/20"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Info className="h-3.5 w-3.5" />
                            Optimization Tips ({result.suggestions.length})
                        </button>
                    </div>

                    {/* Tab 1: Spam Trigger Words Analysis */}
                    {activeTab === 'words' && (
                        <div className="space-y-2.5">
                            {result.wordAnalysis.length === 0 ? (
                                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 flex items-center gap-2.5">
                                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                                    <span>
                                        <strong>Clean Content:</strong> No cold email spam trigger words detected in your subject or email body!
                                    </span>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                    {result.wordAnalysis.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="p-2.5 rounded-lg bg-card border border-border/50 flex items-center justify-between gap-3"
                                        >
                                            <div className="space-y-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-foreground truncate">&quot;{item.word}&quot;</span>
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            "text-[9px] uppercase px-1.5 py-0 font-bold",
                                                            item.severity === 'high' ? "bg-rose-500/10 text-rose-400 border-rose-500/30" :
                                                            item.severity === 'medium' ? "bg-amber-500/10 text-amber-400 border-amber-500/30" :
                                                            "bg-blue-500/10 text-blue-400 border-blue-500/30"
                                                        )}
                                                    >
                                                        {item.severity} risk
                                                    </Badge>
                                                    <span className="text-[10px] text-muted-foreground">({item.location})</span>
                                                </div>
                                                {item.alternative && (
                                                    <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                        <span>Safe alternative:</span>
                                                        <strong className="text-emerald-400">&quot;{item.alternative}&quot;</strong>
                                                    </div>
                                                )}
                                            </div>

                                            {item.alternative && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        const regex = new RegExp(`\\b${item.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
                                                        const newSubject = subject.replace(regex, item.alternative!)
                                                        const newBody = body.replace(regex, item.alternative!)
                                                        onApplyFix(newSubject, newBody)
                                                    }}
                                                    className="h-7 text-[10px] border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 shrink-0"
                                                >
                                                    Replace
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab 2: Deliverability Checklist */}
                    {activeTab === 'checklist' && (
                        <div className="space-y-2">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pb-2">
                                <div className="p-2.5 rounded-lg bg-card border border-border/50">
                                    <div className="text-[10px] text-muted-foreground uppercase font-semibold">Word Count</div>
                                    <div className="text-sm font-bold mt-0.5 flex items-center justify-between">
                                        <span>{result.metrics.wordCount} words</span>
                                        {result.metrics.wordCount >= 40 && result.metrics.wordCount <= 140 ? (
                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                        ) : (
                                            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                                        )}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground">Optimal: 50-125 words</div>
                                </div>

                                <div className="p-2.5 rounded-lg bg-card border border-border/50">
                                    <div className="text-[10px] text-muted-foreground uppercase font-semibold">Subject Length</div>
                                    <div className="text-sm font-bold mt-0.5 flex items-center justify-between">
                                        <span>{result.metrics.subjectLength} chars</span>
                                        {result.metrics.subjectLength >= 10 && result.metrics.subjectLength <= 55 ? (
                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                        ) : (
                                            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                                        )}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground">Optimal: 20-50 chars</div>
                                </div>

                                <div className="p-2.5 rounded-lg bg-card border border-border/50">
                                    <div className="text-[10px] text-muted-foreground uppercase font-semibold">Links / URLs</div>
                                    <div className="text-sm font-bold mt-0.5 flex items-center justify-between">
                                        <span>{result.metrics.linkCount} links</span>
                                        {result.metrics.linkCount <= 1 ? (
                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                        ) : (
                                            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                                        )}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground">Optimal: 0-1 link max</div>
                                </div>
                            </div>

                            {result.issues.length > 0 ? (
                                <div className="space-y-1.5">
                                    {result.issues.map((issue, idx) => (
                                        <div
                                            key={idx}
                                            className={cn(
                                                "p-2 rounded-lg border flex items-center justify-between",
                                                issue.type === 'critical' ? "bg-rose-500/5 border-rose-500/20 text-rose-400" :
                                                issue.type === 'warning' ? "bg-amber-500/5 border-amber-500/20 text-amber-400" :
                                                "bg-muted/30 border-border/40 text-muted-foreground"
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                {issue.type === 'critical' ? <XCircle className="h-3.5 w-3.5 shrink-0" /> :
                                                 issue.type === 'warning' ? <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> :
                                                 <Info className="h-3.5 w-3.5 shrink-0" />}
                                                <span>{issue.message}</span>
                                            </div>
                                            <span className="text-[10px] font-mono opacity-80">-{issue.impact} pts</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4" />
                                    <span>All deliverability checklist criteria passed!</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab 3: Optimization Tips */}
                    {activeTab === 'tips' && (
                        <div className="space-y-2">
                            {result.suggestions.length > 0 ? (
                                result.suggestions.map((tip, idx) => (
                                    <div
                                        key={idx}
                                        className="p-2.5 rounded-lg bg-card border border-border/50 flex items-start gap-2.5"
                                    >
                                        <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                                        <span className="text-foreground">{tip}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="p-3 rounded-lg bg-card border border-border/50 text-muted-foreground">
                                    Great job! Your email formatting and style are optimized for high open and reply rates.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
