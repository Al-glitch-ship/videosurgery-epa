import { useState, useRef, useCallback } from "react";
import { useParams, Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  ArrowLeft,
  Video,
  Users,
  Mail,
  ClipboardList,
  Play,
  Upload,
  UserPlus,
  Check,
  Clock,
  MoreVertical,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { formatDate, formatFileSize, getInitials, generateColorFromString } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { AREA_LABELS } from "@shared/surgical";
import { useAuth } from "@/contexts/AuthContext";

export function FolderDetailPage() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const folderId = parseInt(id || "0");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: folderData, isLoading } = trpc.folders.get.useQuery({ id: folderId });
  const { data: videos } = trpc.videos.list.useQuery({ folderId });
  const { data: invites } = trpc.invites.listForFolder.useQuery({ folderId });
  const { data: evaluations } = trpc.evaluations.folderStats.useQuery({ folderId });

  const sendInvite = trpc.invites.send.useMutation({
    onSuccess: () => {
      toast.success("Convite enviado com sucesso!");
      setInviteEmail("");
      setInviteMessage("");
      setInviteDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao enviar convite");
    },
  });

  const utils = trpc.useUtils();

  const createVideoMutation = trpc.videos.create.useMutation({
    onSuccess: () => {
      utils.videos.list.invalidate({ folderId });
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao registrar vídeo");
    },
  });

  const deleteVideo = trpc.videos.delete.useMutation({
    onSuccess: () => {
      toast.success("Vídeo excluído com sucesso!");
      utils.videos.list.invalidate({ folderId });
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao excluir vídeo");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!folderData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Ambiente não encontrado</h2>
        <p className="text-muted-foreground mb-4">
          O ambiente que você está procurando não existe ou você não tem acesso
        </p>
        <Link href="/dashboard">
          <Button>Voltar ao Dashboard</Button>
        </Link>
      </div>
    );
  }

  const { folder, topicList, criteria, accessUsers } = folderData;
  const { user: currentUser } = useAuth();
  const isOwner = currentUser?.id === folder.ownerId;

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    sendInvite.mutate({
      folderId,
      email: inviteEmail,
      message: inviteMessage,
      origin: window.location.origin,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary">
                {AREA_LABELS[folder.area as keyof typeof AREA_LABELS] || folder.area}
              </Badge>
              <Badge variant="outline">{topicList?.procedureName}</Badge>
            </div>
            <h1 className="font-serif text-2xl font-bold">{folder.name}</h1>
            <p className="text-muted-foreground">{folder.description || "Sem descrição"}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {isOwner && (
            <Button variant="outline" className="gap-2" onClick={() => setInviteDialogOpen(true)}>
              <UserPlus className="h-4 w-4" />
              Convidar
            </Button>
          )}
          <Button className="gap-2" onClick={() => setUploadDialogOpen(true)}>
            <Upload className="h-4 w-4" />
            Adicionar Vídeo
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Video className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Vídeos</p>
              <p className="text-2xl font-bold">{videos?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avaliadores</p>
              <p className="text-2xl font-bold">{accessUsers?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <ClipboardList className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avaliações</p>
              <p className="text-2xl font-bold">{evaluations?.totalEvaluations || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="videos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="videos" className="gap-2">
            <Video className="h-4 w-4" />
            Vídeos
          </TabsTrigger>
          <TabsTrigger value="evaluators" className="gap-2">
            <Users className="h-4 w-4" />
            Avaliadores
          </TabsTrigger>
          <TabsTrigger value="criteria" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Critérios
          </TabsTrigger>
          {isOwner && (
            <TabsTrigger value="invites" className="gap-2">
              <Mail className="h-4 w-4" />
              Convites
            </TabsTrigger>
          )}
        </TabsList>

        {/* Videos Tab */}
        <TabsContent value="videos" className="space-y-4">
          {videos?.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Video className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Nenhum vídeo adicionado</h3>
                <p className="text-muted-foreground mb-4">
                  Adicione vídeos para começar a avaliação
                </p>
                <Button className="gap-2" onClick={() => setUploadDialogOpen(true)}>
                  <Upload className="h-4 w-4" />
                  Adicionar Vídeo
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos?.map((video) => (
                <Link key={video.id} href={`/video/${video.id}`}>
                  <Card className="card-hover cursor-pointer">
                    <CardContent className="p-0">
                      <div className="aspect-video bg-muted relative flex items-center justify-center group">
                        <Play className="h-12 w-12 text-muted-foreground group-hover:text-primary transition-colors" />
                        {video.durationSeconds && (
                          <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            {Math.floor(video.durationSeconds / 60)}:
                            {(video.durationSeconds % 60).toString().padStart(2, "0")}
                          </span>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold truncate">{video.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {video.description || "Sem descrição"}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{formatDate(video.createdAt)}</span>
                          {video.sizeBytes && <span>{formatFileSize(video.sizeBytes)}</span>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Evaluators Tab */}
        <TabsContent value="evaluators" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Avaliadores com Acesso</CardTitle>
              <CardDescription>
                Pessoas que podem avaliar os vídeos deste ambiente
              </CardDescription>
            </CardHeader>
            <CardContent>
              {accessUsers?.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum avaliador convidado ainda
                </p>
              ) : (
                <div className="space-y-4">
                  {accessUsers?.map((user) => (
                    <div key={user.userId} className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center text-white font-medium"
                        style={{ background: generateColorFromString(user.name || "U") }}
                      >
                        {getInitials(user.name)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <Badge variant="secondary">Avaliador</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Criteria Tab */}
        <TabsContent value="criteria" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Critérios de Avaliação</CardTitle>
              <CardDescription>
                Critérios intraoperatórios baseados nas EPAS
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-6">
                  {criteria?.reduce((acc: any[], criterion, index, array) => {
                    if (index === 0 || criterion.domain !== array[index - 1].domain) {
                      acc.push({
                        domain: criterion.domain,
                        items: array.filter((c) => c.domain === criterion.domain),
                      });
                    }
                    return acc;
                  }, []).map((group: any, groupIndex: number) => (
                    <div key={groupIndex}>
                      <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                        <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs">
                          {groupIndex + 1}
                        </span>
                        {group.domain}
                      </h4>
                      <div className="space-y-2 ml-8">
                        {group.items.map((item: any) => (
                          <div key={item.id} className="flex items-start gap-2 text-sm">
                            <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                            <span className="text-muted-foreground">{item.item}</span>
                          </div>
                        ))}
                      </div>
                      {groupIndex < criteria?.length - 1 && <Separator className="mt-4" />}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invites Tab */}
        {isOwner && (
          <TabsContent value="invites" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Convites Enviados</CardTitle>
                <CardDescription>
                  Histórico de convites para este ambiente
                </CardDescription>
              </CardHeader>
              <CardContent>
                {invites?.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum convite enviado ainda
                  </p>
                ) : (
                  <div className="space-y-4">
                    {invites?.map((invite) => (
                      <div key={invite.id} className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Mail className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{invite.inviteeName || invite.inviteeEmail}</p>
                          <p className="text-sm text-muted-foreground">
                            Enviado em {formatDate(invite.createdAt)}
                          </p>
                        </div>
                        <Badge
                          variant={
                            invite.status === "accepted"
                              ? "success"
                              : invite.status === "pending"
                              ? "warning"
                              : "secondary"
                          }
                        >
                          {invite.status === "accepted"
                            ? "Aceito"
                            : invite.status === "pending"
                            ? "Pendente"
                            : "Recusado"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar Avaliador</DialogTitle>
            <DialogDescription>
              Envie um convite para alguém avaliar os vídeos deste ambiente
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSendInvite} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email do Convidado</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@exemplo.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Mensagem (opcional)</Label>
              <textarea
                id="message"
                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Adicione uma mensagem pessoal..."
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setInviteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={sendInvite.isPending}>
                {sendInvite.isPending ? "Enviando..." : "Enviar Convite"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={(open) => {
        if (!isUploading) {
          setUploadDialogOpen(open);
          if (!open) {
            setSelectedFile(null);
            setUploadProgress(0);
            setVideoTitle("");
            setVideoDescription("");
            setIsDragOver(false);
          }
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Adicionar Vídeo</DialogTitle>
            <DialogDescription>
              Faça upload de um vídeo cirúrgico para avaliação
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo,.mp4,.mov,.avi,.webm,.ogg"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setSelectedFile(file);
                  if (!videoTitle) {
                    setVideoTitle(file.name.replace(/\.[^/.]+$/, ""));
                  }
                }
              }}
            />

            {/* Drop zone */}
            {!selectedFile ? (
              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                  isDragOver
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-primary/50"
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file && file.type.startsWith("video/")) {
                    setSelectedFile(file);
                    if (!videoTitle) {
                      setVideoTitle(file.name.replace(/\.[^/.]+$/, ""));
                    }
                  } else {
                    toast.error("Por favor, selecione um arquivo de vídeo válido.");
                  }
                }}
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-2">
                  Arraste e solte um vídeo aqui, ou clique para selecionar
                </p>
                <p className="text-xs text-muted-foreground">
                  MP4, MOV, AVI, WebM, OGG - sem limite de tamanho
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Selected file info */}
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Video className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  {!isUploading && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedFile(null);
                        setVideoTitle("");
                        setVideoDescription("");
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Title and description */}
                <div className="space-y-2">
                  <Label htmlFor="video-title">Título do Vídeo</Label>
                  <Input
                    id="video-title"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    placeholder="Nome do procedimento"
                    disabled={isUploading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="video-desc">Descrição (opcional)</Label>
                  <Input
                    id="video-desc"
                    value={videoDescription}
                    onChange={(e) => setVideoDescription(e.target.value)}
                    placeholder="Detalhes sobre o procedimento"
                    disabled={isUploading}
                  />
                </div>

                {/* Progress bar */}
                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Enviando...</span>
                      <span className="font-medium">{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (!isUploading) {
                    setUploadDialogOpen(false);
                    setSelectedFile(null);
                    setUploadProgress(0);
                    setVideoTitle("");
                    setVideoDescription("");
                  }
                }}
                disabled={isUploading}
              >
                Cancelar
              </Button>
              <Button
                disabled={!selectedFile || !videoTitle.trim() || isUploading}
                onClick={async () => {
                  if (!selectedFile || !videoTitle.trim()) return;
                  setIsUploading(true);
                  setUploadProgress(0);
 
                  try {
                    // 1. Pedir uma URL Assinada para o Google Cloud (Via Expressa)
                    const { uploadUrl, path: gcsPath } = await utils.client.videos.getUploadUrl.mutate({
                      folderId,
                      filename: selectedFile.name,
                      contentType: selectedFile.type || "video/mp4"
                    });

                    // 2. Upload DIRETO do navegador para o Google Cloud (Bypass de limite 413)
                    const xhr = new XMLHttpRequest();
                    const uploadPromise = new Promise<void>((resolve, reject) => {
                      xhr.upload.addEventListener("progress", (event) => {
                        if (event.lengthComputable) {
                          const percent = Math.round((event.loaded / event.total) * 100);
                          setUploadProgress(percent);
                        }
                      });
                      
                      xhr.addEventListener("load", () => {
                        if (xhr.status >= 200 && xhr.status < 300) {
                          resolve();
                        } else {
                          reject(new Error(`Erro no upload direto: ${xhr.statusText}`));
                        }
                      });
                      
                      xhr.addEventListener("error", () => reject(new Error("Erro de rede no upload direto")));
                      xhr.open("PUT", uploadUrl);
                      xhr.setRequestHeader("Content-Type", selectedFile.type || "video/mp4");
                      xhr.send(selectedFile);
                    });

                    await uploadPromise;

                    // 3. Registrar o vídeo no banco de dados com o caminho do GCS
                    await createVideoMutation.mutateAsync({
                      folderId,
                      title: videoTitle.trim(),
                      description: videoDescription.trim() || undefined,
                      localPath: gcsPath, // Agora salvamos o caminho relativo do GCS
                      mimeType: selectedFile.type,
                      sizeBytes: selectedFile.size,
                    });

                    toast.success("Vídeo enviado com sucesso para a nuvem!");
                    setUploadDialogOpen(false);
                    setSelectedFile(null);
                    setUploadProgress(0);
                    setVideoTitle("");
                    setVideoDescription("");
                  } catch (error: any) {
                    console.error("Upload error:", error);
                    toast.error(error.message || "Erro ao fazer upload do vídeo");
                  } finally {
                    setIsUploading(false);
                  }
                }}
              >
                {isUploading ? "Enviando..." : "Fazer Upload"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
