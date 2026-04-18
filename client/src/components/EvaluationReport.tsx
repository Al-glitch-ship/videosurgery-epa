// =============================================================================
// EvaluationReport — Componente de relatório pós-avaliação com fenotipagem
// =============================================================================

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  Shield,
  Star,
  Wrench,
  Brain,
  Cog,
  BarChart3,
  CheckCircle,
  TrendingUp,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  FileText,
  Target,
} from "lucide-react";
import { useState } from "react";
import type { ClusteringResult } from "@/hooks/useClustering";
import { MILESTONE_LABELS, ENTRUSTMENT_LEVELS, SCORE_LABELS } from "@shared/surgical";

// ─── Props ──────────────────────────────────────────────────────────────────

interface EvaluationReportProps {
  result: ClusteringResult;
  entrustmentLevel: number;
  strengths?: string;
  improvements?: string;
  feedback?: string;
  procedureName?: string;
  onClose?: () => void;
}

// ─── Phenotype Icons ────────────────────────────────────────────────────────

function PhenotypeIcon({ type }: { type: string }) {
  switch (type) {
    case "ALERTA_SEGURANCA":
      return <Shield className="h-6 w-6 text-red-700" />;
    case "EXCELENTE":
      return <Star className="h-6 w-6 text-blue-500" />;
    case "TECNICO_SOLIDO":
      return <Wrench className="h-6 w-6 text-emerald-500" />;
    case "DECISOR":
      return <Brain className="h-6 w-6 text-teal-500" />;
    case "EXECUTOR_MECANICO":
      return <Cog className="h-6 w-6 text-orange-500" />;
    case "PERFIL_IRREGULAR":
      return <BarChart3 className="h-6 w-6 text-amber-500" />;
    case "INTEGRAL":
      return <CheckCircle className="h-6 w-6 text-yellow-500" />;
    case "EM_DESENVOLVIMENTO":
      return <TrendingUp className="h-6 w-6 text-red-500" />;
    default:
      return <Target className="h-6 w-6" />;
  }
}

// ─── Milestone Status Color ─────────────────────────────────────────────────

function milestoneStatusColor(status: string): string {
  switch (status) {
    case "excelente":
      return "text-blue-600";
    case "adequado":
      return "text-emerald-600";
    case "desenvolvimento":
      return "text-amber-600";
    case "atencao":
      return "text-red-600";
    default:
      return "text-muted-foreground";
  }
}

function milestoneProgressColor(status: string): string {
  switch (status) {
    case "excelente":
      return "[&>div]:bg-blue-500";
    case "adequado":
      return "[&>div]:bg-emerald-500";
    case "desenvolvimento":
      return "[&>div]:bg-amber-500";
    case "atencao":
      return "[&>div]:bg-red-500";
    default:
      return "";
  }
}

function milestoneStatusLabel(status: string): string {
  switch (status) {
    case "excelente":
      return "Excelente";
    case "adequado":
      return "Adequado";
    case "desenvolvimento":
      return "Em Desenvolvimento";
    case "atencao":
      return "Atenção";
    default:
      return "";
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function EvaluationReport({
  result,
  entrustmentLevel,
  strengths,
  improvements,
  feedback,
  procedureName,
  onClose,
}: EvaluationReportProps) {
  const [expandedDomains, setExpandedDomains] = useState<Record<string, boolean>>({});

  const toggleDomain = (domain: string) => {
    setExpandedDomains((prev) => ({ ...prev, [domain]: !prev[domain] }));
  };

  const entrustmentInfo = ENTRUSTMENT_LEVELS.find((e) => e.level === entrustmentLevel);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Relatório de Avaliação</h2>
          {procedureName && (
            <p className="text-muted-foreground mt-1">{procedureName}</p>
          )}
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Fechar Relatório
          </Button>
        )}
      </div>

      {/* Score + Phenotype Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Overall Score */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Score Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div
                className={`text-4xl font-bold ${
                  result.overallScore >= 80
                    ? "text-blue-600"
                    : result.overallScore >= 60
                    ? "text-emerald-600"
                    : result.overallScore >= 40
                    ? "text-amber-600"
                    : "text-red-600"
                }`}
              >
                {result.overallScore}%
              </div>
              <div className="flex-1">
                <Progress
                  value={result.overallScore}
                  className={`h-3 ${
                    result.overallScore >= 80
                      ? "[&>div]:bg-blue-500"
                      : result.overallScore >= 60
                      ? "[&>div]:bg-emerald-500"
                      : result.overallScore >= 40
                      ? "[&>div]:bg-amber-500"
                      : "[&>div]:bg-red-500"
                  }`}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {result.interpretation.level}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Phenotype */}
        <Card className={`border-2 ${
          result.phenotype.type === "ALERTA_SEGURANCA" ? "border-red-500" : "border-border"
        }`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Fenótipo de Desempenho
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${result.phenotype.color} bg-opacity-10`}>
                <PhenotypeIcon type={result.phenotype.type} />
              </div>
              <div>
                <p className="font-semibold text-lg">{result.phenotype.label}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {result.phenotype.description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Entrustment Level */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Nível de Confiança (Entrustment)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                    level <= entrustmentLevel
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {level}
                </div>
              ))}
            </div>
            <div className="flex-1">
              <p className="font-medium">{entrustmentInfo?.label}</p>
              <p className="text-sm text-muted-foreground">{entrustmentInfo?.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Milestone Scores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Milestones ACGME
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(["pc2", "pc3", "mk2", "sbp1"] as const).map((key) => {
              const ms = result.milestoneScores[key];
              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{ms.label}</span>
                    <Badge
                      variant="outline"
                      className={milestoneStatusColor(ms.status)}
                    >
                      {milestoneStatusLabel(ms.status)}
                    </Badge>
                  </div>
                  <Progress
                    value={ms.percentage}
                    className={`h-2 ${milestoneProgressColor(ms.status)}`}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{ms.score}/{ms.maxScore} pontos</span>
                    <span className={`font-medium ${milestoneStatusColor(ms.status)}`}>
                      {ms.percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Domain Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Desempenho por Domínio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {result.scoresByDomain.map((domain) => (
            <div key={domain.domain} className="border rounded-lg">
              <button
                onClick={() => toggleDomain(domain.domain)}
                className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-sm">{domain.domain}</span>
                  <Badge variant="outline" className="text-xs">
                    {domain.percentage}%
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <Progress
                    value={domain.percentage}
                    className={`h-2 w-24 ${
                      domain.percentage >= 80
                        ? "[&>div]:bg-blue-500"
                        : domain.percentage >= 60
                        ? "[&>div]:bg-emerald-500"
                        : domain.percentage >= 40
                        ? "[&>div]:bg-amber-500"
                        : "[&>div]:bg-red-500"
                    }`}
                  />
                  {expandedDomains[domain.domain] ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {expandedDomains[domain.domain] && (
                <div className="px-3 pb-3 space-y-2">
                  <Separator />
                  {domain.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm py-1"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-muted-foreground truncate">
                          {item.item}
                        </span>
                        {item.milestone && (
                          <Badge variant="outline" className="text-[10px] shrink-0">
                            {item.milestone}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <div
                            key={s}
                            className={`w-5 h-5 rounded text-[10px] flex items-center justify-center ${
                              s <= item.score
                                ? item.score >= 4
                                  ? "bg-blue-500 text-white"
                                  : item.score >= 3
                                  ? "bg-emerald-500 text-white"
                                  : "bg-amber-500 text-white"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {s}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Identified Strengths */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ThumbsUp className="h-4 w-4 text-emerald-500" />
              Pontos Fortes Identificados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.strengths.length > 0 ? (
              <ul className="space-y-1">
                {result.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum ponto forte destacado nesta avaliação.</p>
            )}
          </CardContent>
        </Card>

        {/* Identified Improvements */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ThumbsDown className="h-4 w-4 text-amber-500" />
              Pontos de Melhoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.improvements.length > 0 ? (
              <ul className="space-y-1">
                {result.improvements.map((s, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum ponto de melhoria crítico identificado.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Written Feedback */}
      {(strengths || improvements || feedback) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Feedback do Avaliador
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {strengths && (
              <div>
                <p className="text-sm font-medium text-emerald-600 mb-1">Pontos Fortes</p>
                <p className="text-sm text-muted-foreground">{strengths}</p>
              </div>
            )}
            {improvements && (
              <div>
                <p className="text-sm font-medium text-amber-600 mb-1">Pontos a Melhorar</p>
                <p className="text-sm text-muted-foreground">{improvements}</p>
              </div>
            )}
            {feedback && (
              <div>
                <p className="text-sm font-medium mb-1">Comentários Gerais</p>
                <p className="text-sm text-muted-foreground">{feedback}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Interpretation & Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recomendações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">{result.interpretation.recommendation}</p>
          <div>
            <p className="text-sm font-medium mb-2">Próximos Passos:</p>
            <ul className="space-y-1">
              {result.interpretation.nextSteps.map((step, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary font-medium">{i + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
