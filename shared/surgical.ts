// =============================================================================
// VideoSurgery EPA — shared/surgical.ts
// Sistema de Avaliação EPA com Milestones ACGME e Fenotipagem
// =============================================================================

// ─── Surgical Areas ─────────────────────────────────────────────────────────
export const SURGICAL_AREAS = [
  "CIRURGIA_GERAL",
  "UROLOGIA",
  "COLOPROCTOLOGIA",
  "CIRURGIA_VASCULAR",
  "CIRURGIA_PEDIATRICA",
  "ONCOLOGIA_CIRURGICA",
  "CUIDADOS_CRITICOS",
] as const;

export type SurgicalArea = (typeof SURGICAL_AREAS)[number];

export const AREA_LABELS: Record<SurgicalArea, string> = {
  CIRURGIA_GERAL: "Cirurgia Geral",
  UROLOGIA: "Urologia",
  COLOPROCTOLOGIA: "Coloproctologia",
  CIRURGIA_VASCULAR: "Cirurgia Vascular",
  CIRURGIA_PEDIATRICA: "Cirurgia Pediátrica",
  ONCOLOGIA_CIRURGICA: "Oncologia Cirúrgica Geral Complexa",
  CUIDADOS_CRITICOS: "Cuidados Críticos Cirúrgicos",
};

// ─── Procedures per Area ────────────────────────────────────────────────────
export interface ProcedureInfo {
  code: string;
  name: string;
}

export const PROCEDURES_BY_AREA: Record<SurgicalArea, ProcedureInfo[]> = {
  CIRURGIA_GERAL: [
    { code: "gallbladder", name: "Gallbladder Disease" },
    { code: "inguinal_hernia", name: "Inguinal Hernia" },
    { code: "abdominal_hernia", name: "Abdominal Wall Hernia" },
    { code: "appendicitis", name: "Appendicitis" },
    { code: "small_bowel_obstruction", name: "Small Bowel Obstruction" },
    { code: "colon", name: "Colon Disease" },
    { code: "breast", name: "Breast Disease" },
    { code: "thyroid", name: "Thyroid/Parathyroid Disease" },
    { code: "soft_tissue", name: "Soft Tissue Infection" },
    { code: "acute_abdomen", name: "Acute Abdomen" },
    { code: "trauma", name: "Trauma" },
    { code: "critically_ill", name: "Critically Ill Patient" },
  ],
  UROLOGIA: [
    { code: "sling_vaginal", name: "Sling Vaginal" },
    { code: "nefrectomia", name: "Nefrectomia" },
    { code: "prostatectomia", name: "Prostatectomia" },
    { code: "cistoscopia", name: "Cistoscopia" },
    { code: "litotripsia", name: "Litotripsia" },
  ],
  COLOPROCTOLOGIA: [
    { code: "colectomia", name: "Colectomia" },
    { code: "hemorroidectomia", name: "Hemorroidectomia" },
    { code: "fistulotomia", name: "Fistulotomia" },
    { code: "retossigmoidoscopia", name: "Retossigmoidoscopia" },
    { code: "resseccao_lesao_anal", name: "Ressecção de Lesão Anal para Biópsia" },
  ],
  CIRURGIA_VASCULAR: [
    { code: "endarterectomia", name: "Endarterectomia Carotídea" },
    { code: "bypass_periferico", name: "Bypass Periférico" },
    { code: "varizes", name: "Cirurgia de Varizes" },
    { code: "acesso_dialise", name: "Acesso para Diálise" },
  ],
  CIRURGIA_PEDIATRICA: [
    { code: "piloromiotomia", name: "Piloromiotomia" },
    { code: "hernia_inguinal_ped", name: "Hérnia Inguinal Pediátrica" },
    { code: "apendicectomia_ped", name: "Apendicectomia Pediátrica" },
    { code: "orquidopexia", name: "Orquidopexia" },
  ],
  ONCOLOGIA_CIRURGICA: [
    { code: "mastectomia", name: "Mastectomia" },
    { code: "gastrectomia", name: "Gastrectomia" },
    { code: "pancreatectomia", name: "Pancreatectomia" },
    { code: "hepatectomia", name: "Hepatectomia" },
    { code: "linfadenectomia", name: "Linfadenectomia" },
  ],
  CUIDADOS_CRITICOS: [
    { code: "laparotomia_trauma", name: "Laparotomia por Trauma" },
    { code: "toracotomia_emergencia", name: "Toracotomia de Emergência" },
    { code: "controle_danos", name: "Cirurgia de Controle de Danos" },
    { code: "traqueostomia", name: "Traqueostomia" },
  ],
};

// =============================================================================
// MILESTONES ACGME
// =============================================================================

export type MilestoneCategory = "PC2" | "PC3" | "MK2" | "SBP1";

export const MILESTONE_LABELS: Record<MilestoneCategory, string> = {
  PC2: "Patient Care 2 — Decisão Intraoperatória",
  PC3: "Patient Care 3 — Habilidade Técnica",
  MK2: "Medical Knowledge 2 — Conhecimento Anatômico",
  SBP1: "SBP 1 — Segurança e Prática Baseada em Sistemas",
};

export const MILESTONE_DESCRIPTIONS: Record<MilestoneCategory, string> = {
  PC2: "Capacidade de tomar decisões intraoperatórias adequadas, planejar abordagens e avaliar situações clínicas.",
  PC3: "Destreza técnica, controle de instrumentos, dissecção e execução procedimental.",
  MK2: "Conhecimento anatômico aplicado, identificação de estruturas e reconhecimento de variantes.",
  SBP1: "Práticas de segurança, timeout cirúrgico, verificação de equipamentos e protocolos.",
};

// =============================================================================
// CRITERIA WITH MILESTONES — 18 EPAs
// =============================================================================

export interface CriteriaItem {
  text: string;
  milestone: MilestoneCategory;
}

export interface CriteriaDomain {
  domain: string;
  items: CriteriaItem[] | string[];
}

/** Critérios com milestones por EPA */
const DEFAULT_CRITERIA: Record<string, CriteriaDomain[]> = {
  // EPA 1: Appendicitis
  EPA1_Appendicitis: [
    {
      domain: "A - Preparação",
      items: [
        { text: "Posicionamento adequado do paciente", milestone: "PC2" },
        { text: "Verificação de equipamentos laparoscópicos", milestone: "SBP1" },
        { text: "Planejamento do posicionamento dos trocartes", milestone: "PC2" },
        { text: "Timeout cirúrgico", milestone: "SBP1" },
      ],
    },
    {
      domain: "B - Acesso",
      items: [
        { text: "Estabelecimento seguro de pneumoperitônio", milestone: "PC2" },
        { text: "Inserção de trocartes sob visão direta", milestone: "PC3" },
        { text: "Exploração da cavidade abdominal", milestone: "MK2" },
        { text: "Localização do apêndice", milestone: "MK2" },
      ],
    },
    {
      domain: "C - Dissecção",
      items: [
        { text: "Dissecção do mesoapêndice", milestone: "PC3" },
        { text: "Ligadura dos vasos mesentéricos", milestone: "PC3" },
        { text: "Secção do apêndice", milestone: "PC3" },
        { text: "Controle de sangramento", milestone: "PC3" },
      ],
    },
    {
      domain: "D - Finalização",
      items: [
        { text: "Verificação de hemostasia", milestone: "PC2" },
        { text: "Irrigação quando indicada", milestone: "PC2" },
        { text: "Remoção de trocartes sob visão", milestone: "PC2" },
      ],
    },
    {
      domain: "E - Habilidades",
      items: [
        { text: "Economia de movimentos", milestone: "PC3" },
        { text: "Uso adequado dos instrumentos", milestone: "PC3" },
        { text: "Coordenação bimanual", milestone: "PC3" },
        { text: "Resposta a dificuldades", milestone: "PC3" },
      ],
    },
  ],

  // EPA 2: Abdominal Wall Hernia
  EPA2_AbdominalHernia: [
    {
      domain: "A - Preparação",
      items: [
        { text: "Posicionamento adequado do paciente", milestone: "PC2" },
        { text: "Verificação de equipamentos e material de tela", milestone: "SBP1" },
        { text: "Avaliação de defeitos herniários prévios", milestone: "MK2" },
        { text: "Timeout cirúrgico", milestone: "SBP1" },
      ],
    },
    {
      domain: "B - Acesso",
      items: [
        { text: "Acesso à cavidade abdominal de forma segura", milestone: "PC3" },
        { text: "Lise de aderências sem lesão", milestone: "PC3" },
        { text: "Identificação dos planos teciduais", milestone: "MK2" },
      ],
    },
    {
      domain: "C - Redução",
      items: [
        { text: "Redução do conteúdo herniário", milestone: "PC2" },
        { text: "Avaliação da viabilidade", milestone: "MK2" },
        { text: "Medição do defeito herniário", milestone: "PC2" },
      ],
    },
    {
      domain: "D - Reparo",
      items: [
        { text: "Seleção de tela de tamanho apropriado", milestone: "PC2" },
        { text: "Posicionamento da tela com sobreposição adequada", milestone: "PC3" },
        { text: "Fixação segura da tela", milestone: "PC3" },
        { text: "Fechamento do defeito", milestone: "PC3" },
      ],
    },
    {
      domain: "E - Habilidades",
      items: [
        { text: "Economia de movimentos", milestone: "PC3" },
        { text: "Uso adequado dos instrumentos", milestone: "PC3" },
        { text: "Coordenação bimanual", milestone: "PC3" },
        { text: "Resposta a dificuldades", milestone: "PC3" },
      ],
    },
  ],

  // EPA 3: Breast Disease
  EPA3_Breast: [
    {
      domain: "A - Preparação",
      items: [
        { text: "Posicionamento adequado do paciente", milestone: "PC2" },
        { text: "Confirmação da localização da lesão", milestone: "MK2" },
        { text: "Verificação de equipamentos", milestone: "SBP1" },
        { text: "Timeout cirúrgico", milestone: "SBP1" },
      ],
    },
    {
      domain: "B - Acesso",
      items: [
        { text: "Incisão adequada", milestone: "PC3" },
        { text: "Dissecção nos planos corretos", milestone: "PC3" },
        { text: "Identificação dos planos anatômicos", milestone: "MK2" },
      ],
    },
    {
      domain: "C - Ressecção",
      items: [
        { text: "Ressecção com margens adequadas", milestone: "PC2" },
        { text: "Orientação do espécime", milestone: "PC2" },
        { text: "Controle de sangramento", milestone: "PC3" },
      ],
    },
    {
      domain: "D - Finalização",
      items: [
        { text: "Avaliação de necessidade de drenos", milestone: "PC2" },
        { text: "Hemostasia completa", milestone: "PC3" },
        { text: "Fechamento com técnica apropriada", milestone: "PC2" },
      ],
    },
    {
      domain: "E - Habilidades",
      items: [
        { text: "Economia de movimentos", milestone: "PC3" },
        { text: "Uso adequado dos instrumentos", milestone: "PC3" },
        { text: "Coordenação bimanual", milestone: "PC3" },
        { text: "Resposta a dificuldades", milestone: "PC3" },
      ],
    },
  ],

  // EPA 4: Colon Disease
  EPA4_Colon: [
    {
      domain: "A - Preparação",
      items: [
        { text: "Posicionamento adequado do paciente", milestone: "PC2" },
        { text: "Verificação de equipamentos laparoscópicos", milestone: "SBP1" },
        { text: "Planejamento da extensão da ressecção", milestone: "PC2" },
        { text: "Timeout cirúrgico", milestone: "SBP1" },
      ],
    },
    {
      domain: "B - Acesso",
      items: [
        { text: "Estabelecimento seguro de pneumoperitônio", milestone: "PC2" },
        { text: "Inserção de trocartes sob visão direta", milestone: "PC3" },
        { text: "Mobilização segura do cólon", milestone: "PC3" },
      ],
    },
    {
      domain: "C - Dissecção Vascular",
      items: [
        { text: "Identificação e ligadura de vasos", milestone: "MK2" },
        { text: "Dissecção nos planos corretos", milestone: "PC3" },
        { text: "Preservação de estruturas adjacentes", milestone: "PC3" },
      ],
    },
    {
      domain: "D - Ressecção e Anastomose",
      items: [
        { text: "Ressecção com margens adequadas", milestone: "PC2" },
        { text: "Anastomose com técnica apropriada", milestone: "PC3" },
        { text: "Verificação de estanqueidade", milestone: "PC2" },
      ],
    },
    {
      domain: "E - Habilidades",
      items: [
        { text: "Economia de movimentos", milestone: "PC3" },
        { text: "Uso adequado dos instrumentos", milestone: "PC3" },
        { text: "Coordenação bimanual", milestone: "PC3" },
        { text: "Resposta a dificuldades", milestone: "PC3" },
      ],
    },
  ],

  // EPA 5: Acute Abdomen
  EPA5_AcuteAbdomen: [
    {
      domain: "A - Preparação",
      items: [
        { text: "Avaliação da necessidade de antibioticoterapia", milestone: "MK2" },
        { text: "Posicionamento adequado", milestone: "PC2" },
        { text: "Verificação de equipamentos", milestone: "SBP1" },
        { text: "Timeout cirúrgico", milestone: "SBP1" },
      ],
    },
    {
      domain: "B - Acesso",
      items: [
        { text: "Incisão adequada", milestone: "PC3" },
        { text: "Exploração sistemática da cavidade", milestone: "MK2" },
        { text: "Identificação da causa do abdome agudo", milestone: "MK2" },
      ],
    },
    {
      domain: "C - Tratamento",
      items: [
        { text: "Tratamento adequado da causa", milestone: "PC3" },
        { text: "Controle de contaminação", milestone: "PC3" },
        { text: "Ressecção quando indicada", milestone: "PC2" },
      ],
    },
    {
      domain: "D - Finalização",
      items: [
        { text: "Lavagem da cavidade abdominal", milestone: "PC2" },
        { text: "Posicionamento de drenos", milestone: "PC2" },
        { text: "Fechamento adequado", milestone: "PC2" },
      ],
    },
    {
      domain: "E - Habilidades",
      items: [
        { text: "Economia de movimentos", milestone: "PC3" },
        { text: "Uso adequado dos instrumentos", milestone: "PC3" },
        { text: "Coordenação bimanual", milestone: "PC3" },
        { text: "Resposta a situações críticas", milestone: "PC3" },
      ],
    },
  ],

  // EPA 6: Critically Ill Patient
  EPA6_CriticallyIll: [
    {
      domain: "A - Preparação",
      items: [
        { text: "Avaliação da estabilidade hemodinâmica", milestone: "MK2" },
        { text: "Coordenação com equipe multidisciplinar", milestone: "SBP1" },
        { text: "Verificação de equipamentos", milestone: "SBP1" },
        { text: "Timeout cirúrgico", milestone: "SBP1" },
      ],
    },
    {
      domain: "B - Acesso",
      items: [
        { text: "Incisão adequada", milestone: "PC3" },
        { text: "Exploração sistemática", milestone: "MK2" },
        { text: "Identificação do foco séptico", milestone: "MK2" },
      ],
    },
    {
      domain: "C - Controle da Sepse",
      items: [
        { text: "Drenagem de coleções purulentas", milestone: "PC3" },
        { text: "Remoção do foco de infecção", milestone: "PC3" },
        { text: "Controle de contaminação", milestone: "PC3" },
      ],
    },
    {
      domain: "D - Finalização",
      items: [
        { text: "Lavagem da cavidade", milestone: "PC2" },
        { text: "Posicionamento de drenos", milestone: "PC2" },
        { text: "Avaliação de fechamento temporário", milestone: "PC2" },
      ],
    },
    {
      domain: "E - Habilidades",
      items: [
        { text: "Economia de movimentos", milestone: "PC3" },
        { text: "Uso adequado dos instrumentos", milestone: "PC3" },
        { text: "Coordenação bimanual", milestone: "PC3" },
        { text: "Resposta a situações críticas", milestone: "PC3" },
      ],
    },
  ],

  // EPA 7: Carotid Endarterectomy
  EPA7_Carotid: [
    {
      domain: "A - Preparação",
      items: [
        { text: "Posicionamento adequado (extensão cervical)", milestone: "PC2" },
        { text: "Verificação de equipamentos vasculares", milestone: "SBP1" },
        { text: "Planejamento da abordagem", milestone: "PC2" },
        { text: "Timeout cirúrgico", milestone: "SBP1" },
      ],
    },
    {
      domain: "B - Acesso",
      items: [
        { text: "Incisão adequada no pescoço", milestone: "PC3" },
        { text: "Dissecção em camadas", milestone: "PC3" },
        { text: "Exposição da bifurcação carotídea", milestone: "MK2" },
      ],
    },
    {
      domain: "C - Endarterectomia",
      items: [
        { text: "Clampagem segura", milestone: "PC3" },
        { text: "Arteriotomia adequada", milestone: "PC3" },
        { text: "Remoção da placa aterosclerótica", milestone: "PC3" },
      ],
    },
    {
      domain: "D - Finalização",
      items: [
        { text: "Fechamento arterial", milestone: "PC3" },
        { text: "Verificação de fluxo", milestone: "PC2" },
        { text: "Fechamento em camadas", milestone: "PC2" },
      ],
    },
    {
      domain: "E - Habilidades",
      items: [
        { text: "Economia de movimentos", milestone: "PC3" },
        { text: "Uso adequado dos instrumentos", milestone: "PC3" },
        { text: "Coordenação bimanual", milestone: "PC3" },
        { text: "Resposta a situações críticas", milestone: "PC3" },
      ],
    },
  ],

  // EPA 8: Dialysis Access
  EPA8_Dialysis: [
    {
      domain: "A - Preparação",
      items: [
        { text: "Avaliação vascular pré-operatória", milestone: "PC2" },
        { text: "Planejamento do acesso", milestone: "PC2" },
        { text: "Posicionamento do braço", milestone: "PC2" },
        { text: "Verificação de equipamentos", milestone: "SBP1" },
      ],
    },
    {
      domain: "B - Acesso",
      items: [
        { text: "Incisão adequada", milestone: "PC3" },
        { text: "Dissecção de estruturas vasculares", milestone: "PC3" },
        { text: "Identificação da artéria e veia", milestone: "MK2" },
      ],
    },
    {
      domain: "C - Anastomose",
      items: [
        { text: "Controle vascular", milestone: "PC3" },
        { text: "Construção da anastomose", milestone: "PC3" },
        { text: "Tunelização do enxerto", milestone: "PC3" },
      ],
    },
    {
      domain: "D - Finalização",
      items: [
        { text: "Avaliação do fluxo", milestone: "PC2" },
        { text: "Fechamento adequado", milestone: "PC2" },
        { text: "Verificação da patência", milestone: "PC2" },
      ],
    },
    {
      domain: "E - Habilidades",
      items: [
        { text: "Economia de movimentos", milestone: "PC3" },
        { text: "Uso adequado dos instrumentos", milestone: "PC3" },
        { text: "Coordenação bimanual", milestone: "PC3" },
        { text: "Resposta a dificuldades", milestone: "PC3" },
      ],
    },
  ],

  // EPA 9: Endoscopy
  EPA9_Endoscopy: [
    {
      domain: "A - Preparação",
      items: [
        { text: "Verificação do equipamento endoscópico", milestone: "SBP1" },
        { text: "Posicionamento do paciente", milestone: "PC2" },
        { text: "Seleção do endoscópio adequado", milestone: "PC2" },
        { text: "Checagem de funções", milestone: "SBP1" },
      ],
    },
    {
      domain: "B - Intubação",
      items: [
        { text: "Intubação esofágica (EGD)", milestone: "PC3" },
        { text: "Insuflação do reto (colonoscopia)", milestone: "PC3" },
        { text: "Redução de alças", milestone: "PC3" },
      ],
    },
    {
      domain: "C - Exploração",
      items: [
        { text: "Visualização da mucosa", milestone: "MK2" },
        { text: "Alcance do ceco (colonoscopia)", milestone: "PC2" },
        { text: "Identificação de lesões", milestone: "MK2" },
      ],
    },
    {
      domain: "D - Procedimentos",
      items: [
        { text: "Biópsia adequada", milestone: "PC3" },
        { text: "Polipectomia segura", milestone: "PC3" },
        { text: "Tatuagem de lesões", milestone: "PC2" },
      ],
    },
    {
      domain: "E - Habilidades",
      items: [
        { text: "Controle do escopo", milestone: "PC3" },
        { text: "Insuflação/desinsuflação", milestone: "PC3" },
        { text: "Coordenação visão-mão", milestone: "PC3" },
        { text: "Resposta a dificuldades", milestone: "PC3" },
      ],
    },
  ],

  // EPA 10: Gallbladder (Colecistectomia)
  EPA10_Gallbladder: [
    {
      domain: "A - Preparação",
      items: [
        { text: "Posicionamento adequado do paciente", milestone: "PC2" },
        { text: "Verificação de equipamentos", milestone: "SBP1" },
        { text: "Conhecimento do triângulo de Calot", milestone: "MK2" },
        { text: "Planejamento do posicionamento dos trocartes", milestone: "PC2" },
        { text: "Timeout cirúrgico", milestone: "SBP1" },
      ],
    },
    {
      domain: "B - Acesso",
      items: [
        { text: "Estabelecimento seguro de pneumoperitônio", milestone: "PC2" },
        { text: "Inserção de trocartes sob visão direta", milestone: "PC3" },
        { text: "Obtenção da visão crítica de segurança", milestone: "PC3" },
        { text: "Retração adequada do fundo da vesícula", milestone: "PC3" },
        { text: "Exposição do triângulo hepatocístico", milestone: "MK2" },
      ],
    },
    {
      domain: "C - Dissecção",
      items: [
        { text: "Identificação correta do ducto cístico", milestone: "MK2" },
        { text: "Identificação correta da artéria cística", milestone: "MK2" },
        { text: "Dissecção metódica do triângulo de Calot", milestone: "PC3" },
        { text: "Manutenção da dissecção próxima à vesícula", milestone: "PC3" },
        { text: "Prevenção de lesão do ducto biliar comum", milestone: "PC3" },
      ],
    },
    {
      domain: "D - Execução",
      items: [
        { text: "Clipagem segura das estruturas", milestone: "PC3" },
        { text: "Dissecção do leito hepático", milestone: "PC3" },
        { text: "Extração da vesícula", milestone: "PC2" },
        { text: "Controle de sangramento", milestone: "PC3" },
        { text: "Fechamento adequado", milestone: "PC2" },
      ],
    },
    {
      domain: "E - Habilidades",
      items: [
        { text: "Economia de movimentos", milestone: "PC3" },
        { text: "Uso adequado dos instrumentos", milestone: "PC3" },
        { text: "Coordenação bimanual", milestone: "PC3" },
        { text: "Resposta a dificuldades", milestone: "PC3" },
      ],
    },
  ],

  // EPA 11: Inguinal Hernia
  EPA11_InguinalHernia: [
    {
      domain: "A - Preparação",
      items: [
        { text: "Posicionamento adequado", milestone: "PC2" },
        { text: "Conhecimento da anatomia do canal inguinal", milestone: "MK2" },
        { text: "Planejamento da abordagem", milestone: "PC2" },
        { text: "Verificação de equipamentos", milestone: "SBP1" },
      ],
    },
    {
      domain: "B - Acesso",
      items: [
        { text: "Incisão adequada", milestone: "PC3" },
        { text: "Identificação dos anéis inguinais", milestone: "MK2" },
        { text: "Dissecção em camadas", milestone: "PC3" },
      ],
    },
    {
      domain: "C - Dissecção",
      items: [
        { text: "Identificação do cordão espermático", milestone: "MK2" },
        { text: "Proteção do nervo ilioinguinal", milestone: "PC3" },
        { text: "Redução do conteúdo herniário", milestone: "PC2" },
        { text: "Avaliação do saco", milestone: "PC2" },
      ],
    },
    {
      domain: "D - Reparo",
      items: [
        { text: "Colocação adequada da malha", milestone: "PC3" },
        { text: "Fixação da malha", milestone: "PC3" },
        { text: "Fechamento em camadas", milestone: "PC3" },
      ],
    },
    {
      domain: "E - Habilidades",
      items: [
        { text: "Economia de movimentos", milestone: "PC3" },
        { text: "Uso adequado dos instrumentos", milestone: "PC3" },
        { text: "Coordenação bimanual", milestone: "PC3" },
        { text: "Resposta a dificuldades", milestone: "PC3" },
      ],
    },
  ],

  // EPA 12: Pancreatitis
  EPA12_Pancreatitis: [
    {
      domain: "A - Preparação",
      items: [
        { text: "Planejamento do acesso", milestone: "PC2" },
        { text: "Avaliação da necrose", milestone: "MK2" },
        { text: "Verificação de equipamentos", milestone: "SBP1" },
        { text: "Timeout cirúrgico", milestone: "SBP1" },
      ],
    },
    {
      domain: "B - Acesso",
      items: [
        { text: "Acesso percutâneo (dreno)", milestone: "PC3" },
        { text: "Acesso cirúrgico (necrosectomia)", milestone: "PC3" },
        { text: "Exposição adequada", milestone: "PC2" },
      ],
    },
    {
      domain: "C - Necrosectomia",
      items: [
        { text: "Debridamento da necrose", milestone: "PC3" },
        { text: "Preservação de tecido viável", milestone: "PC3" },
        { text: "Controle de sangramento", milestone: "PC3" },
      ],
    },
    {
      domain: "D - Finalização",
      items: [
        { text: "Drenagem adequada", milestone: "PC2" },
        { text: "Lavagem da cavidade", milestone: "PC2" },
        { text: "Planejamento de reoperações", milestone: "PC2" },
      ],
    },
    {
      domain: "E - Habilidades",
      items: [
        { text: "Economia de movimentos", milestone: "PC3" },
        { text: "Uso adequado dos instrumentos", milestone: "PC3" },
        { text: "Coordenação bimanual", milestone: "PC3" },
        { text: "Resposta a dificuldades", milestone: "PC3" },
      ],
    },
  ],

  // EPA 13: Small Bowel Obstruction
  EPA13_SmallBowelObstruction: [
    {
      domain: "A - Preparação",
      items: [
        { text: "Avaliação da viabilidade intestinal", milestone: "MK2" },
        { text: "Planejamento da abordagem", milestone: "PC2" },
        { text: "Verificação de equipamentos", milestone: "SBP1" },
        { text: "Timeout cirúrgico", milestone: "SBP1" },
      ],
    },
    {
      domain: "B - Acesso",
      items: [
        { text: "Acesso ao abdome (reoperatório)", milestone: "PC3" },
        { text: "Entrada no espaço peritoneal", milestone: "PC3" },
        { text: "Lise de aderências", milestone: "PC3" },
      ],
    },
    {
      domain: "C - Identificação",
      items: [
        { text: "Identificação da transição", milestone: "MK2" },
        { text: "Avaliação da viabilidade", milestone: "MK2" },
        { text: "Identificação da causa", milestone: "MK2" },
      ],
    },
    {
      domain: "D - Resolução",
      items: [
        { text: "Ressecção intestinal quando indicada", milestone: "PC2" },
        { text: "Anastomose segura", milestone: "PC3" },
        { text: "Fechamento do abdome", milestone: "PC2" },
      ],
    },
    {
      domain: "E - Habilidades",
      items: [
        { text: "Economia de movimentos", milestone: "PC3" },
        { text: "Uso adequado dos instrumentos", milestone: "PC3" },
        { text: "Coordenação bimanual", milestone: "PC3" },
        { text: "Resposta a dificuldades", milestone: "PC3" },
      ],
    },
  ],

  // EPA 14: Soft Tissue Infection
  EPA14_SoftTissue: [
    {
      domain: "A - Preparação",
      items: [
        { text: "Avaliação da extensão da infecção", milestone: "MK2" },
        { text: "Planejamento da incisão", milestone: "PC2" },
        { text: "Verificação de equipamentos", milestone: "SBP1" },
        { text: "Timeout cirúrgico", milestone: "SBP1" },
      ],
    },
    {
      domain: "B - Acesso",
      items: [
        { text: "Incisão adequada", milestone: "PC3" },
        { text: "Exposição do tecido infectado", milestone: "PC2" },
        { text: "Avaliação da profundidade", milestone: "MK2" },
      ],
    },
    {
      domain: "C - Debridamento",
      items: [
        { text: "Identificação do tecido necrosado", milestone: "MK2" },
        { text: "Dissecção até tecido viável", milestone: "PC3" },
        { text: "Debridamento radical", milestone: "PC3" },
      ],
    },
    {
      domain: "D - Finalização",
      items: [
        { text: "Lavagem da cavidade", milestone: "PC2" },
        { text: "Drenagem adequada", milestone: "PC2" },
        { text: "Planejamento de reabordagens", milestone: "PC2" },
      ],
    },
    {
      domain: "E - Habilidades",
      items: [
        { text: "Economia de movimentos", milestone: "PC3" },
        { text: "Uso adequado dos instrumentos", milestone: "PC3" },
        { text: "Coordenação bimanual", milestone: "PC3" },
        { text: "Resposta a dificuldades", milestone: "PC3" },
      ],
    },
  ],

  // EPA 15: Cutaneous Neoplasm
  EPA15_CutaneousNeoplasm: [
    {
      domain: "A - Preparação",
      items: [
        { text: "Planejamento das margens", milestone: "PC2" },
        { text: "Verificação de equipamentos", milestone: "SBP1" },
        { text: "Posicionamento adequado", milestone: "PC2" },
        { text: "Timeout cirúrgico", milestone: "SBP1" },
      ],
    },
    {
      domain: "B - Acesso",
      items: [
        { text: "Incisão com margens adequadas", milestone: "PC3" },
        { text: "Dissecção no plano subcutâneo", milestone: "PC3" },
        { text: "Preservação de estruturas adjacentes", milestone: "PC3" },
      ],
    },
    {
      domain: "C - Excisão",
      items: [
        { text: "Excisão com margens oncológicas", milestone: "PC2" },
        { text: "Biópsia de linfonodo sentinela", milestone: "PC2" },
        { text: "Orientação do espécime", milestone: "PC2" },
      ],
    },
    {
      domain: "D - Reconstrução",
      items: [
        { text: "Fechamento/reconstrução adequada", milestone: "PC2" },
        { text: "Preservação de função", milestone: "PC3" },
        { text: "Estética adequada", milestone: "PC3" },
      ],
    },
    {
      domain: "E - Habilidades",
      items: [
        { text: "Economia de movimentos", milestone: "PC3" },
        { text: "Uso adequado dos instrumentos", milestone: "PC3" },
        { text: "Coordenação bimanual", milestone: "PC3" },
        { text: "Resposta a dificuldades", milestone: "PC3" },
      ],
    },
  ],

  // EPA 16: Thyroid/Parathyroid
  EPA16_Thyroid: [
    {
      domain: "A - Preparação",
      items: [
        { text: "Posicionamento (extensão do pescoço)", milestone: "PC2" },
        { text: "Verificação de equipamentos (monitor de nervo)", milestone: "SBP1" },
        { text: "Planejamento da abordagem", milestone: "PC2" },
        { text: "Timeout cirúrgico", milestone: "SBP1" },
      ],
    },
    {
      domain: "B - Acesso",
      items: [
        { text: "Incisão adequada no pescoço", milestone: "PC3" },
        { text: "Dissecção em camadas", milestone: "PC3" },
        { text: "Exposição da glândula", milestone: "PC3" },
      ],
    },
    {
      domain: "C - Dissecção",
      items: [
        { text: "Identificação do nervo laríngeo recorrente", milestone: "MK2" },
        { text: "Preservação das glândulas paratireoides", milestone: "PC3" },
        { text: "Mobilização da tireoide", milestone: "PC3" },
      ],
    },
    {
      domain: "D - Ressecção",
      items: [
        { text: "Tireoidectomia/lobectomia", milestone: "PC2" },
        { text: "Paratireoidectomia quando indicada", milestone: "PC2" },
        { text: "Autotransplante paratireoide", milestone: "PC3" },
        { text: "Fechamento em camadas", milestone: "PC2" },
      ],
    },
    {
      domain: "E - Habilidades",
      items: [
        { text: "Economia de movimentos", milestone: "PC3" },
        { text: "Uso adequado dos instrumentos", milestone: "PC3" },
        { text: "Coordenação bimanual", milestone: "PC3" },
        { text: "Resposta a dificuldades", milestone: "PC3" },
      ],
    },
  ],

  // EPA 17: Trauma
  EPA17_Trauma: [
    {
      domain: "A - Preparação",
      items: [
        { text: "Avaliação primária (ABCDE)", milestone: "PC2" },
        { text: "Ativação do protocolo de transfusão massiva", milestone: "SBP1" },
        { text: "Planejamento de damage control", milestone: "PC2" },
        { text: "Comunicação com a equipe", milestone: "PC2" },
      ],
    },
    {
      domain: "B - Acesso",
      items: [
        { text: "Acesso vascular de grande calibre", milestone: "PC3" },
        { text: "Toracotomia de emergência quando indicada", milestone: "PC3" },
        { text: "Acesso abdominal rápido", milestone: "PC3" },
      ],
    },
    {
      domain: "C - Controle",
      items: [
        { text: "Identificação da fonte de sangramento", milestone: "PC2" },
        { text: "Empacotamento hepático", milestone: "PC3" },
        { text: "Empacotamento abdominal", milestone: "PC3" },
        { text: "Clampagem da aorta quando indicada", milestone: "PC3" },
      ],
    },
    {
      domain: "D - Damage Control",
      items: [
        { text: "Controle de sangramento", milestone: "PC3" },
        { text: "Deixar abdome aberto", milestone: "PC2" },
        { text: "Planejamento de reoperação", milestone: "PC2" },
      ],
    },
    {
      domain: "E - Habilidades",
      items: [
        { text: "Economia de movimentos", milestone: "PC3" },
        { text: "Uso adequado dos instrumentos", milestone: "PC3" },
        { text: "Coordenação bimanual", milestone: "PC3" },
        { text: "Resposta a situações críticas", milestone: "PC3" },
      ],
    },
  ],

  // EPA 18: Sling Vaginal (Roteiro Extraoficial — adaptado)
  EPA18_SlingVaginal: [
    {
      domain: "A - Preparação e Organização",
      items: [
        { text: "Posicionamento adequado da paciente", milestone: "PC2" },
        { text: "Checagem de materiais e instrumental", milestone: "SBP1" },
        { text: "Antissepsia e campo cirúrgico corretos", milestone: "SBP1" },
        { text: "Organização da sequência operatória", milestone: "PC2" },
      ],
    },
    {
      domain: "B - Exposição e Dissecção",
      items: [
        { text: "Incisão no plano correto", milestone: "PC3" },
        { text: "Dissecção anatômica adequada", milestone: "PC3" },
        { text: "Preservação de estruturas adjacentes", milestone: "PC3" },
        { text: "Controle de sangramento", milestone: "PC3" },
      ],
    },
    {
      domain: "C - Passagem do Sling",
      items: [
        { text: "Trajeto correto do introdutor", milestone: "PC3" },
        { text: "Simetria bilateral", milestone: "PC3" },
        { text: "Evita falsa via", milestone: "MK2" },
        { text: "Fluidez e controle dos movimentos", milestone: "PC3" },
      ],
    },
    {
      domain: "D - Posicionamento e Ajuste",
      items: [
        { text: "Posicionamento médio-uretral correto", milestone: "MK2" },
        { text: "Ajuste sem tensão excessiva", milestone: "PC3" },
        { text: "Teste funcional adequado (quando aplicável)", milestone: "PC2" },
      ],
    },
    {
      domain: "E - Finalização",
      items: [
        { text: "Revisão de hemostasia", milestone: "PC3" },
        { text: "Síntese vaginal adequada", milestone: "PC2" },
        { text: "Organização final do campo", milestone: "SBP1" },
      ],
    },
    {
      domain: "F - Habilidades Cirúrgicas Globais",
      items: [
        { text: "Economia de movimentos", milestone: "PC3" },
        { text: "Uso adequado dos instrumentos", milestone: "PC3" },
        { text: "Coordenação bimanual", milestone: "PC3" },
        { text: "Resposta a dificuldades técnicas", milestone: "PC3" },
      ],
    },
  ],

  // EPA 19: Ressecção de Lesão Anal para Biópsia
  EPA19_ResseccaoLesaoAnal: [
    {
      domain: "A - Preparação",
      items: [
        { text: "Realiza time-out cirúrgico completo, verifica equipamentos (cautério, iluminação, lupa/campo cirúrgico, material para biópsia), frascos para espécime e adota precauções contra HPV aerossolizado", milestone: "SBP1" },
        { text: "Posiciona paciente baseado na localização da lesão demonstrando entendimento da exposição, implementando proteção contra lesões por pressão e de nervos periféricos (pudendo, femoral, peroneal)", milestone: "PC2" },
        { text: "Desenvolve plano operatório inicial definindo indicações para biópsia excisional vs incisional e margens necessárias", milestone: "PC2" },
      ],
    },
    {
      domain: "B - Exposição e Avaliação",
      items: [
        { text: "Expõe campo operatório anal/perianal com técnica atraumática e realiza anoscopia intraoperatória para delimitar extensão da lesão", milestone: "PC3" },
        { text: "Realiza inspeção e palpação cuidadosa da lesão, identificando a anatomia esfincteriana (esfíncter anal interno, externo, sulco interesfinctérico) e planos teciduais corretos (plano submucoso, plano subcutâneo perianal, plano interesfinctérico)", milestone: "MK2" },
        { text: "Avalia características da lesão suspeitas de malignidade e modifica plano quando necessário", milestone: "PC2" },
      ],
    },
    {
      domain: "C - Execução da Ressecção",
      items: [
        { text: "Planeja margens de ressecção, avaliando extensão para obter margens profundas e laterais adequadas, e realiza biópsia incisional quando a excisional não é viável", milestone: "PC2" },
        { text: "Realiza incisão elíptica ou em cunha, disseca no plano correto preservando o complexo esfincteriano e executa ressecção completa em monobloco", milestone: "PC3" },
        { text: "Controla sangramento com cauterização precisa, ligadura ou sutura mantendo hemostasia segura", milestone: "PC3" },
        { text: "Orienta adequadamente o espécime cirúrgico para avaliação patológica", milestone: "SBP1" },
      ],
    },
    {
      domain: "D - Preservação Anatômica",
      items: [
        { text: "Preserva complexo esfincteriano, ductos anais, glândulas circunvizinhas e nervos perianais responsáveis pela sensibilidade e função continente", milestone: "MK2" },
        { text: "Reconhece invasão de estruturas profundas e adapta técnica ou planeja encaminhamento especializado", milestone: "PC2" },
        { text: "Planeja fechamento ou manter ferida aberta baseado no tamanho, localização e risco de infecção", milestone: "PC2" },
      ],
    },
    {
      domain: "E - Adaptação e Complicações",
      items: [
        { text: "Integra achados intraoperatórios inesperados e lesões inadvertidas, modificando plano, decidindo por reparo imediato ou encaminhamento", milestone: "PC2" },
        { text: "Controla sangramento agudo e modifica seleção de instrumentos e manuseio de tecidos baseado em achados intraoperatórios", milestone: "PC3" },
        { text: "Reconhece limites de competência técnica e solicita assistência quando necessário", milestone: "SBP1" },
      ],
    },
    {
      domain: "F - Fechamento e Finalização",
      items: [
        { text: "Manuseia tecidos com técnica atraumática, mantém campo operatório seco, demonstra economia de movimentos e coordenação bimanual eficiente", milestone: "PC3" },
        { text: "Executa fechamento da ferida com material e técnica apropriados (suturas em camadas, tensão correta) ou realiza enxerto de pele/retalho local quando indicado", milestone: "PC3" },
        { text: "Realiza contagem final de instrumentos e compressas, documenta achados intraoperatórios relevantes e posiciona curativo adequado, instruindo equipe sobre cuidados pós-operatórios", milestone: "SBP1" },
      ],
    },
  ],
};

// =============================================================================
// BACKWARD-COMPATIBLE CRITERIA MAPPING
// Maps old procedure codes to new EPA codes
// =============================================================================

const PROCEDURE_TO_EPA: Record<string, string> = {
  appendicitis: "EPA1_Appendicitis",
  abdominal_hernia: "EPA2_AbdominalHernia",
  breast: "EPA3_Breast",
  colon: "EPA4_Colon",
  acute_abdomen: "EPA5_AcuteAbdomen",
  critically_ill: "EPA6_CriticallyIll",
  endarterectomia: "EPA7_Carotid",
  acesso_dialise: "EPA8_Dialysis",
  retossigmoidoscopia: "EPA9_Endoscopy",
  gallbladder: "EPA10_Gallbladder",
  inguinal_hernia: "EPA11_InguinalHernia",
  // pancreatitis not in old codes but map for completeness
  small_bowel_obstruction: "EPA13_SmallBowelObstruction",
  soft_tissue: "EPA14_SoftTissue",
  // cutaneous neoplasm not in old codes
  thyroid: "EPA16_Thyroid",
  trauma: "EPA17_Trauma",
  sling_vaginal: "EPA18_SlingVaginal",
  resseccao_lesao_anal: "EPA19_ResseccaoLesaoAnal",
};

// =============================================================================
// HELPERS
// =============================================================================

/** Retorna os critérios de um procedimento (com milestones) */
export function getDefaultCriteria(procedureCode: string): CriteriaDomain[] {
  // Try new EPA code first
  if (DEFAULT_CRITERIA[procedureCode]) return DEFAULT_CRITERIA[procedureCode];
  // Try mapping from old code
  const epaCode = PROCEDURE_TO_EPA[procedureCode];
  if (epaCode && DEFAULT_CRITERIA[epaCode]) return DEFAULT_CRITERIA[epaCode];
  // Return generic
  return GENERIC_EPA_CRITERIA;
}

/**
 * Retorna apenas os textos dos itens (backward compat para código que esperava string[])
 */
export function getDefaultCriteriaTexts(procedureCode: string): { domain: string; items: string[] }[] {
  return getDefaultCriteria(procedureCode).map((d) => ({
    domain: d.domain,
    items: (d.items as any[]).map((i: any) => (typeof i === "string" ? i : i.text)),
  }));
}

/**
 * Lookup de milestone por texto do item
 */
export function getMilestoneForCriterion(
  procedureCode: string,
  itemText: string
): MilestoneCategory | undefined {
  const domains = getDefaultCriteria(procedureCode);
  for (const domain of domains) {
    for (const item of domain.items) {
      if (typeof item !== "string" && item.text === itemText) return item.milestone;
    }
  }
  return undefined;
}

/** Calcula score geral como percentual */
export function calculateOverallScore(
  criteriaScores: { score: number; maxScore: number }[]
): number {
  if (criteriaScores.length === 0) return 0;
  const totalScore = criteriaScores.reduce((acc, curr) => acc + curr.score, 0);
  const totalMaxScore = criteriaScores.reduce((acc, curr) => acc + curr.maxScore, 0);
  return totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;
}

// Generic criteria for procedures without specific EPA mapping
const GENERIC_EPA_CRITERIA: CriteriaDomain[] = [
  {
    domain: "Preparação e Planejamento",
    items: [
      { text: "Posiciona o paciente adequadamente", milestone: "PC2" as MilestoneCategory },
      { text: "Prepara e verifica equipamentos necessários", milestone: "SBP1" as MilestoneCategory },
      { text: "Demonstra conhecimento da anatomia relevante", milestone: "MK2" as MilestoneCategory },
      { text: "Planeja a abordagem cirúrgica de forma adequada", milestone: "PC2" as MilestoneCategory },
      { text: "Realiza o timeout/checklist de segurança", milestone: "SBP1" as MilestoneCategory },
    ],
  },
  {
    domain: "Exposição e Dissecção",
    items: [
      { text: "Obtém exposição adequada do campo operatório", milestone: "PC3" as MilestoneCategory },
      { text: "Manuseia tecidos com delicadeza e respeito", milestone: "PC3" as MilestoneCategory },
      { text: "Identifica planos anatômicos corretos", milestone: "MK2" as MilestoneCategory },
      { text: "Disseca com técnica apropriada e segura", milestone: "PC3" as MilestoneCategory },
      { text: "Controla sangramento de forma eficiente", milestone: "PC3" as MilestoneCategory },
    ],
  },
  {
    domain: "Execução do Procedimento",
    items: [
      { text: "Executa os passos críticos na sequência correta", milestone: "PC3" as MilestoneCategory },
      { text: "Demonstra destreza manual adequada", milestone: "PC3" as MilestoneCategory },
      { text: "Utiliza instrumentos de forma apropriada", milestone: "PC3" as MilestoneCategory },
      { text: "Mantém ritmo e fluxo operatório adequados", milestone: "PC3" as MilestoneCategory },
      { text: "Adapta a técnica quando necessário", milestone: "PC2" as MilestoneCategory },
    ],
  },
  {
    domain: "Manejo de Complicações",
    items: [
      { text: "Reconhece complicações intraoperatórias", milestone: "MK2" as MilestoneCategory },
      { text: "Toma decisões apropriadas diante de achados inesperados", milestone: "PC2" as MilestoneCategory },
      { text: "Solicita ajuda quando necessário", milestone: "SBP1" as MilestoneCategory },
      { text: "Mantém a calma em situações adversas", milestone: "PC3" as MilestoneCategory },
    ],
  },
  {
    domain: "Finalização",
    items: [
      { text: "Verifica hemostasia adequada", milestone: "PC3" as MilestoneCategory },
      { text: "Realiza contagem de compressas e instrumentos", milestone: "SBP1" as MilestoneCategory },
      { text: "Fecha a incisão com técnica apropriada", milestone: "PC2" as MilestoneCategory },
      { text: "Documenta o procedimento adequadamente", milestone: "SBP1" as MilestoneCategory },
      { text: "Comunica o plano pós-operatório à equipe", milestone: "PC2" as MilestoneCategory },
    ],
  },
];

// =============================================================================
// FENOTIPAGEM — 8 fenótipos baseados nos Milestones ACGME
// =============================================================================

export interface MilestoneScoresInput {
  pc2Percentage: number;
  pc3Percentage: number;
  mk2Percentage: number;
  sbp1Percentage: number;
  /** Diferença entre o domínio de maior e menor score (0–100) */
  domainVariability: number;
  /** Média dos scores por domínio (0–100) */
  domainAverage: number;
}

export interface PhenotypeResult {
  type:
    | "ALERTA_SEGURANCA"
    | "EXCELENTE"
    | "TECNICO_SOLIDO"
    | "DECISOR"
    | "EXECUTOR_MECANICO"
    | "PERFIL_IRREGULAR"
    | "INTEGRAL"
    | "EM_DESENVOLVIMENTO";
  label: string;
  description: string;
  color: string;
  icon: string;
}

/**
 * Determina o fenótipo de desempenho com 8 fenótipos.
 *
 * Ordem de prioridade:
 * 0. ALERTA_SEGURANCA — SBP1 < 40% (gatilho de segurança, sobrepõe qualquer outro)
 * 1. EXCELENTE — alto desempenho consistente
 * 2. TECNICO_SOLIDO — PC3 forte, PC2 fraco
 * 3. DECISOR — PC2 forte, PC3 fraco
 * 4. EXECUTOR_MECANICO — PC3≥75% + PC2≥62% + MK2<50%
 * 5. PERFIL_IRREGULAR — alta variabilidade entre domínios
 * 6. INTEGRAL — equilibrado, progresso adequado
 * 7. EM_DESENVOLVIMENTO — fase inicial
 */
export function determinePhenotype(
  overallScore: number,
  entrustmentLevel: number,
  milestoneScores?: MilestoneScoresInput
): PhenotypeResult {

  if (milestoneScores) {
    const { pc2Percentage, pc3Percentage, mk2Percentage, sbp1Percentage, domainVariability, domainAverage } = milestoneScores;

    // 0. ALERTA DE SEGURANÇA — SBP1 < 40% sobrepõe qualquer fenótipo
    if (sbp1Percentage < 40) {
      return {
        type: "ALERTA_SEGURANCA",
        label: "Alerta de Segurança",
        description: "Práticas de segurança abaixo do limiar aceitável (SBP1 < 40%). Prioridade máxima: reforçar protocolos de segurança, timeout cirúrgico e verificação de equipamentos.",
        color: "bg-red-700",
        icon: "🛡️",
      };
    }

    // 1. EXCELENTE — alto desempenho consistente em todas as dimensões
    if (domainAverage >= 87 && domainVariability < 25) {
      return {
        type: "EXCELENTE",
        label: "Excelente",
        description: "Alto desempenho consistente em todas as etapas. Pode atuar como mentor.",
        color: "bg-blue-500",
        icon: "⭐",
      };
    }

    // 2. TÉCNICO SÓLIDO — PC3 forte, PC2 fraco
    if (pc3Percentage >= 75 && pc2Percentage < 62) {
      return {
        type: "TECNICO_SOLIDO",
        label: "Técnico Sólido",
        description: "Boa destreza técnica; necessita desenvolver tomada de decisão intraoperatória.",
        color: "bg-emerald-500",
        icon: "🔧",
      };
    }

    // 3. DECISOR — PC2 forte, PC3 fraco
    if (pc2Percentage >= 75 && pc3Percentage < 62) {
      return {
        type: "DECISOR",
        label: "Decisor",
        description: "Boa decisão intraoperatória; necessita aprimorar habilidades técnicas.",
        color: "bg-teal-500",
        icon: "🧠",
      };
    }

    // 4. EXECUTOR MECÂNICO — PC3≥75% + PC2≥62% + MK2<50%
    if (pc3Percentage >= 75 && pc2Percentage >= 62 && mk2Percentage < 50) {
      return {
        type: "EXECUTOR_MECANICO",
        label: "Executor Mecânico",
        description: "Boa técnica e decisão, mas conhecimento anatômico insuficiente. Reforçar estudo de anatomia aplicada.",
        color: "bg-orange-500",
        icon: "⚙️",
      };
    }

    // 5. PERFIL IRREGULAR — alta variabilidade entre etapas
    if (domainVariability >= 37) {
      return {
        type: "PERFIL_IRREGULAR",
        label: "Perfil Irregular",
        description: "Desempenho variável entre etapas; requer treinamento direcionado nas etapas críticas.",
        color: "bg-amber-500",
        icon: "📊",
      };
    }

    // 6. INTEGRAL — equilibrado, progresso adequado
    if (domainAverage >= 62) {
      return {
        type: "INTEGRAL",
        label: "Integral",
        description: "Desempenho equilibrado em todas as áreas. Continuar progressão supervisionada.",
        color: "bg-yellow-500",
        icon: "✅",
      };
    }

    // 7. EM DESENVOLVIMENTO — fase inicial
    return {
      type: "EM_DESENVOLVIMENTO",
      label: "Em Desenvolvimento",
      description: "Fase inicial de formação. Supervisão direta e treinamento focado necessários.",
      color: "bg-red-500",
      icon: "📈",
    };
  }

  // --- Fallback: sem milestone scores ---
  if (overallScore >= 85 && entrustmentLevel >= 4) {
    return { type: "EXCELENTE", label: "Excelente",
      description: "Alto desempenho consistente. Pronto para autonomia.", color: "bg-blue-500", icon: "⭐" };
  }
  if (overallScore >= 70 && entrustmentLevel >= 3) {
    return { type: "INTEGRAL", label: "Adequado",
      description: "Desempenho adequado para o nível de treinamento.", color: "bg-emerald-500", icon: "✅" };
  }
  if (overallScore >= 50 && entrustmentLevel >= 2) {
    return { type: "EM_DESENVOLVIMENTO", label: "Em Desenvolvimento",
      description: "Progresso consistente. Continuar prática supervisionada.", color: "bg-yellow-500", icon: "📈" };
  }
  return { type: "EM_DESENVOLVIMENTO", label: "Necessita Melhoria",
    description: "Necessita reforço de treinamento e supervisão direta.", color: "bg-red-500", icon: "📈" };
}

// =============================================================================
// INTERPRETAÇÃO POR SCORE
// =============================================================================

export function getInterpretation(overallScore: number): {
  level: string;
  recommendation: string;
  nextSteps: string[];
} {
  if (overallScore >= 85) {
    return {
      level: "Apto para supervisão indireta",
      recommendation: "Residente demonstra competência para proceder com supervisão mínima.",
      nextSteps: [
        "Aumentar complexidade dos casos",
        "Permitir maior autonomia",
        "Documentar progresso para CCC",
      ],
    };
  }
  if (overallScore >= 70) {
    return {
      level: "Supervisão direta recomendada",
      recommendation: "Residente está progredindo adequadamente mas ainda necessita supervisão.",
      nextSteps: [
        "Continuar prática supervisionada",
        "Foco em pontos de melhoria identificados",
        "Reavaliação após 3-5 procedimentos",
      ],
    };
  }
  return {
    level: "Necessita reforço de treinamento",
    recommendation: "Residente necessita de treinamento adicional antes de prosseguir.",
    nextSteps: [
      "Supervisão direta constante",
      "Treinamento em simulador",
      "Revisão de vídeos educacionais",
      "Repetição de procedimentos básicos",
    ],
  };
}

// =============================================================================
// ENTRUSTMENT SCALE
// =============================================================================

export const ENTRUSTMENT_LEVELS = [
  { level: 1, label: "Apenas observação", description: "O residente apenas observa o procedimento" },
  { level: 2, label: "Executa partes sob supervisão direta", description: "Realiza etapas simples com supervisão constante" },
  { level: 3, label: "Executa procedimento completo sob supervisão direta", description: "Realiza o procedimento inteiro com supervisor presente" },
  { level: 4, label: "Executa com supervisão indireta", description: "Realiza o procedimento com supervisor disponível se necessário" },
  { level: 5, label: "Autônomo", description: "Pode realizar o procedimento de forma independente" },
] as const;

export const SCORE_LABELS: Record<number, string> = {
  1: "Inadequado / inseguro",
  2: "Abaixo do esperado",
  3: "Adequado para o nível",
  4: "Bom desempenho",
  5: "Excelente / nível de autonomia",
};

// =============================================================================
// INTERFACE EvaluationReport — inclui milestoneScores
// =============================================================================

export interface MilestoneScore {
  score: number;
  maxScore: number;
  percentage: number;
  label: string;
  description: string;
  status: "excelente" | "adequado" | "desenvolvimento" | "atencao";
}

export interface EvaluationReport {
  residente: {
    id: string;
    name: string;
  };
  procedimento: {
    code: string;
    name: string;
    area: string;
  };
  avaliacao: {
    data: string;
    avaliador: string;
    overallScore: number;
    entrustmentLevel: number;
    totalCriteria: number;
    evaluatedCriteria: number;
  };
  scoresByDomain: {
    domain: string;
    score: number;
    maxScore: number;
    percentage: number;
    items: {
      item: string;
      score: number;
    }[];
  }[];
  milestoneScores: {
    pc2: MilestoneScore;
    pc3: MilestoneScore;
    mk2: MilestoneScore;
    sbp1: MilestoneScore;
  };
  fenotipo: PhenotypeResult;
  interpretacao: {
    level: string;
    recommendation: string;
    nextSteps: string[];
  };
  feedback: {
    strengths: string;
    improvements: string;
    general: string;
  };
  pontosFortesIdentificados: string[];
  pontosMelhoriaIdentificados: string[];
}

// =============================================================================
// generateFriendlyReport
// =============================================================================

function buildMilestoneScore(
  score: number,
  maxScore: number,
  milestone: MilestoneCategory
): MilestoneScore {
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  let status: MilestoneScore["status"];
  if (percentage >= 80) status = "excelente";
  else if (percentage >= 60) status = "adequado";
  else if (percentage >= 40) status = "desenvolvimento";
  else status = "atencao";
  return {
    score,
    maxScore,
    percentage,
    label: MILESTONE_LABELS[milestone],
    description: MILESTONE_DESCRIPTIONS[milestone],
    status,
  };
}

export function generateFriendlyReport(
  evaluationData: any,
  criteria: any[],
  residenteName: string,
  avaliadorName: string,
  milestoneRaw?: {
    pc2: { score: number; maxScore: number };
    pc3: { score: number; maxScore: number };
    mk2: { score: number; maxScore: number };
    sbp1: { score: number; maxScore: number };
  }
): EvaluationReport {
  const criteriaByDomain: Record<string, any[]> = {};
  criteria.forEach((c) => {
    if (!criteriaByDomain[c.domain]) criteriaByDomain[c.domain] = [];
    criteriaByDomain[c.domain].push(c);
  });

  const scoresByDomain: EvaluationReport["scoresByDomain"] = [];
  Object.entries(criteriaByDomain).forEach(([domain, items]) => {
    const domainScores = items
      .map((item) => evaluationData.criteriaScores?.find((s: any) => s.criteriaId === item.id))
      .filter(Boolean);

    const score = domainScores.reduce((acc: number, s: any) => acc + s.score, 0);
    const maxScore = domainScores.length * 5;
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

    scoresByDomain.push({
      domain,
      score,
      maxScore,
      percentage,
      items: domainScores.map((s: any) => ({
        item: items.find((i: any) => i.id === s.criteriaId)?.item || "",
        score: s.score,
      })),
    });
  });

  const overallScore = calculateOverallScore(
    scoresByDomain.map((d) => ({ score: d.score, maxScore: d.maxScore }))
  );

  const raw = milestoneRaw ?? { pc2: { score: 0, maxScore: 0 }, pc3: { score: 0, maxScore: 0 }, mk2: { score: 0, maxScore: 0 }, sbp1: { score: 0, maxScore: 0 } };
  const milestoneScores = {
    pc2: buildMilestoneScore(raw.pc2.score, raw.pc2.maxScore, "PC2"),
    pc3: buildMilestoneScore(raw.pc3.score, raw.pc3.maxScore, "PC3"),
    mk2: buildMilestoneScore(raw.mk2.score, raw.mk2.maxScore, "MK2"),
    sbp1: buildMilestoneScore(raw.sbp1.score, raw.sbp1.maxScore, "SBP1"),
  };

  const domainPercentages = scoresByDomain.map((d) => d.percentage);
  const domainAverage = domainPercentages.length > 0
    ? domainPercentages.reduce((a, b) => a + b, 0) / domainPercentages.length : 0;
  const domainVariability = domainPercentages.length > 0
    ? Math.max(...domainPercentages) - Math.min(...domainPercentages) : 0;

  const fenotipo = determinePhenotype(overallScore, evaluationData.entrustmentLevel, {
    pc2Percentage: milestoneScores.pc2.percentage,
    pc3Percentage: milestoneScores.pc3.percentage,
    mk2Percentage: milestoneScores.mk2.percentage,
    sbp1Percentage: milestoneScores.sbp1.percentage,
    domainVariability,
    domainAverage,
  });

  const interpretacao = getInterpretation(overallScore);

  const pontosFortesIdentificados: string[] = [];
  const pontosMelhoriaIdentificados: string[] = [];
  scoresByDomain.forEach((domain) => {
    domain.items.forEach((item) => {
      if (item.score >= 4) pontosFortesIdentificados.push(`${domain.domain}: ${item.item}`);
      else if (item.score <= 2) pontosMelhoriaIdentificados.push(`${domain.domain}: ${item.item}`);
    });
  });

  return {
    residente: {
      id: evaluationData.residenteId || "",
      name: residenteName,
    },
    procedimento: {
      code: evaluationData.procedureCode || "",
      name: evaluationData.procedureName || "",
      area: evaluationData.area || "",
    },
    avaliacao: {
      data: evaluationData.createdAt || new Date().toISOString(),
      avaliador: avaliadorName,
      overallScore,
      entrustmentLevel: evaluationData.entrustmentLevel,
      totalCriteria: criteria.length,
      evaluatedCriteria: evaluationData.criteriaScores?.length || 0,
    },
    scoresByDomain,
    milestoneScores,
    fenotipo,
    interpretacao,
    feedback: {
      strengths: evaluationData.strengths || "",
      improvements: evaluationData.improvements || "",
      general: evaluationData.feedback || "",
    },
    pontosFortesIdentificados,
    pontosMelhoriaIdentificados,
  };
}

// Keep backward compat export
export const DEFAULT_CRITERIA_BY_PROCEDURE = DEFAULT_CRITERIA;
