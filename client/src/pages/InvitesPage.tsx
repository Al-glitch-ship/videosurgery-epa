import { Link } from "wouter";
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
  ChevronRight,
  Inbox,
} from "lucide-react";
import { formatDate, getInitials, generateColorFromString } from "@/lib/utils";
import { AREA_LABELS } from "@shared/surgical";

export function InvitesPage() {
  const { data: invites, isLoading, refetch } = trpc.invites.myInvites.useQuery();

  const acceptInvite = trpc.invites.accept.useMutation({
    onSuccess: (data) => {
      toast.success("Convite aceito com sucesso!");
      refetch();
      // Redirect to the folder
      window.location.href = `/folder/${data.folderId}`;
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao aceitar convite");
    },
  });

  const declineInvite = trpc.invites.decline.useMutation({
    onSuccess: () => {
      toast.success("Convite recusado");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao recusar convite");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-bold">Convites</h1>
        <p className="text-muted-foreground">
          Gerencie seus convites para avaliar procedimentos cirúrgicos
        </p>
      </div>

      {/* Pending Invites */}
      <div className="space-y-4">
        <h2 className="font-serif text-xl font-semibold">Convites Pendentes</h2>

        {invites?.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Inbox className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Nenhum convite pendente</h3>
              <p className="text-muted-foreground">
                Você não tem convites pendentes no momento
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {invites?.map((invite) => (
              <Card key={invite.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row">
                    {/* Left side - Info */}
                    <div className="flex-1 p-6">
                      <div className="flex items-start gap-4">
                        <div
                          className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
                          style={{
                            background: `linear-gradient(135deg, ${generateColorFromString(invite.folderName)} 0%, ${generateColorFromString(invite.folderName + "2")} 100%)`,
                          }}
                        >
                          <FolderOpen className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-xs">
                              <Stethoscope className="h-3 w-3 mr-1" />
                              {AREA_LABELS[invite.folderArea as keyof typeof AREA_LABELS] || invite.folderArea}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {invite.folderProcedure}
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-lg truncate">{invite.folderName}</h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            Convidado por{" "}
                            <span className="font-medium">{invite.inviterName}</span>
                          </p>
                          {invite.message && (
                            <p className="text-sm italic bg-muted p-3 rounded-lg mt-2">
                              "{invite.message}"
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            Enviado em {formatDate(invite.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right side - Actions */}
                    <div className="flex sm:flex-col items-center justify-center gap-2 p-4 bg-muted/50 border-t sm:border-t-0 sm:border-l">
                      <Button
                        className="gap-2"
                        onClick={() => acceptInvite.mutate({ token: invite.token })}
                        disabled={acceptInvite.isPending}
                      >
                        <Check className="h-4 w-4" />
                        Aceitar
                      </Button>
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => declineInvite.mutate({ token: invite.token })}
                        disabled={declineInvite.isPending}
                      >
                        <X className="h-4 w-4" />
                        Recusar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
