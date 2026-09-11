import type { Industry } from "./types";

/**
 * Mock 업종 데이터.
 * 업종 명칭, 대분류, 등록 상태, 참고사항은 코워크시티 업종 안내 페이지
 * (https://www.coworkcity.co.kr/industries)에서 확인된 내용만 반영했습니다.
 * 전체 업종 중 서로 다른 등록 상태를 테스트할 수 있도록 대표 업종을 추렸습니다.
 */
export const INDUSTRIES: Industry[] = [
  // 도매 및 소매업
  {
    id: "retail",
    name: "소매업",
    category: "도매 및 소매업",
    keywords: ["온라인 쇼핑몰", "전자상거래", "스마트스토어", "SNS마켓", "라이브커머스", "해외직구 대행", "인터넷 판매"],
    description: "온라인 쇼핑몰, SNS마켓·라이브커머스, 해외직구 대행",
    registrationStatus: "available",
    note: "실제 매장 없이 온라인 판매하는 경우가 가장 많은 대표 업종입니다. 통신판매업 병행 등록을 권장합니다.",
  },
  {
    id: "wholesale",
    name: "도매 및 상품 중개업",
    category: "도매 및 소매업",
    keywords: ["수입", "무역", "무역 중개", "식품 도매", "의류 도매", "화장품 도매", "원자재"],
    description: "수입·무역 중개, 식품·의류·화장품 도매, 기계·장비·원자재",
    registrationStatus: "available",
    note: "실물 재고를 직접 보유하지 않는 상품 중개는 성공 사례가 많습니다.",
  },
  {
    id: "auto-parts",
    name: "자동차 및 부품 판매업",
    category: "도매 및 소매업",
    keywords: ["타이어", "카오디오", "블랙박스", "오토바이 부품", "자동차 용품"],
    description: "타이어·튜브 온라인 판매, 카오디오·블랙박스, 오토바이 부품",
    registrationStatus: "available",
  },

  // 정보통신업
  {
    id: "software",
    name: "컴퓨터 프로그래밍, 시스템 통합 및 관리업",
    category: "정보통신업",
    keywords: ["개발", "웹 개발", "앱 개발", "SI", "외주 개발", "IT 보안", "소프트웨어", "스타트업"],
    description: "SI·시스템 구축, 웹·앱 외주 개발, IT 보안",
    registrationStatus: "available",
    note: "장소 구애 없는 개발 업무로 외주 개발사까지 활발히 이용합니다.",
  },
  {
    id: "publishing",
    name: "출판업",
    category: "정보통신업",
    keywords: ["앱 출시", "게임 개발", "전자책", "서적", "잡지", "만화", "온라인 교육 콘텐츠"],
    description: "소프트웨어·앱·게임 개발, 서적·전자책, 잡지·만화",
    registrationStatus: "available",
  },
  {
    id: "info-service",
    name: "정보서비스업",
    category: "정보통신업",
    keywords: ["포털", "데이터 분석", "데이터 처리", "호스팅", "플랫폼"],
    description: "포털·인터넷 정보, 데이터 처리·분석, 호스팅",
    registrationStatus: "available",
  },
  {
    id: "video-production",
    name: "영상·오디오 기록물 제작 및 배급업",
    category: "정보통신업",
    keywords: ["유튜브", "영상 제작", "광고 영상", "홍보 영상", "음반", "OTT 콘텐츠", "편집"],
    description: "유튜브·OTT 콘텐츠, 광고·홍보 영상, 음반 기획",
    registrationStatus: "available",
    note: "기획과 편집 중심의 창작 활동은 별도 스튜디오 없어도 등록 가능합니다.",
  },
  {
    id: "telecom",
    name: "우편 및 통신업",
    category: "정보통신업",
    keywords: ["통신 재판매", "전기 통신", "알뜰폰"],
    description: "통신 재판매업, 기타 전기 통신업",
    registrationStatus: "unavailable",
    note: "대규모 물리적 장비가 필수인 경우 비상주 등록이 제한됩니다.",
  },

  // 전문, 과학 및 기술 서비스업
  {
    id: "professional",
    name: "전문 서비스업",
    category: "전문, 과학 및 기술 서비스업",
    keywords: ["컨설팅", "경영 컨설팅", "광고 대행", "마케팅 대행", "세무사", "회계사", "변호사", "시장조사", "PR"],
    description: "경영 컨설팅·광고 대행, 변호사·세무사·회계사, 시장조사·PR",
    registrationStatus: "available",
    note: "지식 기반의 사무 서비스는 등록 성공률이 높은 업종입니다.",
  },
  {
    id: "other-professional",
    name: "기타 전문, 과학 및 기술 서비스업",
    category: "전문, 과학 및 기술 서비스업",
    keywords: ["디자인", "시각 디자인", "제품 디자인", "패션 디자인", "번역", "통역", "사진", "기술 중개"],
    description: "디자인(시각·제품·패션), 번역·통역·사진, 기술 중개",
    registrationStatus: "available",
  },
  {
    id: "rnd",
    name: "연구개발업",
    category: "전문, 과학 및 기술 서비스업",
    keywords: ["연구", "R&D", "공학 연구", "경영학 연구", "인문 사회 연구"],
    description: "전기·전자·공학 연구, 경제·경영학 연구, 인문·사회과학 연구",
    registrationStatus: "available",
  },

  // 사업시설 관리, 사업 지원 및 임대 서비스업
  {
    id: "business-support",
    name: "사업 지원 서비스업",
    category: "사업시설 관리, 사업 지원 및 임대 서비스업",
    keywords: ["온라인 마케팅", "행사 대행", "여행 예약", "인력 공급", "사무 대행", "이벤트"],
    description: "온라인 마케팅·행사 대행, 여행 예약·탐정, 인력 공급·사무 대행",
    registrationStatus: "available",
  },
  {
    id: "rental",
    name: "임대업",
    category: "사업시설 관리, 사업 지원 및 임대 서비스업",
    keywords: ["렌탈", "구독", "특허 임대", "저작권", "상표", "사무기기 렌탈"],
    description: "특허·저작권·상표 임대, 컴퓨터·사무기기 렌탈, 의류 구독형 렌탈",
    registrationStatus: "available",
  },

  // 협회 및 단체, 수리 및 기타 개인 서비스업
  {
    id: "freelancer",
    name: "인적용역",
    category: "협회 및 단체, 수리 및 기타 개인 서비스업",
    keywords: ["프리랜서", "프리랜서 개발자", "프리랜서 디자이너", "유튜버", "크리에이터", "보험설계사", "1인"],
    description: "프리랜서 개발자·디자이너, 유튜버·크리에이터, 보험설계사",
    registrationStatus: "available",
    note: "개인의 지식이나 기술을 제공하는 프리랜서가 비상주 기반 사업에 가장 적합합니다.",
  },
  {
    id: "association",
    name: "협회 및 단체",
    category: "협회 및 단체, 수리 및 기타 개인 서비스업",
    keywords: ["협회", "단체", "비영리", "사단법인", "재단법인", "학술 단체", "동호회", "종교"],
    description: "산업·전문가 협회, 시민·환경 단체, 종교 단체",
    registrationStatus: "available",
  },
  {
    id: "repair",
    name: "개인 및 소비용품 수리업",
    category: "협회 및 단체, 수리 및 기타 개인 서비스업",
    keywords: ["수리", "컴퓨터 수리", "가전 수리", "스마트폰 수리", "출장 수리"],
    description: "컴퓨터·통신장비 수리, 가전제품 출장 수리, 스마트폰 출장 수리",
    registrationStatus: "permit_required",
    note: "실제 작업장 필요 여부에 따라 등록 가능 여부가 결정됩니다.",
  },

  // 기타 서비스업
  {
    id: "real-estate",
    name: "부동산업",
    category: "부동산업",
    keywords: ["부동산", "시행", "분양 대행", "부동산 투자 자문", "개발"],
    description: "건물 개발·시행·분양 대행, 부동산 투자 자문",
    registrationStatus: "available",
  },
  {
    id: "finance-service",
    name: "금융 및 보험관련 서비스업",
    category: "금융 및 보험업",
    keywords: ["보험 대리", "보험 중개", "손해사정", "핀테크", "금융 컨설팅", "투자 자문"],
    description: "보험 대리·중개·손해사정, 금융 컨설팅·핀테크, 투자 자문",
    registrationStatus: "available",
  },
  {
    id: "finance",
    name: "금융업",
    category: "금융 및 보험업",
    keywords: ["은행", "저축은행", "신용조합", "신용카드", "할부금융", "대부"],
    description: "은행·저축은행·신용조합, 신용카드·할부금융",
    registrationStatus: "permit_required",
    note: "전산 설비와 보안 시스템을 갖춘 영업장이 필수여서 직접 금융업은 원천적으로 제한됩니다.",
  },
  {
    id: "insurance",
    name: "보험업",
    category: "금융 및 보험업",
    keywords: ["생명보험", "손해보험", "재보험", "보증보험", "공제"],
    description: "생명·손해보험, 재보험·보증보험, 개인·사업 공제업",
    registrationStatus: "unavailable",
    note: "금융위원회 허가가 필수인 업종으로 비상주 등록이 제한됩니다.",
  },
  {
    id: "logistics-service",
    name: "창고 및 운송관련 서비스업",
    category: "운수 및 창고업",
    keywords: ["화물 운송 중개", "포워딩", "통관 대리", "선박관리", "물류 중개"],
    description: "화물 운송 중개·대리, 통관 대리, 선박관리, 항공 운송 관리",
    registrationStatus: "available",
  },
  {
    id: "land-transport",
    name: "육상 운송 및 파이프라인 운송업",
    category: "운수 및 창고업",
    keywords: ["택배", "화물자동차", "버스", "택시", "운송"],
    description: "화물자동차·택배업, 버스·택시 운송, 철도·파이프라인 운송",
    registrationStatus: "unavailable",
  },
  {
    id: "arts",
    name: "창작, 예술 및 여가관련 서비스업",
    category: "예술, 스포츠 및 여가관련 서비스업",
    keywords: ["공연 기획", "예술 단체", "음악", "무용", "연극", "작가", "창작"],
    description: "공연 기획·예술 단체, 음악·무용·연극 단체",
    registrationStatus: "available",
    note: "1인 창작자, 공연 기획은 물리적 시설 없이 등록 가능합니다.",
  },

  // 교육 / 건설
  {
    id: "education",
    name: "교육 서비스업",
    category: "교육 서비스업",
    keywords: ["온라인 교육", "이러닝", "인강", "교육 컨설팅", "입시 상담", "진로 상담", "과외"],
    description: "온라인 교육·이러닝, 교육 컨설팅·자문, 입시·진로 상담",
    registrationStatus: "permit_required",
    note: "온라인 강의나 교육 컨설팅은 등록 가능하지만, 오프라인 학원·교습소는 시설 요건이 필요해 신청할 수 없습니다.",
  },
  {
    id: "construction-general",
    name: "종합 건설업",
    category: "건설업",
    keywords: ["건설", "건물 건설", "토목", "조경 건설", "종합공사"],
    description: "건물·토목·조경 건설",
    registrationStatus: "permit_required",
    note: "건설산업기본법 면허 보유 시 등록 가능하나 현장 실사가 예상됩니다.",
  },
  {
    id: "construction-specialty",
    name: "전문직별 공사업",
    category: "건설업",
    keywords: ["인테리어", "실내건축", "전기 공사", "소방 공사", "배관", "설비"],
    description: "인테리어·실내건축, 전기·소방, 배관·설비",
    registrationStatus: "permit_required",
    note: "전문공사업 면허 또는 개별 법령 등록이 필수입니다.",
  },

  // 제조업 (OEM)
  {
    id: "cosmetics-manufacturing",
    name: "화학물질·화학제품 제조업",
    category: "제조업",
    keywords: ["화장품", "화장품 브랜드", "치약", "비누", "세제", "플라스틱"],
    description: "화장품, 치약·비누·세제, 합성수지·플라스틱",
    registrationStatus: "oem_required",
    note: "위탁 제조 계약서가 필요하며, 브랜드 런칭 시 화장품 책임판매업 등록도 필수입니다.",
  },
  {
    id: "food-manufacturing",
    name: "식료품 제조업",
    category: "제조업",
    keywords: ["건강기능식품", "과자", "코코아", "커피", "식품 브랜드"],
    description: "건강 기능식품, 과자류·코코아, 커피 가공",
    registrationStatus: "oem_required",
    note: "위탁 제조 계약서가 반드시 필요합니다.",
  },
  {
    id: "apparel-manufacturing",
    name: "의복·의복 액세서리 제조업",
    category: "제조업",
    keywords: ["의류 브랜드", "패션 브랜드", "한복", "모자", "겉옷"],
    description: "남·여자용 겉옷, 한복, 모자 제조",
    registrationStatus: "oem_required",
    note: "위탁 제조 계약서가 반드시 필요합니다.",
  },
  {
    id: "waste",
    name: "폐기물 수집, 운반, 처리 및 원료 재생업",
    category: "수도, 하수 및 폐기물 처리, 원료 재생업",
    keywords: ["폐기물", "재활용", "원료 재생", "건설 폐기물"],
    description: "폐기물 수집·운반, 금속·비금속 원료 재생, 건설 폐기물 처리",
    registrationStatus: "unavailable",
  },
];

export function findIndustry(id: string | null | undefined): Industry | undefined {
  if (!id) return undefined;
  return INDUSTRIES.find((industry) => industry.id === id);
}

/** 검색어를 업종명, 대분류, 키워드, 설명과 비교해 매칭되는 업종을 반환합니다. */
export function searchIndustries(query: string, industries: Industry[] = INDUSTRIES): Industry[] {
  const normalized = query.trim().toLowerCase().replace(/\s+/g, "");
  if (!normalized) return industries;

  return industries.filter((industry) => {
    const haystack = [
      industry.name,
      industry.category,
      industry.description ?? "",
      ...industry.keywords,
    ]
      .join(" ")
      .toLowerCase()
      .replace(/\s+/g, "");
    return haystack.includes(normalized);
  });
}
