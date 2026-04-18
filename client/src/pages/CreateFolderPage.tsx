import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  ArrowLeft,
  FolderPlus,
  Stethoscope,
  ClipboardList,
  Check,
  Loader2,
  Sparkles,
} from "lucide-react";
import { AREA_LABELS } from "@shared/surgical";

export function CreateFolderPage() {
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [selectedProcedure, setSelectedProcedure] = useState("");
  const [showCriteria, setShowCriteria] = useState(false);

  const { data: areas } = trpc.surgical.areas.useQuery();
  const { data: procedures } = trpc.surgical.procedures.useQuery(
    { area: selectedArea },
    { enabled: !!selectedArea }
  );
  const { data: defaultCriteria } = trpc.surgical.defaultCriteria.useQuery(
    { procedure: selectedProcedure },
    { enabled: !!selectedProcedure }
  );

  const createFolder = trpc.folders.create.useMutation({
    onSuccess: (data) => {
      toast.success("Ambiente criado com sucesso!");
      navigate(`/folder/${data.id}`);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar ambiente");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !selectedArea || !selectedProcedure) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    createFolder.mutate({
      name,
      description,
      area: selectedArea,
      procedure: selectedProcedure,
      autoCreateCriteria: true,
    });
  };

  const handleAreaChange = (value: string) => {
    setSelectedArea(value);
    setSelectedProcedure("");
    setShowCriteria(false);
  };

  const handleProcedureChange = (value: string) => {
    setSelectedProcedure(value);
    setShowCriteria(true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="font-serif text-2xl font-bold">Novo Ambiente de Avaliação</h1>
          <p className="text-muted-foreground">
            Crie um ambiente para avaliação de procedimentos cirúrgicos
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderPlus className="h-5 w-5" />
              Informações Básicas
            </CardTitle>
            <CardDescription>
              Defina o nome e descrição do ambiente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nome do Ambiente <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Ex: Colecistectomias 2024"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descreva o propósito deste ambiente..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Area and Procedure */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Área e Procedimento
            </CardTitle>
            <CardDescription>
              Selecione a área cirúrgica e o procedimento específico
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Área Cirúrgica <span className="text-red-500">*</span>
                </Label>
                <Select value={selectedArea} onValueChange={handleAreaChange}>
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
                <Label>
                  Procedimento <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={selectedProcedure}
                  onValueChange={handleProcedureChange}
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

            {selectedArea && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Badge variant="secondary">
                  {AREA_LABELS[selectedArea as keyof typeof AREA_LABELS]}
                </Badge>
                {selectedProcedure && (
                  <>
                    <span className="text-muted-foreground">→</span>
                    <Badge variant="outline">
                      {procedures?.find((p) => p.code === selectedProcedure)?.name}
                    </Badge>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Criteria Preview */}
        {showCriteria && defaultCriteria && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Critérios de Avaliação
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Critérios intraoperatórios serão gerados automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96 rounded-md border">
                <div className="p-4 space-y-6">
                  {defaultCriteria.map((domain, domainIndex) => (
                    <div key={domainIndex}>
                      <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                        <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs">
                          {domainIndex + 1}
                        </span>
                        {domain.domain}
                      </h4>
                      <div className="space-y-2 ml-8">
                        {domain.items.map((item, itemIndex) => (
                          <div
                            key={itemIndex}
                            className="flex items-start gap-2 text-sm"
                          >
                            <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                            <span className="text-muted-foreground">{typeof item === 'string' ? item : item.text}</span>
                          </div>
                        ))}
                      </div>
                      {domainIndex < defaultCriteria.length - 1 && (
                        <Separator className="mt-4" />
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/dashboard")}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={createFolder.isPending || !name || !selectedArea || !selectedProcedure}
            className="gap-2"
          >
            {createFolder.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <FolderPlus className="h-4 w-4" />
                Criar Ambiente
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
