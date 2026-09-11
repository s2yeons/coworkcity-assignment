/**
 * 사업자등록증의 업태/종목 텍스트를 추천 DB의 업종(Industry)에 매칭합니다.
 * 규칙 기반이라 설명 가능하고, OCR 오타는 바이그램 유사도로 흡수합니다.
 */
import type { IndustryRegistrationStatus } from "../generated/prisma/client";

export type MatchableIndustry = {
  id: string;
  name: string;
  keywords: string[];
  registrationStatus: IndustryRegistrationStatus;
};

export type IndustryMatch = {
  id: string;
  name: string;
  registrationStatus: IndustryRegistrationStatus;
  score: number;
  /** 어떤 단어가 맞아서 추천됐는지 (설명용) */
  matchedTerms: string[];
};

const normalize = (s: string) => s.toLowerCase().replace(/[\s,.·()/\-]/g, "");

function bigrams(s: string): Set<string> {
  const set = new Set<string>();
  for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
  return set;
}

/** Dice 계수 (0~1). 두 글자 이상일 때만 의미 있음 */
export function similarity(a: string, b: string): number {
  const x = bigrams(normalize(a));
  const y = bigrams(normalize(b));
  if (x.size === 0 || y.size === 0) return 0;
  let common = 0;
  for (const g of x) if (y.has(g)) common += 1;
  return (2 * common) / (x.size + y.size);
}

/**
 * 점수 규칙 (높을수록 우선)
 * - 종목/업태가 업종명과 사실상 같음 (유사도 ≥ 0.8)         +5
 * - 업종 키워드가 종목/업태 텍스트에 포함되거나 그 반대          +3 (키워드당, 최대 3개)
 * - 업종명 토큰(2글자 이상)이 텍스트에 포함                     +1 (토큰당)
 * - 종목과 키워드의 유사도 ≥ 0.6 (OCR 오타 보정)               +1
 */
export function matchIndustries(
  terms: string[],
  industries: MatchableIndustry[],
  limit = 3,
): IndustryMatch[] {
  const cleanTerms = terms.map((t) => t.trim()).filter((t) => t.length >= 2);
  if (cleanTerms.length === 0) return [];
  const haystack = normalize(cleanTerms.join(" "));

  const scored = industries.map((industry) => {
    let score = 0;
    const matched = new Set<string>();

    for (const term of cleanTerms) {
      if (similarity(term, industry.name) >= 0.8) {
        score += 5;
        matched.add(term);
      }
    }

    let keywordHits = 0;
    for (const keyword of industry.keywords) {
      const k = normalize(keyword);
      if (k.length < 2) continue;
      const hit =
        haystack.includes(k) ||
        cleanTerms.some((term) => {
          const t = normalize(term);
          return (t.length >= 3 && k.includes(t)) || similarity(term, keyword) >= 0.6;
        });
      if (hit && keywordHits < 3) {
        keywordHits += 1;
        score += 3;
        matched.add(keyword);
      }
    }

    for (const token of industry.name.split(/[^가-힣a-zA-Z0-9]+/)) {
      const t = normalize(token);
      if (t.length >= 2 && haystack.includes(t)) {
        score += 1;
        matched.add(token);
      }
    }

    return { id: industry.id, name: industry.name, registrationStatus: industry.registrationStatus, score, matchedTerms: [...matched] };
  });

  return scored
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, "ko"))
    .slice(0, limit);
}
