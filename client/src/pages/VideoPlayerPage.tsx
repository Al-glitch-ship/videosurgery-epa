import { useState, useMemo, useEffect } from "react";
import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  ArrowLeft,
  Play,
  Check,
  Send,
  Star,
  User,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  FileBarChart,
} from "lucide-react";
import { formatDate, getInitials, generateColorFromString } from "@/lib/utils";
import { SCORE_LABELS, ENTRUSTMENT_LEVELS } from "@shared/surgical";
import EvaluationReport from "@/components/EvaluationReport";
import { useClustering, type CriteriaScore } from "@/hooks/useClustering";

// ─── Helper: Build clustering input from a persisted evaluation ─────────────
function buildClusteringInputFromEval(
  evalData: {
    criteriaScores: unknown;
    entrustmentLevel: number | null;
    strengths: string | null;
    improvements: string | null;
    feedback: string | null;
  },
  criteria: { id: number; item: string; domain: string; milestone?: string | null }[],
  procedure: string
) {
  const rawScores = (evalData.criteriaScores as { criteriaId: number; score: number }[]) ?? [];
  const criteriaScores: CriteriaScore[] = rawScores.map((rs) => {
    const c = criteria.find((x) => x.id === rs.criteriaId);
    return {
      criteriaId: String(rs.criteriaId),
      item: c?.item || `Critério #${rs.criteriaId}`,
      domain: c?.domain || "Geral",
      score: rs.score,
      milestone: c?.milestone ?? undefined,
    };
  });
  return {
    procedureCode: procedure,
    criteriaScores,
    entrustmentLevel: evalData.entrustmentLevel ?? 3,
    strengths: evalData.strengths ?? "",
    improvements: evalData.improvements ?? "",
    feedback: evalData.feedback ?? "",
    procedureName: procedure,
  };
}

export function VideoPlayerPage() {
  const { id } = useParams();
  const videoId = parseInt(id || "0");
  const { user: currentUser } = useAuth();

  // ─── State ──────────────────────────────────────────────────────────────
  const [scores, setScores] = useState<Record<number, number>>({});
  const [checkedCriteria, setCheckedCriteria] = useState<Record<number, boolean>>({});
  const [entrustmentLevel, setEntrustmentLevel] = useState<number>(3);
  const [feedback, setFeedback] = useState("");
  const [strengths, setStrengths] = useState("");
  const [improvements, setImprovements] = useState("");
  const [expandedDomains, setExpandedDomains] = useState<Record<string, boolean>>({});

  // Report state — can come from fresh submission OR from persisted eval
  const [showReport, setShowReport] = useState(false);
  const [reportInput, setReportInput] = useState<{
    procedureCode: string;
    criteriaScores: CriteriaScore[];
    entrustmentLevel: number;
    strengths: string;
    improvements: string;
    feedback: string;
    procedureName: string;
  } | null>(null);

  // Which evaluation to show report for (for owner viewing received evals)
  const [selectedEvalId, setSelectedEvalId] = useState<number | null>(null);

  // ─── Queries ────────────────────────────────────────────────────────────
  const { data: videoData, isLoading } = trpc.videos.get.useQuery({ id: videoId });
  const { data: evaluations } = trpc.evaluations.getForVideo.useQuery({ videoId });
  const { data: folderData } = trpc.folders.get.useQuery(
    { id: videoData?.video.folderId || 0 },
    { enabled: !!videoData }
  );

  const utils = trpc.useUtils();

  // ─── Auto-reconstruct report for returning evaluator ────────────────────
  useEffect(() => {
    if (
      videoData?.myEvaluation &&
      folderData?.criteria &&
      folderData.folder.procedure &&
      !reportInput
    ) {
      const input = buildClusteringInputFromEval(
        videoData.myEvaluation,
        folderData.criteria,
        folderData.folder.procedure
      );
      setReportInput(input);
    }
  }, [videoData, folderData, reportInput]);

  // ─── Submit mutation ────────────────────────────────────────────────────
  const submitEvaluation = trpc.evaluations.submit.useMutation({
    onSuccess: () => {
      toast.success("Avaliação enviada com sucesso!");
      utils.evaluations.getForVideo.invalidate({ videoId });
      utils.videos.get.invalidate({ id: videoId });

      // Build report input from the just-submitted data
      const criteriaList = folderData?.criteria || [];
      const criteriaScoresForReport: CriteriaScore[] = Object.entries(scores)
        .filter(([criteriaId]) => checkedCriteria[parseInt(criteriaId)])
        .map(([criteriaId, score]) => {
          const c = criteriaList.find((x: any) => x.id === parseInt(criteriaId));
          return {
            criteriaId,
            item: c?.item || "",
            domain: c?.domain || "",
            score,
            milestone: (c as any)?.milestone ?? undefined,
          };
        });

      const input = {
        procedureCode: folderData?.folder.procedure || "",
        criteriaScores: criteriaScoresForReport,
        entrustmentLevel,
        strengths,
        improvements,
        feedback,
        procedureName: folderData?.folder.procedure || "",
      };
      setReportInput(input);
      setShowReport(true);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao enviar avaliação");
    },
  });

  // ─── Clustering ─────────────────────────────────────────────────────────
  const clusteringResult = useClustering(reportInput);

  // ─── Loading / Not found ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!videoData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Vídeo não encontrado</h2>
        <Link href="/dashboard">
          <Button>Voltar ao Dashboard</Button>
        </Link>
      </div>
    );
  }

  const { video, myEvaluation } = videoData;
  const criteria = folderData?.criteria || [];
  const isOwner = currentUser?.id === folderData?.folder.ownerId;

  // ─── Handlers ───────────────────────────────────────────────────────────
  const handleCheckCriteria = (criteriaId: number) => {
    setCheckedCriteria((prev) => {
      const newChecked = { ...prev, [criteriaId]: !prev[criteriaId] };
      if (newChecked[criteriaId] && !scores[criteriaId]) {
        setScores((prevScores) => ({ ...prevScores, [criteriaId]: 3 }));
      }
      return newChecked;
    });
  };

  const handleScoreChange = (criteriaId: number, score: number) => {
    setScores((prev) => ({ ...prev, [criteriaId]: score }));
    if (!checkedCriteria[criteriaId]) {
      setCheckedCriteria((prev) => ({ ...prev, [criteriaId]: true }));
    }
  };

  const toggleDomain = (domain: string) => {
    setExpandedDomains((prev) => ({ ...prev, [domain]: !prev[domain] }));
  };

  const handleSubmit = async () => {
    const criteriaScores = Object.entries(scores)
      .filter(([criteriaId]) => checkedCriteria[parseInt(criteriaId)])
      .map(([criteriaId, score]) => ({
        criteriaId: parseInt(criteriaId),
        score,
      }));

    if (criteriaScores.length === 0) {
      toast.error("Selecione e avalie pelo menos um critério antes de enviar.");
      return;
    }

    submitEvaluation.mutate({
      videoId,
      folderId: video.folderId,
      criteriaScores,
      entrustmentLevel,
      feedback,
      strengths,
      improvements,
      isDraft: false,
    });
  };

  // Handler for owner to view report of a specific evaluation
  const handleViewEvalReport = (evalItem: {
    id: number;
    criteriaScores: unknown;
    entrustmentLevel: number | null;
    strengths: string | null;
    improvements: string | null;
    feedback: string | null;
  }) => {
    if (!folderData?.criteria || !folderData.folder.procedure) return;
    const input = buildClusteringInputFromEval(
      evalItem,
      folderData.criteria,
      folderData.folder.procedure
    );
    setReportInput(input);
    setSelectedEvalId(evalItem.id);
    setShowReport(true);
  };

  // ─── Group criteria by domain ───────────────────────────────────────────
  const groupedCriteria: { domain: string; items: typeof criteria }[] = [];
  const seenDomains = new Set<string>();
  for (const c of criteria) {
    if (!seenDomains.has(c.domain)) {
      seenDomains.add(c.domain);
      groupedCriteria.push({
        domain: c.domain,
        items: criteria.filter((x) => x.domain === c.domain),
      });
    }
  }

  const checkedCount = Object.values(checkedCriteria).filter(Boolean).length;
  const totalCriteria = criteria.length;
  // Prioriza a URL assinada (nuvem), depois caminhos locais
  const videoSrc = (video as any).url || video.s3Url || (video as any).localPath || undefined;

  // ═══════════════════════════════════════════════════════════════════════════
  // REPORT VIEW (shown for both evaluator revisiting and owner viewing)
  // ═══════════════════════════════════════════════════════════════════════════
  if (showReport && clusteringResult && reportInput) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setShowReport(false);
              setSelectedEvalId(null);
            }}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-serif text-2xl font-bold">Relatório de Avaliação</h1>
            <p className="text-muted-foreground">{video.title}</p>
          </div>
        </div>

        <EvaluationReport
          result={clusteringResult}
          entrustmentLevel={reportInput.entrustmentLevel}
          strengths={reportInput.strengths}
          improvements={reportInput.improvements}
          feedback={reportInput.feedback}
          procedureName={reportInput.procedureName}
          onClose={() => {
            setShowReport(false);
            setSelectedEvalId(null);
          }}
        />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN VIEW
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/folder/${video.folderId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="font-serif text-2xl font-bold">{video.title}</h1>
          <p className="text-muted-foreground">{video.description || "Sem descrição"}</p>
        </div>
        {/* Show report button for evaluator who already evaluated */}
        {myEvaluation && clusteringResult && !isOwner && (
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setShowReport(true)}
          >
            <FileBarChart className="h-4 w-4" />
            Ver Relatório
          </Button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Video Player */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-0">
              <div className="aspect-video bg-black relative flex items-center justify-center">
                {videoSrc ? (
                  <video
                    src={videoSrc}
                    className="w-full h-full"
                    controls
                    controlsList="nodownload"
                  />
                ) : (
                  <div className="text-white/60 text-center">
                    <Play className="h-16 w-16 mx-auto mb-2 opacity-50" />
                    <p>Vídeo não disponível</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Video Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>Adicionado em {formatDate(video.createdAt)}</span>
                  </div>
                </div>
                {myEvaluation && (
                  <Badge variant="secondary" className="gap-1 bg-emerald-100 text-emerald-700">
                    <Check className="h-3 w-3" />
                    Avaliado
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Previous Evaluations */}
          {evaluations && evaluations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Avaliações ({evaluations.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {evaluations.map((evalItem) => (
                    <div key={evalItem.id} className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm"
                            style={{
                              background: generateColorFromString(evalItem.evaluatorName || "U"),
                            }}
                          >
                            {getInitials(evalItem.evaluatorName)}
                          </div>
                          <span className="font-medium">{evalItem.evaluatorName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            <Star className="h-3 w-3 mr-1" />
                            Nível {evalItem.entrustmentLevel}/5
                          </Badge>
                          {evalItem.totalScore != null && evalItem.maxPossibleScore != null && evalItem.maxPossibleScore > 0 && (
                            <Badge variant="outline">
                              {Math.round((evalItem.totalScore / evalItem.maxPossibleScore) * 100)}%
                            </Badge>
                          )}
                          <span className="text-sm text-muted-foreground">
                            {formatDate(evalItem.createdAt)}
                          </span>
                        </div>
                      </div>
                      {evalItem.strengths && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-emerald-600 mb-1">Pontos Fortes:</p>
                          <p className="text-sm text-muted-foreground">{evalItem.strengths}</p>
                        </div>
                      )}
                      {evalItem.improvements && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-amber-600 mb-1">A Melhorar:</p>
                          <p className="text-sm text-muted-foreground">{evalItem.improvements}</p>
                        </div>
                      )}
                      {evalItem.feedback && (
                        <div className="mt-2">
                          <p className="text-xs font-medium mb-1">Feedback:</p>
                          <p className="text-sm text-muted-foreground">{evalItem.feedback}</p>
                        </div>
                      )}
                      {/* Report button for each evaluation */}
                      <div className="mt-3 flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => handleViewEvalReport(evalItem)}
                        >
                          <FileBarChart className="h-3.5 w-3.5" />
                          Ver Relatório EPA
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Evaluation Panel */}
        <div className="space-y-4">
          {!isOwner ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Avaliação EPA
                </CardTitle>
                {!myEvaluation && totalCriteria > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {checkedCount}/{totalCriteria} critérios avaliados
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {myEvaluation ? (
                  <div className="text-center py-8">
                    <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                      <Check className="h-8 w-8 text-emerald-600" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Avaliação Enviada</h3>
                    <p className="text-muted-foreground mb-4">
                      Você já avaliou este vídeo em {formatDate(myEvaluation.createdAt)}
                    </p>
                    {clusteringResult && (
                      <Button
                        variant="default"
                        className="gap-2"
                        onClick={() => setShowReport(true)}
                      >
                        <FileBarChart className="h-4 w-4" />
                        Ver Relatório de Fenotipagem
                      </Button>
                    )}
                  </div>
                ) : criteria.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Nenhum critério de avaliação configurado para esta pasta.
                      O administrador precisa criar uma lista de critérios (Topic List).
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Criteria Checklist */}
                    <ScrollArea className="max-h-[500px]">
                      <div className="space-y-4 pr-2">
                        {groupedCriteria.map((group) => {
                          const isExpanded = expandedDomains[group.domain] !== false;
                          const domainChecked = group.items.filter((i) => checkedCriteria[i.id]).length;
                          return (
                            <div key={group.domain} className="border rounded-lg overflow-hidden">
                              <button
                                type="button"
                                className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted transition-colors text-left"
                                onClick={() => toggleDomain(group.domain)}
                              >
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-sm">{group.domain}</h4>
                                  <Badge variant="outline" className="text-xs">
                                    {domainChecked}/{group.items.length}
                                  </Badge>
                                </div>
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                )}
                              </button>

                              {isExpanded && (
                                <div className="p-3 space-y-3">
                                  {group.items.map((item) => {
                                    const isChecked = checkedCriteria[item.id] || false;
                                    const score = scores[item.id] || 3;
                                    return (
                                      <div
                                        key={item.id}
                                        className={`rounded-lg border p-3 transition-colors ${
                                          isChecked
                                            ? "border-primary/30 bg-primary/5"
                                            : "border-transparent bg-muted/30 hover:bg-muted/50"
                                        }`}
                                      >
                                        <button
                                          type="button"
                                          className="flex items-start gap-3 w-full text-left"
                                          onClick={() => handleCheckCriteria(item.id)}
                                        >
                                          <div className="mt-0.5 shrink-0">
                                            {isChecked ? (
                                              <CheckCircle2 className="h-5 w-5 text-primary" />
                                            ) : (
                                              <Circle className="h-5 w-5 text-muted-foreground" />
                                            )}
                                          </div>
                                          <span className="text-sm leading-relaxed">
                                            {item.item}
                                          </span>
                                        </button>

                                        {isChecked && (
                                          <div className="mt-3 ml-8 space-y-1">
                                            <div className="flex items-center gap-3">
                                              <Slider
                                                value={[score]}
                                                onValueChange={([value]) =>
                                                  handleScoreChange(item.id, value)
                                                }
                                                min={1}
                                                max={5}
                                                step={1}
                                                className="flex-1"
                                              />
                                              <Badge
                                                variant={
                                                  score >= 4
                                                    ? "default"
                                                    : score >= 3
                                                    ? "secondary"
                                                    : "destructive"
                                                }
                                                className="w-8 justify-center text-xs"
                                              >
                                                {score}
                                              </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                              {SCORE_LABELS[score] || ""}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>

                    <Separator />

                    {/* Entrustment Level */}
                    <div className="space-y-3">
                      <EvalLabel className="font-semibold">Nível de Confiança (Entrustment)</EvalLabel>
                      <div className="space-y-2">
                        <Slider
                          value={[entrustmentLevel]}
                          onValueChange={([value]) => setEntrustmentLevel(value)}
                          min={1}
                          max={5}
                          step={1}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          {ENTRUSTMENT_LEVELS.map((level) => (
                            <span
                              key={level.level}
                              className={
                                entrustmentLevel === level.level
                                  ? "font-medium text-primary"
                                  : ""
                              }
                            >
                              {level.level}
                            </span>
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                          {ENTRUSTMENT_LEVELS[entrustmentLevel - 1]?.label}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    {/* Feedback Fields */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <EvalLabel>Pontos Fortes</EvalLabel>
                        <Textarea
                          placeholder="Descreva os pontos fortes observados..."
                          value={strengths}
                          onChange={(e) => setStrengths(e.target.value)}
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <EvalLabel>Pontos a Melhorar</EvalLabel>
                        <Textarea
                          placeholder="Descreva os pontos que precisam de melhoria..."
                          value={improvements}
                          onChange={(e) => setImprovements(e.target.value)}
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <EvalLabel>Feedback Geral</EvalLabel>
                        <Textarea
                          placeholder="Adicione observações gerais..."
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          rows={3}
                        />
                      </div>
                    </div>

                    <Button
                      className="w-full gap-2"
                      onClick={handleSubmit}
                      disabled={submitEvaluation.isPending || checkedCount === 0}
                    >
                      {submitEvaluation.isPending ? (
                        "Enviando..."
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Enviar Avaliação ({checkedCount} critérios)
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Proprietário</h3>
                <p className="text-muted-foreground">
                  Como proprietário deste ambiente, você não pode avaliar seus próprios vídeos.
                  Convide avaliadores para obter feedback.
                </p>
                {evaluations && evaluations.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-3">
                    Clique em <strong>"Ver Relatório EPA"</strong> em cada avaliação recebida abaixo para ver a fenotipagem.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function EvalLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={`text-sm font-medium ${className || ""}`}>{children}</label>;
}
