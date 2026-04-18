import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Mail,
  Check,
  X,
  FolderOpen,
  Stethoscope,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { formatDate, getInitials, generateColorFromString } from "@/lib/utils";
import { AREA_LABELS } from "@shared/surgical";
import { useAuth } from "@/contexts/AuthContext";

export function InviteAcceptPage() {
  const { token } = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const { data: inviteData, isLoading } = trpc.invites.getByToken.useQuery(
    { token: token || "" },
    { enabled: !!token }
  );

  const acceptInvite = trpc.invites.accept.useMutation({
    onSuccess: (data) => {
      toast.success("Convite aceito com sucesso!");
      navigate(`/folder/${data.folderId}`);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao aceitar convite");
    },
  });

  const declineInvite = trpc.invites.decline.useMutation({
    onSuccess: () => {
      toast.success("Convite recusado");
      navigate("/");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao recusar convite");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!inviteData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <X className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="font-serif text-xl font-bold mb-2">Convite Inválido</h2>
            <p className="text-muted-foreground mb-4">
              Este convite não foi encontrado ou já expirou.
            </p>
            <Button onClick={() => navigate("/")}>Voltar para o Início</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { invite, folderName, inviterName, folderArea, folderProcedure } = inviteData;

  // If user is not logged in, show login prompt
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/30">
        <Card className="max-w-md w-full">
          <CardContent className="p-8">
            <div
              className="h-16 w-16 rounded-xl flex items-center justify-center mx-auto mb-6"
              style={{
                background: `linear-gradient(135deg, ${generateColorFromString(folderName)} 0%, ${generateColorFromString(folderName + "2")} 100%)`,
              }}
            >
              <FolderOpen className="h-8 w-8 text-white" />
            </div>

            <div className="text-center mb-6">
              <h2 className="font-serif text-2xl font-bold mb-2">Convite para Avaliação</h2>
              <p className="text-muted-foreground">
                <span className="font-medium">{inviterName}</span> convidou você para avaliar vídeos
              </p>
            </div>

            <div className="bg-muted rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">
                  <Stethoscope className="h-3 w-3 mr-1" />
                  {AREA_LABELS[folderArea as keyof typeof AREA_LABELS] || folderArea}
                </Badge>
              </div>
              <h3 className="font-semibold text-lg">{folderName}</h3>
              <p className="text-sm text-muted-foreground">{folderProcedure}</p>
            </div>

            {invite.message && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <p className="text-sm italic text-amber-800">"{invite.message}"</p>
              </div>
            )}

            <div className="space-y-3">
              <p className="text-sm text-center text-muted-foreground">
                Faça login para aceitar o convite
              </p>
              <Button className="w-full gap-2" onClick={() => navigate("/")}>
                Fazer Login
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If invite is not pending
  if (invite.status !== "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="font-serif text-xl font-bold mb-2">Convite Já Respondido</h2>
            <p className="text-muted-foreground mb-4">
              Este convite já foi {invite.status === "accepted" ? "aceito" : "recusado"}.
            </p>
            <Button onClick={() => navigate("/dashboard")}>Ir para o Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/30">
      <Card className="max-w-md w-full">
        <CardContent className="p-8">
          <div
            className="h-16 w-16 rounded-xl flex items-center justify-center mx-auto mb-6"
            style={{
              background: `linear-gradient(135deg, ${generateColorFromString(folderName)} 0%, ${generateColorFromString(folderName + "2")} 100%)`,
            }}
          >
            <FolderOpen className="h-8 w-8 text-white" />
          </div>

          <div className="text-center mb-6">
            <h2 className="font-serif text-2xl font-bold mb-2">Convite para Avaliação</h2>
            <p className="text-muted-foreground">
              <span className="font-medium">{inviterName}</span> convidou você para avaliar vídeos
            </p>
          </div>

          <div className="bg-muted rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">
                <Stethoscope className="h-3 w-3 mr-1" />
                {AREA_LABELS[folderArea as keyof typeof AREA_LABELS] || folderArea}
              </Badge>
            </div>
            <h3 className="font-semibold text-lg">{folderName}</h3>
            <p className="text-sm text-muted-foreground">{folderProcedure}</p>
          </div>

          {invite.message && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-sm italic text-amber-800">"{invite.message}"</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => declineInvite.mutate({ token: token || "" })}
              disabled={declineInvite.isPending}
            >
              {declineInvite.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
              Recusar
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={() => acceptInvite.mutate({ token: token || "" })}
              disabled={acceptInvite.isPending}
            >
              {acceptInvite.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Aceitar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
