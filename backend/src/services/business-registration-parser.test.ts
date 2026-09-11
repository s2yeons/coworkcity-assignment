import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatBusinessNumber,
  isValidBusinessNumber,
  parseBusinessRegistration,
  regionFromAddress,
} from "./business-registration-parser";

/** tesseract.js(PSM 4)가 샘플 이미지에서 실제로 출력한 텍스트를 그대로 고정한 것 */
const OCR_SEOUL = `사업자등록증

=

( 일반과세자 )
등록번호 : 123-45-67891

상 호:      코워크샘플상사

대표자:                홍길동

개업연월일:     2022 년 03 월 02 일

사업장 소재지 :            서울특별시 마포구 양화로 100, 5층 501호 (서교동

사업의종류:           업태                            종목
도매 및 소매업                 전자상거래 소매업
도매 및 소매업                 통신판매업

발급사유:                                        신규

공동사업자 :

사업자 단위 과세 적용사업자 여부 :               여( ) 부(\\/ )

전자세금계산서 전용 전자우편주소 :               sample@example.com

2025 년 01 월 15 일

마포세무서장
`;

const OCR_CORP = `사업자등록증
( 법인사업자 )
등록번호: 220-88-12340

상 호:              주식회사 샘플소프트
대표자:              김테스트
법인등록번호 :           110111-1234567
개업연월일:     2021년 07 월 19 일
사업장 소재지 :           경기도 성남시 분당구 판교역로 200, 3층 (삼평동)
본점소재지:            경기도 성남시 분당구 판교역로 200, 3층 (삼평동)
사업의종류:          업태                        종목

정보통신업                      응용 소프트웨어 개발 및 공급업

정보통신업                    포털 및 기타 인터넷 정보매개 서비
발급사유:                                        신규
`;

/** 촬영본: 주소 줄이 라벨보다 앞에 오고, 업태/종목 사이 공백이 한 칸 */
const OCR_PHOTO = `—     ~
사업자등록증
( 간이과세자 )                        |

등록번호 : 617-12-34562

oN

상 호:              샘플디자인
대표자:              이가상                                                     |
개업연월일:     2023 년 11월 06 일

부산광역시 해운대구 MHEYE 55,85 (우동)

사업장 소재지 :
사업의종류:          업태                        종목

전문, 과학 및 기술 서비스업 시각 디자인업
전문, 과학 및 기술 서비스업 사진 촬영업

발급사유:                신규
`;

describe("isValidBusinessNumber (국세청 검증 자리)", () => {
  it("샘플 번호 3개는 유효, 마지막 자리 바꾸면 무효", () => {
    for (const n of ["1234567891", "2208812340", "6171234562"]) assert.equal(isValidBusinessNumber(n), true, n);
    assert.equal(isValidBusinessNumber("1234567890"), false);
    assert.equal(isValidBusinessNumber("12345"), false);
  });
  it("포맷", () => assert.equal(formatBusinessNumber("1234567891"), "123-45-67891"));
});

describe("regionFromAddress", () => {
  it("시·도 접두어 → 추천 DB 지역 라벨", () => {
    assert.equal(regionFromAddress("서울특별시 마포구 양화로 100"), "서울");
    assert.equal(regionFromAddress("경기도 성남시 분당구"), "경기");
    assert.equal(regionFromAddress("세종특별자치시 한누리대로"), "세종");
    assert.equal(regionFromAddress("충청북도 청주시"), "충북");
    assert.equal(regionFromAddress("전라북도 전주시"), "전북");
    assert.equal(regionFromAddress(null), null);
    assert.equal(regionFromAddress("알 수 없는 주소"), null);
  });
});

describe("parseBusinessRegistration", () => {
  it("개인(일반과세자) 서울 전자상거래", () => {
    const f = parseBusinessRegistration(OCR_SEOUL);
    assert.equal(f.businessNumber, "123-45-67891");
    assert.equal(f.businessNumberValid, true);
    assert.equal(f.businessType, "INDIVIDUAL");
    assert.equal(f.companyName, "코워크샘플상사");
    assert.equal(f.representative, "홍길동");
    assert.equal(f.openedAt, "2022-03-02");
    assert.match(f.address ?? "", /^서울특별시 마포구 양화로 100/);
    assert.equal(f.region, "서울");
    assert.deepEqual(f.businessCategories, ["도매 및 소매업", "도매 및 소매업"]);
    assert.deepEqual(f.businessItems, ["전자상거래 소매업", "통신판매업"]);
  });

  it("법인 경기 소프트웨어 (법인등록번호 있음)", () => {
    const f = parseBusinessRegistration(OCR_CORP);
    assert.equal(f.businessNumber, "220-88-12340");
    assert.equal(f.businessType, "CORPORATE");
    assert.equal(f.companyName, "주식회사 샘플소프트");
    assert.equal(f.region, "경기");
    assert.equal(f.openedAt, "2021-07-19");
    assert.deepEqual(f.businessCategories, ["정보통신업", "정보통신업"]);
    assert.equal(f.businessItems[0], "응용 소프트웨어 개발 및 공급업");
  });

  it("촬영본: 밀린 주소 줄과 한 칸 공백 업태/종목도 복구", () => {
    const f = parseBusinessRegistration(OCR_PHOTO);
    assert.equal(f.businessNumber, "617-12-34562");
    assert.equal(f.businessType, "INDIVIDUAL");
    assert.equal(f.region, "부산");
    assert.match(f.address ?? "", /^부산광역시 해운대구/);
    assert.deepEqual(f.businessCategories, ["전문, 과학 및 기술 서비스업", "전문, 과학 및 기술 서비스업"]);
    assert.deepEqual(f.businessItems, ["시각 디자인업", "사진 촬영업"]);
  });

  it("OCR 오인식: 라벨 사이 공백, 숫자의 O/I, 한 줄 업태·종목", () => {
    const f = parseBusinessRegistration(`사 업 자 등 록 증
( 일 반 과 세 자 )
등 록 번 호 : 1O1-2I-3456O
상 호 : 오타상사
대 표 자 : 김오타
사 업 장 소 재 지 : 인천광역시 연수구 송도과학로 1
업 태 : 제조업   종 목 : 화장품 제조업
발 급 사 유 : 신규`);
    assert.equal(f.businessNumber, "101-21-34560");
    assert.equal(typeof f.businessNumberValid, "boolean");
    assert.equal(f.companyName, "오타상사");
    assert.equal(f.representative, "김오타");
    assert.equal(f.region, "인천");
    assert.deepEqual(f.businessCategories, ["제조업"]);
    assert.deepEqual(f.businessItems, ["화장품 제조업"]);
  });

  it("실제 서식 라벨: 개인은 '성명', 법인은 '법인명(단체명)'", () => {
    const individual = parseBusinessRegistration(`사업자등록증
( 일반과세자 )
등록번호 : 123-45-67891
상    호 : 실제서식상사
성    명 : 김성명
개 업 연 월 일 : 2022 년 03 월 02 일
사업장 소재지 : 서울특별시 강남구 테헤란로 1
사 업 의 종 류 : 업태 도매 및 소매업   종목 전자상거래 소매업`);
    assert.equal(individual.companyName, "실제서식상사");
    assert.equal(individual.representative, "김성명");

    const corp = parseBusinessRegistration(`사업자등록증
( 법인사업자 )
등록번호 : 220-88-12340
법인명(단체명) : 주식회사 실제서식
대 표 자 : 이대표
개 업 연 월 일 : 2021 년 07 월 19 일
법인등록번호 : 110111-1234567
사업장 소재지 : 경기도 성남시 분당구 판교역로 200
본 점 소 재 지 : 경기도 성남시 분당구 판교역로 200
사 업 의 종 류 : 업태 정보통신업   종목 응용 소프트웨어 개발 및 공급업`);
    assert.equal(corp.companyName, "주식회사 실제서식");
    assert.equal(corp.representative, "이대표");
    assert.equal(corp.businessType, "CORPORATE");
  });

  it("넓은 자간으로 '호'가 누락된 '상 :' 도 상호로 인식", () => {
    const f = parseBusinessRegistration("( 일반과세자 )\n등록번호 : 123-45-67891\n상   :      코워크샘플상사\n성 명:  홍길동\n");
    assert.equal(f.companyName, "코워크샘플상사");
    assert.equal(f.representative, "홍길동");
  });

  it("사업자등록증이 아닌 텍스트는 모두 null/빈 값", () => {
    const f = parseBusinessRegistration("영수증\n합계 12,000원\n감사합니다");
    assert.equal(f.businessNumber, null);
    assert.equal(f.businessType, null);
    assert.equal(f.companyName, null);
    assert.equal(f.region, null);
    assert.deepEqual(f.businessItems, []);
  });
});
