import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  TrendingUp,
  Star,
  CheckCircle,
  Stethoscope,
  FolderOpen,
  Target,
  Activity,
  ChevronRight,
} from "lucide-react";
import { AREA_LABELS, SURGICAL_AREAS, PROCEDURES_BY_AREA, type SurgicalArea } from "@shared/surgical";

export function StatsPage() {
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [selectedProcedure, setSelectedProcedure] = useState<string>("");

  const { data: myFolders } = trpc.folders.myFolders.useQuery();
  const { data: areaStats } = trpc.evaluations.areaStats.useQuery(
    { area: selectedArea },
    { enabled: !!selectedArea }
  );
  const { data: procedureStats } = trpc.evaluations.procedureStats.useQuery(
    { area: selectedArea, procedure: selectedProcedure },
    { enabled: !!selectedArea && !!selectedProcedure }
  );

  // Available procedures for the selected area
  const availableProcedures = useMemo(() => {
    if (!selectedArea) return [];
    return PROCEDURES_BY_AREA[selectedArea as SurgicalArea] || [];
  }, [selectedArea]);

  // Calculate overall stats from myFolders
  const totalFolders = myFolders?.length || 0;

  // Group folders by area
  const foldersByArea = useMemo(() => {
    return myFolders?.reduce((acc, folder) => {
      if (!acc[folder.area]) acc[folder.area] = [];
      acc[folder.area].push(folder);
      return acc;
    }, {} as Record<string, typeof myFolders>) || {};
  }, [myFolders]);

  // Group folders by procedure within selected area
  const foldersByProcedure = useMemo(() => {
    if (!selectedArea || !myFolders) return {};
    return myFolders
      .filter((f) => f.area === selectedArea)
      .reduce((acc, folder) => {
        if (!acc[folder.procedure]) acc[folder.procedure] = [];
        acc[folder.procedure].push(folder);
        return acc;
      }, {} as Record<string, typeof myFolders>);
  }, [selectedArea, myFolders]);

  const handleAreaChange = (area: string) => {
    setSelectedArea(area);
    setSelectedProcedure("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-bold">Estatísticas</h1>
        <p className="text-muted-foreground">
          Acompanhe seu progresso e desempenho nos procedimentos cirúrgicos
        </p>
      </div>

      {/* Overall Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Ambientes</p>
                <p className="text-3xl font-bold">{totalFolders}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FolderOpen className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Áreas Cirúrgicas</p>
                <p className="text-3xl font-bold">{Object.keys(foldersByArea).length}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Stethoscope className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Procedimentos</p>
                <p className="text-3xl font-bold">
                  {Object.keys(
                    myFolders?.reduce((acc, f) => { acc[f.procedure] = true; return acc; }, {} as Record<string, boolean>) || {}
                  ).length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Target className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Média Geral</p>
                <p className="text-3xl font-bold">
                  {areaStats?.length
                    ? Math.round(
                        areaStats.reduce((acc, s) => acc + s.avgOverallPercentage, 0) /
                          areaStats.filter((s) => s.totalEvaluations > 0).length || 1
                      )
                    : "—"}
                  {areaStats?.length ? "%" : ""}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Area & Procedure Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Filtrar por Área e Procedimento
          </CardTitle>
          <CardDescription>
            Selecione uma área cirúrgica e um procedimento para ver estatísticas detalhadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedArea} onValueChange={handleAreaChange}>
              <SelectTrigger className="w-full sm:w-72">
                <SelectValue placeholder="Selecione uma área cirúrgica" />
              </SelectTrigger>
              <SelectContent>
                {SURGICAL_AREAS.map((area) => (
                  <SelectItem key={area} value={area}>
                    {AREA_LABELS[area]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedArea && (
              <Select value={selectedProcedure} onValueChange={setSelectedProcedure}>
                <SelectTrigger className="w-full sm:w-72">
                  <SelectValue placeholder="Selecione um procedimento" />
                </SelectTrigger>
                <SelectContent>
                  {availableProcedures.map((proc) => (
                    <SelectItem key={proc.code} value={proc.code}>
                      {proc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Area Stats */}
      {selectedArea && areaStats && !selectedProcedure && (
        <Card>
          <CardHeader>
            <CardTitle>
              {AREA_LABELS[selectedArea as keyof typeof AREA_LABELS]} — Visão Geral
            </CardTitle>
            <CardDescription>
              Estatísticas de todos os ambientes nesta área cirúrgica
            </CardDescription>
          </CardHeader>
          <CardContent>
            {areaStats.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma avaliação encontrada para esta área. Crie pastas e convide avaliadores.
              </p>
            ) : (
              <div className="space-y-4">
                {areaStats.map((stat) => (
                  <div
                    key={stat.folderId}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => {
                      const proc = stat.procedure;
                      if (proc) setSelectedProcedure(proc);
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div>
                          <h4 className="font-semibold">{stat.folderName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {availableProcedures.find((p) => p.code === stat.procedure)?.name || stat.procedure}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          <Star className="h-3 w-3 mr-1" />
                          {stat.avgEntrustment.toFixed(1)}
                        </Badge>
                        <Badge variant="outline">
                          {stat.totalEvaluations} avaliações
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Desempenho Geral</span>
                        <span className="font-medium">{stat.avgOverallPercentage.toFixed(1)}%</span>
                      </div>
                      <Progress value={stat.avgOverallPercentage} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Procedure Stats - Detailed View */}
      {selectedArea && selectedProcedure && procedureStats && (
        <div className="space-y-6">
          {/* Procedure Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                {availableProcedures.find((p) => p.code === selectedProcedure)?.name || selectedProcedure}
              </CardTitle>
              <CardDescription>
                {AREA_LABELS[selectedArea as keyof typeof AREA_LABELS]} — Estatísticas detalhadas por critérios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{procedureStats.totalFolders}</p>
                  <p className="text-sm text-muted-foreground">Ambientes</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{procedureStats.totalEvaluations}</p>
                  <p className="text-sm text-muted-foreground">Avaliações</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{procedureStats.avgOverallPercentage.toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground">Média Geral</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{procedureStats.avgEntrustment.toFixed(1)}/5</p>
                  <p className="text-sm text-muted-foreground">Nível Confiança</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Criteria Breakdown by Domain */}
          {procedureStats.domains.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                  Desempenho por Critérios
                </CardTitle>
                <CardDescription>
                  Média de pontuação para cada critério avaliado nas checkboxes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {procedureStats.domains.map((domain) => (
                    <div key={domain.domain}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-base">{domain.domain}</h4>
                        <Badge
                          variant={
                            domain.avgDomainScore >= 4
                              ? "default"
                              : domain.avgDomainScore >= 3
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          Média: {domain.avgDomainScore.toFixed(1)}/5
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        {domain.items.map((item) => (
                          <div key={item.id} className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <p className="text-sm flex-1 pr-4">{item.item}</p>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs text-muted-foreground">
                                  {item.totalResponses} resp.
                                </span>
                                <Badge
                                  variant={
                                    item.avgScore >= 4
                                      ? "default"
                                      : item.avgScore >= 3
                                      ? "secondary"
                                      : "destructive"
                                  }
                                  className="w-12 justify-center"
                                >
                                  {item.avgScore.toFixed(1)}
                                </Badge>
                              </div>
                            </div>
                            <Progress
                              value={(item.avgScore / 5) * 100}
                              className="h-1.5"
                            />
                          </div>
                        ))}
                      </div>
                      <Separator className="mt-4" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Per-Folder Breakdown */}
          {procedureStats.folderBreakdown.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  Detalhamento por Ambiente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {procedureStats.folderBreakdown.map((folder) => (
                    <div key={folder.folderId} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{folder.folderName}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            <Star className="h-3 w-3 mr-1" />
                            {folder.avgEntrustment.toFixed(1)}
                          </Badge>
                          <Badge variant="outline">
                            {folder.totalEvaluations} avaliações
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>Desempenho</span>
                          <span className="font-medium">{folder.avgOverallPercentage.toFixed(1)}%</span>
                        </div>
                        <Progress value={folder.avgOverallPercentage} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {procedureStats.totalEvaluations === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Sem avaliações ainda</h3>
                <p className="text-muted-foreground">
                  Nenhuma avaliação foi registrada para este procedimento. Faça upload de vídeos e convide avaliadores.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Folders by Area Summary */}
      {!selectedProcedure && (
        <Card>
          <CardHeader>
            <CardTitle>Ambientes por Área</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(foldersByArea).length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum ambiente criado ainda. Crie seu primeiro ambiente no Dashboard.
              </p>
            ) : (
              <div className="space-y-4">
                {Object.entries(foldersByArea).map(([area, folders]) => (
                  <div key={area}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <Stethoscope className="h-4 w-4" />
                        {AREA_LABELS[area as keyof typeof AREA_LABELS] || area}
                      </h4>
                      <Badge variant="secondary">{folders?.length} ambientes</Badge>
                    </div>
                    <div className="ml-6 space-y-1">
                      {folders?.map((folder) => (
                        <div
                          key={folder.id}
                          className="flex items-center justify-between py-2 px-3 bg-muted rounded-lg"
                        >
                          <span className="text-sm">{folder.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {(PROCEDURES_BY_AREA[folder.area as SurgicalArea] || []).find(
                              (p) => p.code === folder.procedure
                            )?.name || folder.procedure}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
