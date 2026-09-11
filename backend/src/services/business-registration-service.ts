import { prisma } from "../lib/prisma";
import { parseBusinessRegistration, type BusinessRegistrationFields } from "./business-registration-parser";
import { matchIndustries, type IndustryMatch } from "./industry-matcher";
import { verifyWithNts, type VerificationResult } from "./nts-verification";
import { OCR_ENGINE, recognizeImage } from "./ocr";

export type BusinessRegistrationAnalysis = {
  fields: BusinessRegistrationFields;
  suggestion: {
    businessType: BusinessRegistrationFields["businessType"];
    /** 추천 DB에 지점이 있는 지역이면 label, 없으면 null (fields.region은 그대로 유지) */
    region: string | null;
    industries: IndustryMatch[];
  };
  /** OCR로 만든 결과면 엔진 정보, 사용자가 수정한 값으로 다시 확인한 결과면 null */
  ocr: { engine: string; confidence: number; durationMs: number } | null;
  /** 국세청 진위확인·상태조회 결과 (NTS_API_KEY 없으면 checked=false) */
  verification: VerificationResult;
  warnings: string[];
};

/** OCR 텍스트를 받아 필드 추출 + 추천 조건 매칭 (OCR 없이도 테스트 가능하도록 분리) */
export async function analyzeRegistrationText(
  text: string,
  ocr: { confidence: number; durationMs: number },
): Promise<BusinessRegistrationAnalysis> {
  return analyzeRegistrationFields(parseBusinessRegistration(text), ocr);
}

/**
 * 이미 추출된(또는 사용자가 수정한) 필드로 국세청 확인 + 업종 매칭을 수행합니다.
 * OCR이 한 번에 정확하지 않을 수 있으므로, 사용자가 값을 고친 뒤 다시 확인하는 경로가 이 함수를 씁니다.
 */
export async function analyzeRegistrationFields(
  fields: BusinessRegistrationFields,
  ocr: { confidence: number; durationMs: number } | null,
): Promise<BusinessRegistrationAnalysis> {

  const industries = await prisma.industry.findMany({
    select: { id: true, name: true, keywords: true, registrationStatus: true },
  });
  const industryMatches = matchIndustries([...fields.businessItems, ...fields.businessCategories], industries);

  // 형식 검증을 통과한 번호만 국세청에 조회 (오독된 번호로 불필요한 호출 방지)
  const verification: VerificationResult = fields.businessNumberValid
    ? await verifyWithNts({
        businessNumber: fields.businessNumber,
        openedAt: fields.openedAt,
        representative: fields.representative,
        companyName: fields.companyName,
      })
    : { checked: false, skippedReason: "NO_BUSINESS_NUMBER", summary: "사업자등록번호 형식 검증을 통과하지 못해 국세청 확인을 건너뛰었어요." };

  const regionExists = fields.region
    ? (await prisma.office.count({ where: { region: fields.region } })) > 0
    : false;

  const warnings: string[] = [];
  if (!fields.businessNumber) warnings.push("사업자등록번호를 찾지 못했어요. 등록증 전체가 선명하게 나오도록 다시 촬영해 보세요.");
  else if (fields.businessNumberValid === false) warnings.push("사업자등록번호 검증에 실패했어요. 숫자가 잘못 읽혔을 수 있으니 확인해 주세요.");
  if (!fields.businessType) warnings.push("개인/법인 여부를 확인하지 못했어요. 직접 선택해 주세요.");
  if (!fields.region) warnings.push("사업장 주소에서 지역을 찾지 못했어요. 직접 선택해 주세요.");
  else if (!regionExists) warnings.push(`'${fields.region}' 지역에는 아직 지점이 없어요. 다른 지역이나 전체로 검색해 보세요.`);
  if (industryMatches.length === 0) warnings.push("업태/종목에 맞는 업종을 찾지 못했어요. 업종을 직접 검색해 주세요.");
  if (verification.checked && verification.identity && !verification.identity.matched) {
    warnings.push("국세청 기록과 등록증 정보가 일치하지 않아요. 번호·개업일·대표자명이 잘못 읽혔거나 등록증이 최신이 아닐 수 있어요.");
  }
  if (verification.businessStatus && verification.businessStatus.code !== "01" && verification.businessStatus.code !== "") {
    warnings.push(`국세청 기준 ${verification.businessStatus.label}예요. 사업자 상태를 확인해 주세요.`);
  }
  if (ocr && ocr.confidence < 70) warnings.push("이미지 인식 신뢰도가 낮아요. 결과를 꼭 확인해 주세요.");

  return {
    fields,
    suggestion: {
      businessType: fields.businessType,
      region: regionExists ? fields.region : null,
      industries: industryMatches,
    },
    ocr: ocr ? { engine: OCR_ENGINE, ...ocr } : null,
    verification,
    warnings,
  };
}

export async function analyzeRegistrationImage(image: Buffer): Promise<BusinessRegistrationAnalysis> {
  const result = await recognizeImage(image);
  // OCR 원문은 파싱에만 쓰고 응답·로그에 포함하지 않습니다.
  return analyzeRegistrationText(result.text, { confidence: result.confidence, durationMs: result.durationMs });
}
