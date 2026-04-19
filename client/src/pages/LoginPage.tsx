import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Shield, GraduationCap, Video, ArrowRight } from "lucide-react";

export function LoginPage() {
  const handleLogin = (role: string) => {
    window.location.href = `/api/auth/login?role=${role}`;
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col items-center justify-center p-4">
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#1a1a2e] to-[#2d5a4a]">
          <Video className="h-6 w-6 text-white" />
        </div>
        <span className="font-serif text-2xl font-bold text-[#1a1a2e]">
          VideoSurgery <span className="text-[#d4af37]">EPA</span>
        </span>
      </div>

      <Card className="w-full max-w-md shadow-xl border-none">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="font-serif text-2xl">Acesse sua Conta</CardTitle>
          <CardDescription>
            Selecione o seu perfil para entrar na plataforma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <Button 
            variant="outline" 
            className="w-full h-20 flex items-center justify-between p-6 hover:bg-slate-50 hover:border-[#1a1a2e]/30 group transition-all"
            onClick={() => handleLogin("admin")}
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-[#1a1a2e]/10 flex items-center justify-center group-hover:bg-[#1a1a2e] transition-colors">
                <Shield className="h-5 w-5 text-[#1a1a2e] group-hover:text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-slate-900">Dr. Alê (Administrador)</p>
                <p className="text-xs text-slate-500">Acesso total e gestão do sistema</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-[#1a1a2e]" />
          </Button>

          <Button 
            variant="outline" 
            className="w-full h-20 flex items-center justify-between p-6 hover:bg-slate-50 hover:border-[#4a7c59]/30 group transition-all"
            onClick={() => handleLogin("preceptor")}
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-[#4a7c59]/10 flex items-center justify-center group-hover:bg-[#4a7c59] transition-colors">
                <User className="h-5 w-5 text-[#4a7c59] group-hover:text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-slate-900">Avaliador / Preceptor</p>
                <p className="text-xs text-slate-500">Avaliar vídeos e dar feedback</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-[#4a7c59]" />
          </Button>

          <Button 
            variant="outline" 
            className="w-full h-20 flex items-center justify-between p-6 hover:bg-slate-50 hover:border-[#d4af37]/30 group transition-all"
            onClick={() => handleLogin("residente")}
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-[#d4af37]/10 flex items-center justify-center group-hover:bg-[#d4af37] transition-colors">
                <GraduationCap className="h-5 w-5 text-[#d4af37] group-hover:text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-slate-900">Residente / Aluno</p>
                <p className="text-xs text-slate-500">Enviar vídeos para serem avaliados</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-[#d4af37]" />
          </Button>
        </CardContent>
      </Card>
      
      <p className="mt-8 text-sm text-slate-500">
        Baseado nas EPAS da American Board of Surgery
      </p>
    </div>
  );
}
