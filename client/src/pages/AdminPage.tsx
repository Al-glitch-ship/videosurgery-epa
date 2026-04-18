import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Settings,
  Users,
  ClipboardList,
  Plus,
  Check,
  Trash2,
  Stethoscope,
  Sparkles,
  Loader2,
} from "lucide-react";
import { AREA_LABELS, SURGICAL_AREAS } from "@shared/surgical";

export function AdminPage() {
  const [selectedArea, setSelectedArea] = useState("");
  const [selectedProcedure, setSelectedProcedure] = useState("");
  const [newCriteriaName, setNewCriteriaName] = useState("");

  const { data: topicLists, refetch } = trpc.topicLists.list.useQuery();
  const { data: areas } = trpc.surgical.areas.useQuery();
  const { data: procedures } = trpc.surgical.procedures.useQuery(
    { area: selectedArea },
    { enabled: !!selectedArea }
  );

  const generateFromDefaults = trpc.topicLists.generateFromDefaults.useMutation({
    onSuccess: (data) => {
      if (data.alreadyExists) {
        toast.info("Critérios já existem para este procedimento");
      } else {
        toast.success("Critérios gerados com sucesso!");
      }
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao gerar critérios");
    },
  });

  const handleGenerateCriteria = async () => {
    if (!selectedArea || !selectedProcedure) {
      toast.error("Selecione uma área e um procedimento");
      return;
    }
    generateFromDefaults.mutate({ area: selectedArea, procedure: selectedProcedure });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-bold">Painel Administrativo</h1>
        <p className="text-muted-foreground">
          Gerencie critérios de avaliação e configurações do sistema
        </p>
      </div>

      <Tabs defaultValue="criteria" className="space-y-4">
        <TabsList>
          <TabsTrigger value="criteria" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Critérios
          </TabsTrigger>
          <TabsTrigger value="generate" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Gerar Critérios
          </TabsTrigger>
        </TabsList>

        {/* Criteria List */}
        <TabsContent value="criteria" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Listas de Critérios
              </CardTitle>
              <CardDescription>
                Todas as listas de critérios cadastradas no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {topicLists?.map((list) => (
                    <Card key={list.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="secondary">
                                <Stethoscope className="h-3 w-3 mr-1" />
                                {AREA_LABELS[list.area as keyof typeof AREA_LABELS] || list.area}
                              </Badge>
                              {list.isActive ? (
                                <Badge variant="success" className="text-xs">Ativo</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">Inativo</Badge>
                              )}
                            </div>
                            <h4 className="font-semibold">{list.name}</h4>
                            <p className="text-sm text-muted-foreground">{list.procedureName}</p>
                            {list.description && (
                              <p className="text-sm text-muted-foreground mt-1">{list.description}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Generate Criteria */}
        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Gerar Critérios Padrão
              </CardTitle>
              <CardDescription>
                Gere critérios de avaliação automaticamente com base nas EPAS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Área Cirúrgica</Label>
                  <Select value={selectedArea} onValueChange={setSelectedArea}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma área" />
                    </SelectTrigger>
                    <SelectContent>
                      {areas?.map((area) => (
                        <SelectItem key={area.code} value={area.code}>
                          {area.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Procedimento</Label>
                  <Select
                    value={selectedProcedure}
                    onValueChange={setSelectedProcedure}
                    disabled={!selectedArea}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um procedimento" />
                    </SelectTrigger>
                    <SelectContent>
                      {procedures?.map((proc) => (
                        <SelectItem key={proc.code} value={proc.code}>
                          {proc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedArea && selectedProcedure && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Badge variant="secondary">
                    {AREA_LABELS[selectedArea as keyof typeof AREA_LABELS]}
                  </Badge>
                  <span className="text-muted-foreground">→</span>
                  <Badge variant="outline">
                    {procedures?.find((p) => p.code === selectedProcedure)?.name}
                  </Badge>
                </div>
              )}

              <Button
                onClick={handleGenerateCriteria}
                disabled={generateFromDefaults.isPending || !selectedArea || !selectedProcedure}
                className="gap-2"
              >
                {generateFromDefaults.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Gerar Critérios
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Procedimentos com Critérios Padrão</CardTitle>
              <CardDescription>
                Lista de procedimentos que possuem critérios predefinidos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Stethoscope className="h-4 w-4" />
                    Cirurgia Geral
                  </h4>
                  <div className="ml-6 space-y-1">
                    {["Gallbladder Disease", "Groin Hernia", "Ventral Hernia"].map((proc) => (
                      <div key={proc} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-emerald-500" />
                        {proc}
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Stethoscope className="h-4 w-4" />
                    Urologia
                  </h4>
                  <div className="ml-6 space-y-1">
                    {["Sling Vaginal"].map((proc) => (
                      <div key={proc} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-emerald-500" />
                        {proc}
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Stethoscope className="h-4 w-4" />
                    Outros Procedimentos
                  </h4>
                  <div className="ml-6 space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="h-4 w-4" />
                      Usam critérios EPA genéricos
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
