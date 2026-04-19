import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Video,
  Users,
  CheckSquare,
  BarChart3,
  Shield,
  ArrowRight,
  Play,
  Check,
  User,
} from "lucide-react";
import { Link } from "wouter";

const AREAS = [
  { name: "Cirurgia Geral", count: 12 },
  { name: "Urologia", count: 5 },
  { name: "Coloproctologia", count: 4 },
  { name: "Cirurgia Vascular", count: 4 },
  { name: "Cirurgia Pediátrica", count: 4 },
  { name: "Oncologia Cirúrgica", count: 5 },
  { name: "Cuidados Críticos", count: 4 },
];

const GALLBLADDER_CRITERIA = [
  {
    number: 1,
    domain: "Preparação e Planejamento",
    items: [
      "Posiciona o paciente em decúbito dorsal com proclive",
      "Verifica equipamento de laparoscopia e insuflador",
      "Demonstra conhecimento do triângulo de Calot",
      "Planeja posicionamento dos trocartes",
      "Realiza timeout e confirma indicação cirúrgica",
    ],
  },
  {
    number: 2,
    domain: "Acesso e Exposição",
    items: [
      "Estabelece pneumoperitônio de forma segura",
      "Insere trocartes sob visão direta",
      "Obtém visão crítica de segurança (Critical View of Safety)",
      "Retrai o fundo da vesícula adequadamente",
      "Expõe o triângulo hepatocístico",
    ],
  },
  {
    number: 3,
    domain: "Dissecção e Identificação",
    items: [
      "Identifica o ducto cístico corretamente",
      "Identifica a artéria cística corretamente",
      "Disseca o triângulo de Calot de forma metódica",
      "Mantém dissecção próxima à vesícula",
      "Evita lesão do ducto biliar comum",
    ],
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#faf9f6] text-gray-900 antialiased">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#1a1a2e] to-[#2d5a4a]">
              <Video className="h-5 w-5 text-white" />
            </div>
            <span className="font-serif text-xl font-semibold">
              VideoSurgery <span className="text-[#d4af37]">EPA</span>
            </span>
          </a>
          <nav className="hidden md:flex items-center gap-1">
            <a href="#dashboard" className="px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-100">Dashboard</a>
            <a href="#areas" className="px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-100">Áreas</a>
            <a href="#criteria" className="px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-100">Critérios</a>
          </nav>
          <Link href="/login">
            <button className="px-4 py-2 bg-[#1a1a2e] text-white rounded-lg text-sm font-medium hover:bg-[#1a1a2e]/90">
              Entrar
            </button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e]/5 to-[#4a7c59]/5" />
        <div className="container mx-auto px-4 py-20 lg:py-32 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#1a1a2e]/10 px-4 py-1.5 text-sm font-medium text-[#1a1a2e]">
                <Check className="h-4 w-4" />
                Baseado nas EPAS da ABS
              </div>
              <h1 className="font-serif text-4xl lg:text-6xl font-bold leading-tight">
                Avaliação de Procedimentos{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1a1a2e] to-[#4a7c59]">
                  Cirúrgicos
                </span>
              </h1>
              <p className="text-lg text-gray-600 max-w-lg">
                Plataforma completa para avaliação de vídeos cirúrgicos baseada nas
                Entrustable Professional Activities (EPAs) da American Board of Surgery.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/login">
                  <button className="px-6 py-3 bg-[#1a1a2e] text-white rounded-lg font-medium hover:bg-[#1a1a2e]/90 flex items-center gap-2">
                    Começar Agora
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
                <button className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Ver Demonstração
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a2e]/20 to-[#4a7c59]/20 rounded-3xl blur-3xl" />
              <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border">
                <div className="aspect-video bg-gradient-to-br from-[#1a1a2e] to-[#2d5a4a] flex items-center justify-center">
                  <div className="text-center text-white">
                    <Video className="h-16 w-16 mx-auto mb-4 opacity-80" />
                    <p className="text-lg font-medium">Player de Vídeo</p>
                    <p className="text-sm opacity-70">Com avaliação em tempo real</p>
                  </div>
                </div>
                <div className="p-4 bg-white">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-[#1a1a2e]/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-[#1a1a2e]" />
                    </div>
                    <div>
                      <p className="font-medium">Dr. Silva</p>
                      <p className="text-xs text-gray-500">Colecistectomia Laparoscópica</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: "Preparação", filled: 4 },
                      { label: "Dissecção", filled: 5 },
                      { label: "Execução", filled: 3 },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{item.label}</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <span
                              key={i}
                              className={`h-2 w-2 rounded-full ${
                                i <= item.filled ? "bg-green-500" : "bg-gray-200"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="dashboard" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-serif text-3xl font-bold mb-4">Recursos Principais</h2>
            <p className="text-gray-600">
              Tudo que você precisa para avaliar e acompanhar o progresso de procedimentos cirúrgicos
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Video,
                title: "Upload de Vídeos",
                description: "Armazene e organize vídeos cirúrgicos de forma segura",
              },
              {
                icon: Users,
                title: "Convites",
                description: "Convide avaliadores para analisar seus procedimentos",
              },
              {
                icon: CheckSquare,
                title: "Critérios EPA",
                description: "Avaliação baseada em critérios intraoperatórios padronizados",
              },
              {
                icon: BarChart3,
                title: "Estatísticas",
                description: "Acompanhe seu progresso com gráficos detalhados",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.15)]"
              >
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#1a1a2e] to-[#2d5a4a] flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Areas */}
      <section id="areas" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-serif text-3xl font-bold mb-4">
              Áreas Cirúrgicas Suportadas
            </h2>
            <p className="text-gray-600">
              Critérios específicos para cada especialidade baseados nas EPAS da ABS
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {AREAS.map((area, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3"
              >
                <div className="h-10 w-10 rounded-lg bg-[#1a1a2e]/10 flex items-center justify-center shrink-0">
                  <Shield className="h-5 w-5 text-[#1a1a2e]" />
                </div>
                <div>
                  <p className="font-medium">{area.name}</p>
                  <p className="text-xs text-gray-500">{area.count} procedimentos</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Criteria Preview */}
      <section id="criteria" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-serif text-3xl font-bold mb-4">
              Critérios Intraoperatórios
            </h2>
            <p className="text-gray-600">
              Exemplo de critérios gerados automaticamente para Gallbladder Disease
            </p>
          </div>
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="p-4 bg-[#1a1a2e]/5 border-b">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-[#1a1a2e] text-white text-xs rounded">
                    Cirurgia Geral
                  </span>
                  <span className="text-gray-600">&rarr;</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                    Gallbladder Disease
                  </span>
                </div>
              </div>
              <div className="p-6 space-y-6">
                {GALLBLADDER_CRITERIA.map((section, sectionIndex) => (
                  <div key={section.number}>
                    {sectionIndex > 0 && <hr className="mb-6" />}
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-[#1a1a2e]/10 flex items-center justify-center text-xs">
                        {section.number}
                      </span>
                      {section.domain}
                    </h4>
                    <div className="space-y-2 ml-8">
                      {section.items.map((item, itemIndex) => (
                        <div
                          key={itemIndex}
                          className="flex items-start gap-2 text-sm text-gray-600"
                        >
                          <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a1a2e] to-[#2d5a4a] p-12 lg:p-20 text-center">
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="font-serif text-3xl lg:text-4xl font-bold text-white mb-4">
                Pronto para começar?
              </h2>
              <p className="text-white/80 mb-8">
                Crie sua conta gratuitamente e comece a avaliar seus procedimentos
                cirúrgicos com critérios baseados nas EPAS da ABS.
              </p>
              <Link href="/login">
                <button className="px-8 py-4 bg-white text-[#1a1a2e] rounded-lg font-semibold hover:bg-gray-100 flex items-center gap-2 mx-auto">
                  Criar Conta Gratuita
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
            </div>
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#1a1a2e] to-[#2d5a4a]">
                <Video className="h-4 w-4 text-white" />
              </div>
              <span className="font-serif font-semibold">
                VideoSurgery <span className="text-[#d4af37]">EPA</span>
              </span>
            </div>
            <p className="text-sm text-gray-500">
              &copy; 2024 VideoSurgery EPA. Baseado nas EPAS da American Board of Surgery.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
