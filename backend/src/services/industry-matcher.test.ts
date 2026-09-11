import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { matchIndustries, similarity, type MatchableIndustry } from "./industry-matcher";

const INDUSTRIES: MatchableIndustry[] = [
  { id: "retail", name: "소매업", keywords: ["온라인 쇼핑몰", "전자상거래", "SNS마켓", "해외직구 대행"], registrationStatus: "AVAILABLE" },
  { id: "wholesale", name: "도매 및 상품 중개업", keywords: ["수입", "무역", "식품 도매"], registrationStatus: "AVAILABLE" },
  { id: "software", name: "컴퓨터 프로그래밍, 시스템 통합 및 관리업", keywords: ["개발", "웹 개발", "앱 개발", "소프트웨어"], registrationStatus: "AVAILABLE" },
  { id: "other-professional", name: "기타 전문, 과학 및 기술 서비스업", keywords: ["디자인", "번역", "사진"], registrationStatus: "AVAILABLE" },
  { id: "cosmetics", name: "화학물질·화학제품 제조업", keywords: ["화장품", "비누"], registrationStatus: "OEM_REQUIRED" },
];

describe("similarity", () => {
  it("같은 문자열 1, 무관한 문자열 0에 가까움", () => {
    assert.equal(similarity("소매업", "소매업"), 1);
    assert.ok(similarity("전자상거래 소매업", "전자상거래소매업") > 0.9);
    assert.ok(similarity("소매업", "건설업") < 0.4);
  });
});

describe("matchIndustries", () => {
  it("전자상거래 소매업 + 통신판매업 → 소매업 1순위", () => {
    const m = matchIndustries(["전자상거래 소매업", "통신판매업", "도매 및 소매업"], INDUSTRIES);
    assert.equal(m[0].id, "retail");
    assert.ok(m[0].matchedTerms.includes("전자상거래"));
  });
  it("응용 소프트웨어 개발 → 소프트웨어 업종", () => {
    assert.equal(matchIndustries(["응용 소프트웨어 개발 및 공급업", "정보통신업"], INDUSTRIES)[0].id, "software");
  });
  it("시각 디자인업 → 기타 전문 서비스업, OEM 업종도 매칭", () => {
    assert.equal(matchIndustries(["시각 디자인업"], INDUSTRIES)[0].id, "other-professional");
    assert.equal(matchIndustries(["화장품 제조업"], INDUSTRIES)[0].registrationStatus, "OEM_REQUIRED");
  });
  it("OCR 오타(전자상거레)도 유사도로 흡수", () => {
    assert.equal(matchIndustries(["전자상거레 소매업"], INDUSTRIES)[0].id, "retail");
  });
  it("매칭 없음 → 빈 배열, 2글자 미만은 무시", () => {
    assert.deepEqual(matchIndustries(["ㅋ", "완전히 무관한 텍스트"], INDUSTRIES), []);
  });
});
