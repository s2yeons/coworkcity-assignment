/**
 * 사업자등록증 OCR 텍스트 → 구조화된 필드 (순수 함수, DB/OCR 의존 없음).
 *
 * 사업자등록증의 표준 서식(등록번호 / 상호 / 대표자 / 개업연월일 / 사업장 소재지 / 사업의 종류 업태·종목)을 기준으로
 * 라벨을 찾아 값을 뽑습니다. OCR 특성상 라벨 글자 사이에 공백이 끼거나(예: "등 록 번 호"),
 * 숫자가 O/I/l 로 읽히는 경우를 허용합니다.
 */

export type BusinessRegistrationFields = {
  /** 000-00-00000 형식으로 정규화된 사업자등록번호 */
  businessNumber: string | null;
  /** 사업자등록번호 검증 자리(10번째) 검사 통과 여부 */
  businessNumberValid: boolean | null;
  /** 개인/법인. 등록증 제목의 "(일반과세자)/(간이과세자)/(면세사업자)" 또는 "(법인사업자)"·법인등록번호 유무로 판단 */
  businessType: "INDIVIDUAL" | "CORPORATE" | null;
  companyName: string | null;
  representative: string | null;
  openedAt: string | null;
  address: string | null;
  /** 주소에서 추출한 지역 라벨 (예: 서울, 경기). 추천 DB의 지역 체계에 맞춤 */
  region: string | null;
  /** 업태 목록 */
  businessCategories: string[];
  /** 종목 목록 */
  businessItems: string[];
};

/** OCR이 숫자를 문자로 읽은 경우 보정 */
function fixDigits(s: string): string {
  return s.replace(/[Oo]/g, "0").replace(/[Il|]/g, "1").replace(/[^0-9]/g, "");
}

/** 사업자등록번호 검증 자리 검사 (국세청 체크섬) */
export function isValidBusinessNumber(digits: string): boolean {
  if (!/^\d{10}$/.test(digits)) return false;
  const d = digits.split("").map(Number);
  const w = [1, 3, 7, 1, 3, 7, 1, 3, 5];
  const sum = w.reduce((acc, weight, i) => acc + d[i] * weight, 0) + Math.floor((d[8] * 5) / 10);
  return (10 - (sum % 10)) % 10 === d[9];
}

export function formatBusinessNumber(digits: string): string {
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

/** 라벨은 글자 사이 공백을 허용하는 정규식으로 변환: "등록번호" → /등\s*록\s*번\s*호/ */
function label(text: string): string {
  return text
    .split("")
    .map((ch) => (ch === " " ? "" : `${ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*`))
    .join("");
}

/** 라벨 뒤 구분자. 줄바꿈은 삼키지 않아 다음 줄의 라벨이 값으로 붙지 않게 합니다. */
const SEP = "[:：]?[ \\t]*";

/** 다음 라벨이 나오기 전까지의 값. 줄바꿈은 공백으로 */
function captureAfter(text: string, labelText: string, stopLabels: string[]): string | null {
  const stop = stopLabels.map(label).join("|");
  const re = new RegExp(`${label(labelText)}${SEP}([\\s\\S]*?)(?=\\n\\s*(?:${stop})|$)`);
  const m = text.match(re);
  if (!m) return null;
  const value = m[1].replace(/\s+/g, " ").trim();
  return value || null;
}

const REGION_RULES: Array<[RegExp, string]> = [
  [/^서울/, "서울"],
  [/^경기/, "경기"],
  [/^인천/, "인천"],
  [/^부산/, "부산"],
  [/^대구/, "대구"],
  [/^광주/, "광주"],
  [/^대전/, "대전"],
  [/^울산/, "울산"],
  [/^세종/, "세종"],
  [/^제주/, "제주"],
  [/^(강원)/, "강원"],
  [/^(충북|충청북도)/, "충북"],
  [/^(충남|충청남도)/, "충남"],
  [/^(전북|전라북도)/, "전북"],
  [/^(전남|전라남도)/, "전남"],
  [/^(경북|경상북도)/, "경북"],
  [/^(경남|경상남도)/, "경남"],
];

export function regionFromAddress(address: string | null): string | null {
  if (!address) return null;
  const head = address.replace(/\s+/g, "").slice(0, 6);
  for (const [re, region] of REGION_RULES) if (re.test(head)) return region;
  return null;
}

const LABELS = [
  "상호",
  "법인명(단체명)",
  "법인명",
  "성명",
  "대표자",
  "법인등록번호",
  "개업연월일",
  "사업장소재지",
  "본점소재지",
  "사업의종류",
  "업태",
  "종목",
  "발급사유",
  "공동사업자",
  "사업자단위과세",
  "전자세금계산서",
];

/** 표준산업분류 대분류(사업자등록증 업태에 쓰이는 명칭). 긴 것부터 매칭합니다. */
const KNOWN_CATEGORIES = [
  "사업시설 관리, 사업 지원 및 임대 서비스업",
  "협회 및 단체, 수리 및 기타 개인 서비스업",
  "예술, 스포츠 및 여가관련 서비스업",
  "전문, 과학 및 기술 서비스업",
  "수도, 하수 및 폐기물 처리, 원료 재생업",
  "공공 행정, 국방 및 사회보장 행정",
  "보건업 및 사회복지 서비스업",
  "농업, 임업 및 어업",
  "숙박 및 음식점업",
  "운수 및 창고업",
  "금융 및 보험업",
  "도매 및 소매업",
  "교육 서비스업",
  "정보통신업",
  "부동산업",
  "제조업",
  "건설업",
  "서비스업",
  "소매업",
  "도매업",
  "임대업",
  "광업",
];

/** "업태값 종목값"이 한 칸 공백으로 붙어 있어도 알려진 업태명으로 분리 */
function splitCategoryAndItem(line: string): [string, string] | null {
  const twoCols = line.trim().split(/\s{2,}|\t/);
  if (twoCols.length >= 2) return [twoCols[0].trim(), twoCols.slice(1).join(" ").trim()];
  const compactLine = line.replace(/\s+/g, "");
  for (const category of KNOWN_CATEGORIES) {
    const compactCategory = category.replace(/\s+/g, "");
    if (compactLine.startsWith(compactCategory) && compactLine.length > compactCategory.length) {
      // 원문에서 업태 길이만큼(공백 포함) 잘라 종목을 남김
      let consumed = 0;
      let i = 0;
      while (i < line.length && consumed < compactCategory.length) {
        if (!/\s/.test(line[i])) consumed += 1;
        i += 1;
      }
      return [line.slice(0, i).trim(), line.slice(i).trim()];
    }
  }
  return null;
}

/** "업태 A 종목 B" 형태(한 줄 또는 표)를 모두 찾아 업태/종목 목록으로 */
function extractBusinessKinds(text: string): { categories: string[]; items: string[] } {
  const categories: string[] = [];
  const items: string[] = [];

  // 1) "업태 : X   종목 : Y" 가 같은 줄에 있는 경우 (여러 줄 반복 가능)
  const inline = new RegExp(`${label("업태")}${SEP}(.+?)\\s+${label("종목")}${SEP}(.+)`, "g");
  for (const m of text.matchAll(inline)) {
    const category = m[1].trim();
    const item = m[2].trim();
    // "업태        종목" 표 헤더는 값이 아니므로 건너뜀
    if (!category || !item) continue;
    categories.push(category);
    items.push(item);
  }
  if (categories.length > 0) return { categories, items };

  // 2) 표 형태: "업태 종목" 헤더 다음 줄들에 "업태값  종목값" 이 두 칸 이상 공백으로 구분
  const header = new RegExp(`${label("업태")}\\s+${label("종목")}\\s*\\n([\\s\\S]*?)(?=\\n\\s*(?:${["발급사유", "공동사업자", "사업자단위과세"].map(label).join("|")})|$)`);
  const block = text.match(header);
  if (block) {
    for (const line of block[1].split("\n")) {
      if (!line.trim()) continue;
      const split = splitCategoryAndItem(line);
      if (split) {
        categories.push(split[0]);
        items.push(split[1]);
      } else {
        items.push(line.trim());
      }
    }
  }
  return { categories, items };
}

export function parseBusinessRegistration(rawText: string): BusinessRegistrationFields {
  const text = rawText.replace(/\r/g, "").replace(/[ \t]+\n/g, "\n");
  const compact = text.replace(/\s+/g, "");

  // 사업자등록번호: "등록번호" 라벨 뒤 10자리 (구분자/공백/오인식 허용)
  let businessNumber: string | null = null;
  let businessNumberValid: boolean | null = null;
  const numberMatch =
    text.match(new RegExp(`${label("등록번호")}${SEP}([0-9OoIl|\\s-]{10,20})`)) ??
    text.match(/\b(\d{3}\s*-\s*\d{2}\s*-\s*\d{5})\b/);
  if (numberMatch) {
    const digits = fixDigits(numberMatch[1]).slice(0, 10);
    if (digits.length === 10) {
      businessNumber = formatBusinessNumber(digits);
      businessNumberValid = isValidBusinessNumber(digits);
    }
  }

  // 사업자 유형
  let businessType: BusinessRegistrationFields["businessType"] = null;
  if (/법인사업자|법인등록번호/.test(compact)) businessType = "CORPORATE";
  else if (/일반과세자|간이과세자|면세사업자|개인사업자/.test(compact)) businessType = "INDIVIDUAL";

  // 실제 서식: 개인사업자는 "상 호 / 성 명", 법인사업자는 "법인명(단체명) / 대 표 자"
  const companyName =
    captureAfter(text, "법인명(단체명)", LABELS) ??
    captureAfter(text, "법인명", LABELS) ??
    captureAfter(text, "상호", LABELS) ??
    // 서식의 "상       호"처럼 글자 간격이 넓으면 OCR이 "호"를 놓쳐 "상 :"만 남기는 경우가 있음
    text.match(/^\s*상\s*[:：]\s*(\S.*)$/m)?.[1]?.trim() ??
    null;
  const representative = captureAfter(text, "대표자", LABELS) ?? captureAfter(text, "성명", LABELS);
  const openedRaw = captureAfter(text, "개업연월일", LABELS);
  const openedMatch = openedRaw?.match(/(\d{4})\s*년?\s*(\d{1,2})\s*월?\s*(\d{1,2})/);
  const openedAt = openedMatch
    ? `${openedMatch[1]}-${openedMatch[2].padStart(2, "0")}-${openedMatch[3].padStart(2, "0")}`
    : null;
  const address =
    captureAfter(text, "사업장소재지", LABELS) ??
    text
      .split("\n")
      .map((line) => line.trim())
      .find((line) => /^(서울|경기|인천|부산|대구|광주|대전|울산|세종|제주|강원|충청|충북|충남|전라|전북|전남|경상|경북|경남)/.test(line) && line.length > 8) ??
    null;
  const kinds = extractBusinessKinds(text);

  return {
    businessNumber,
    businessNumberValid,
    businessType,
    companyName,
    representative,
    openedAt,
    address,
    region: regionFromAddress(address),
    businessCategories: kinds.categories,
    businessItems: kinds.items,
  };
}

/** 사용자가 입력한 값들을 정규화해 필드 객체로 만듭니다 (수정 후 재확인용). */
export function normalizeRegistrationFields(input: {
  businessNumber?: string | null;
  businessType?: BusinessRegistrationFields["businessType"];
  companyName?: string | null;
  representative?: string | null;
  openedAt?: string | null;
  address?: string | null;
  businessCategories?: string[];
  businessItems?: string[];
}): BusinessRegistrationFields {
  const digits = fixDigits(input.businessNumber ?? "");
  const businessNumber = digits.length === 10 ? formatBusinessNumber(digits) : null;
  const clean = (v?: string | null) => {
    const t = v?.trim();
    return t ? t : null;
  };
  const address = clean(input.address);
  return {
    businessNumber,
    businessNumberValid: businessNumber ? isValidBusinessNumber(digits) : null,
    businessType: input.businessType ?? null,
    companyName: clean(input.companyName),
    representative: clean(input.representative),
    openedAt: input.openedAt && /^\d{4}-\d{2}-\d{2}$/.test(input.openedAt) ? input.openedAt : null,
    address,
    region: regionFromAddress(address),
    businessCategories: (input.businessCategories ?? []).map((c) => c.trim()).filter(Boolean),
    businessItems: (input.businessItems ?? []).map((c) => c.trim()).filter(Boolean),
  };
}
