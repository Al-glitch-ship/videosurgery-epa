import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FolderPlus,
  FolderOpen,
  Users,
  Video,
  TrendingUp,
  ChevronRight,
  Stethoscope,
  Trash2,
} from "lucide-react";
import { formatDate, getInitials, generateColorFromString } from "@/lib/utils";
import { AREA_LABELS } from "@shared/surgical";
import { toast } from "sonner";

export function DashboardPage() {
  const { data: myFolders, isLoading: loadingFolders } = trpc.folders.myFolders.useQuery();
  const { data: sharedFolders, isLoading: loadingShared } = trpc.folders.sharedWithMe.useQuery();
  const { data: myInvites } = trpc.invites.myInvites.useQuery();
  const utils = trpc.useUtils();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<{ id: number; name: string } | null>(null);

  const deleteFolderMutation = trpc.folders.delete.useMutation({
    onSuccess: () => {
      utils.folders.myFolders.invalidate();
      toast.success("Ambiente excluído com sucesso");
      setDeleteDialogOpen(false);
      setFolderToDelete(null);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao excluir ambiente");
    },
  });

  const handleDeleteClick = (e: React.MouseEvent, folder: { id: number; name: string }) => {
    e.preventDefault();
    e.stopPropagation();
    setFolderToDelete(folder);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (folderToDelete) {
      deleteFolderMutation.mutate({ id: folderToDelete.id });
    }
  };

  const pendingInvitesCount = myInvites?.length || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Gerencie seus ambientes de avaliação cirúrgica
          </p>
        </div>
        <Link href="/folder/new">
          <Button className="gap-2">
            <FolderPlus className="h-4 w-4" />
            Novo Ambiente
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Meus Ambientes</p>
                <p className="text-3xl font-bold">{myFolders?.length || 0}</p>
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
                <p className="text-sm text-muted-foreground">Compartilhados</p>
                <p className="text-3xl font-bold">{sharedFolders?.length || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Convites Pendentes</p>
                <p className="text-3xl font-bold">{pendingInvitesCount}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Vídeos</p>
                <p className="text-3xl font-bold">-</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Video className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* My Folders */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-semibold">Meus Ambientes</h2>
          <Link href="/folder/new">
            <Button variant="ghost" size="sm" className="gap-1">
              Ver todos
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {loadingFolders ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : myFolders?.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <FolderOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Nenhum ambiente criado</h3>
              <p className="text-muted-foreground mb-4">
                Crie seu primeiro ambiente para começar a avaliar procedimentos cirúrgicos
              </p>
              <Link href="/folder/new">
                <Button className="gap-2">
                  <FolderPlus className="h-4 w-4" />
                  Criar Ambiente
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myFolders?.slice(0, 6).map((folder) => (
              <Link key={folder.id} href={`/folder/${folder.id}`}>
                <Card className="card-hover cursor-pointer h-full group relative">
                  <CardContent className="p-0">
                    <div
                      className="h-24 rounded-t-xl relative"
                      style={{
                        background: `linear-gradient(135deg, ${generateColorFromString(folder.name)} 0%, ${generateColorFromString(folder.name + "2")} 100%)`,
                      }}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 bg-white/80 hover:bg-red-100 text-muted-foreground hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleDeleteClick(e, { id: folder.id, name: folder.name })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="secondary" className="text-xs">
                          <Stethoscope className="h-3 w-3 mr-1" />
                          {AREA_LABELS[folder.area as keyof typeof AREA_LABELS] || folder.area}
                        </Badge>
                      </div>
                      <h3 className="font-semibold truncate mb-1">{folder.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {folder.description || "Sem descrição"}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Criado em {formatDate(folder.createdAt)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Shared Folders */}
      {sharedFolders && sharedFolders.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold">Compartilhados Comigo</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sharedFolders.map((folder) => (
              <Link key={folder.id} href={`/folder/${folder.id}`}>
                <Card className="card-hover cursor-pointer h-full border-blue-200">
                  <CardContent className="p-0">
                    <div
                      className="h-24 rounded-t-xl"
                      style={{
                        background: `linear-gradient(135deg, ${generateColorFromString(folder.name)} 0%, ${generateColorFromString(folder.name + "2")} 100%)`,
                      }}
                    />
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="secondary" className="text-xs">
                          <Stethoscope className="h-3 w-3 mr-1" />
                          {AREA_LABELS[folder.area as keyof typeof AREA_LABELS] || folder.area}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          Convidado
                        </Badge>
                      </div>
                      <h3 className="font-semibold truncate mb-1">{folder.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {folder.description || "Sem descrição"}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Criado em {formatDate(folder.createdAt)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Ambiente</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o ambiente <strong>"{folderToDelete?.name}"</strong>?
              Esta ação é irreversível e todos os vídeos e avaliações associados serão perdidos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => { setDeleteDialogOpen(false); setFolderToDelete(null); }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteFolderMutation.isPending}
            >
              {deleteFolderMutation.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pending Invites */}
      {pendingInvitesCount > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Convites Pendentes</h3>
                  <p className="text-sm text-muted-foreground">
                    Você tem {pendingInvitesCount} convite{pendingInvitesCount > 1 ? "s" : ""} para avaliar
                  </p>
                </div>
              </div>
              <Link href="/invites">
                <Button variant="outline" className="gap-2">
                  Ver Convites
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
