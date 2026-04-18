// =============================================================================
// useClustering — Hook para cálculo de milestones e fenotipagem
// =============================================================================

import { useMemo } from "react";
import {
  type MilestoneCategory,
  type MilestoneScoresInput,
  type PhenotypeResult,
  type MilestoneScore,
  MILESTONE_LABELS,
  MILESTONE_DESCRIPTIONS,
  getMilestoneForCriterion,
  determinePhenotype,
  getInterpretation,
  calculateOverallScore,
} from "@shared/surgical";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CriteriaScore {
  criteriaId: string;
  item: string;
  domain: string;
  score: number;
  /** Milestone from the database (preferred) or looked up from DEFAULT_CRITERIA */
  milestone?: string | null;
}

export interface ClusteringInput {
  procedureCode: string;
  criteriaScores: CriteriaScore[];
  entrustmentLevel: number;
  strengths?: string;
  improvements?: string;
  feedback?: string;
  residenteName?: string;
  avaliadorName?: string;
  procedureName?: string;
  area?: string;
}

export interface MilestoneBreakdown {
  pc2: MilestoneScore;
  pc3: MilestoneScore;
  mk2: MilestoneScore;
  sbp1: MilestoneScore;
}

export interface ClusteringResult {
  overallScore: number;
  milestoneScores: MilestoneBreakdown;
  phenotype: PhenotypeResult;
  interpretation: ReturnType<typeof getInterpretation>;
  scoresByDomain: {
    domain: string;
    score: number;
    maxScore: number;
    percentage: number;
    items: { item: string; score: number; milestone?: MilestoneCategory }[];
  }[];
  strengths: string[];
  improvements: string[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

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

const VALID_MILESTONES: MilestoneCategory[] = ["PC2", "PC3", "MK2", "SBP1"];

function resolveMilestone(
  cs: CriteriaScore,
  procedureCode: string
): MilestoneCategory | undefined {
  // 1. Use milestone from database if available (preferred)
  if (cs.milestone && VALID_MILESTONES.includes(cs.milestone as MilestoneCategory)) {
    return cs.milestone as MilestoneCategory;
  }
  // 2. Fallback: lookup from DEFAULT_CRITERIA by exact text match
  const fromDefault = getMilestoneForCriterion(procedureCode, cs.item);
  if (fromDefault) return fromDefault;

  // 3. Item-text keyword heuristic (runs BEFORE domain heuristic)
  const il = cs.item.toLowerCase();
  // SBP1 keywords (highest priority for safety items)
  if (
    il.includes("timeout") || il.includes("segurança") || il.includes("checklist") ||
    il.includes("equipamento") || il.includes("hemostasia") || il.includes("verifica") ||
    il.includes("contagem") || il.includes("material de tela") || il.includes("documenta")
  ) return "SBP1";
  // Action verbs that indicate technical execution, NOT knowledge
  const isActionItem = il.startsWith("fecha") || il.startsWith("sutura") ||
    il.startsWith("recorta") || il.startsWith("realiza") || il.startsWith("controla") ||
    il.startsWith("disseca") || il.startsWith("reduz") || il.startsWith("fixa");
  // MK2 keywords (only if NOT an action item)
  if (!isActionItem && (
    il.includes("anatomia") || il.includes("anatômic") ||
    il.includes("identifica") || il.includes("anomalia") ||
    il.includes("conhecimento") || il.includes("reconhec") ||
    il.includes("nervos") || il.includes("estrutura") ||
    il.includes("espaço retropúbico") || il.includes("transobturatório")
  )) return "MK2";

  // 4. Domain-name heuristic
  const dl = cs.domain.toLowerCase();
  if (dl.includes("preparação") || dl.includes("planejamento") || dl.includes("decisão")) return "PC2";
  if (
    dl.includes("acesso") || dl.includes("exposição") || dl.includes("dissecção") ||
    dl.includes("execução") || dl.includes("habilidade") || dl.includes("técnica") ||
    dl.includes("reparo") || dl.includes("redução") || dl.includes("incisão")
  ) return "PC3";
  if (dl.includes("anatomia") || dl.includes("conhecimento") || dl.includes("identificação")) return "MK2";
  if (
    dl.includes("segurança") || dl.includes("finalização") ||
    dl.includes("verificação") || dl.includes("checklist")
  ) return "SBP1";

  // 5. PC2 item keywords
  if (il.includes("planeja") || il.includes("posicion") || il.includes("decisão") || il.includes("indica")) return "PC2";

  return "PC3"; // Default to technical skill
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useClustering(input: ClusteringInput | null): ClusteringResult | null {
  return useMemo(() => {
    if (!input || input.criteriaScores.length === 0) return null;

    const { procedureCode, criteriaScores, entrustmentLevel } = input;

    // Group scores by domain, resolving milestone for each criterion
    const domainMap: Record<string, { items: { item: string; score: number; milestone?: MilestoneCategory }[] }> = {};

    criteriaScores.forEach((cs) => {
      if (!domainMap[cs.domain]) {
        domainMap[cs.domain] = { items: [] };
      }
      const milestone = resolveMilestone(cs, procedureCode);
      domainMap[cs.domain].items.push({
        item: cs.item,
        score: cs.score,
        milestone,
      });
    });

    const scoresByDomain = Object.entries(domainMap).map(([domain, data]) => {
      const score = data.items.reduce((acc, i) => acc + i.score, 0);
      const maxScore = data.items.length * 5;
      return {
        domain,
        score,
        maxScore,
        percentage: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0,
        items: data.items,
      };
    });

    const overallScore = calculateOverallScore(
      scoresByDomain.map((d) => ({ score: d.score, maxScore: d.maxScore }))
    );

    // Calculate milestone scores
    const milestoneAccum: Record<MilestoneCategory, { score: number; maxScore: number }> = {
      PC2: { score: 0, maxScore: 0 },
      PC3: { score: 0, maxScore: 0 },
      MK2: { score: 0, maxScore: 0 },
      SBP1: { score: 0, maxScore: 0 },
    };

    criteriaScores.forEach((cs) => {
      const milestone = resolveMilestone(cs, procedureCode);
      if (milestone) {
        milestoneAccum[milestone].score += cs.score;
        milestoneAccum[milestone].maxScore += 5;
      }
    });

    const milestoneScores: MilestoneBreakdown = {
      pc2: buildMilestoneScore(milestoneAccum.PC2.score, milestoneAccum.PC2.maxScore, "PC2"),
      pc3: buildMilestoneScore(milestoneAccum.PC3.score, milestoneAccum.PC3.maxScore, "PC3"),
      mk2: buildMilestoneScore(milestoneAccum.MK2.score, milestoneAccum.MK2.maxScore, "MK2"),
      sbp1: buildMilestoneScore(milestoneAccum.SBP1.score, milestoneAccum.SBP1.maxScore, "SBP1"),
    };

    // Calculate domain variability for phenotyping
    const domainPercentages = scoresByDomain.map((d) => d.percentage);
    const domainAverage =
      domainPercentages.length > 0
        ? domainPercentages.reduce((a, b) => a + b, 0) / domainPercentages.length
        : 0;
    const domainVariability =
      domainPercentages.length > 0
        ? Math.max(...domainPercentages) - Math.min(...domainPercentages)
        : 0;

    const milestoneInput: MilestoneScoresInput = {
      pc2Percentage: milestoneScores.pc2.percentage,
      pc3Percentage: milestoneScores.pc3.percentage,
      mk2Percentage: milestoneScores.mk2.percentage,
      sbp1Percentage: milestoneScores.sbp1.percentage,
      domainVariability,
      domainAverage,
    };

    const phenotype = determinePhenotype(overallScore, entrustmentLevel, milestoneInput);
    const interpretation = getInterpretation(overallScore);

    // Identify strengths and improvements
    const strengths: string[] = [];
    const improvements: string[] = [];
    scoresByDomain.forEach((domain) => {
      domain.items.forEach((item) => {
        if (item.score >= 4) strengths.push(`${domain.domain}: ${item.item}`);
        else if (item.score <= 2) improvements.push(`${domain.domain}: ${item.item}`);
      });
    });

    return {
      overallScore,
      milestoneScores,
      phenotype,
      interpretation,
      scoresByDomain,
      strengths,
      improvements,
    };
  }, [input]);
}

export default useClustering;
