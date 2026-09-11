# 코워크시티 과제 — 내 사업에 맞는 비상주사무실 찾기

사용자가 **업종 → 등록 가능 여부 → 지점 필터 → 상세 확인**을 직접 오가며 조합해야 하는 문제를,
사업 조건을 단계별로 입력하거나 **사업자등록증을 올리면(OCR)** 조건이 채워지고 **조건에 맞는 지점과 추천 이유를 함께 보여주는** 기능으로 개선했습니다.

📄 **문제 정의 · 선택 이유 · 해결 방식 · 검증 방법 → [docs/SUBMISSION.md](docs/SUBMISSION.md)**

## 실행 방법

필요한 것: **Node.js 20 이상, Docker Desktop** (PostgreSQL 컨테이너용)

```bash
npm install      # 프론트·백엔드 의존성 설치 + Prisma client 생성
npm run setup    # .env 준비 → Postgres 컨테이너 실행 → 마이그레이션 → seed (최초 1회)
npm run dev      # 프론트(3000) + 백엔드(4000) 동시 실행
```

브라우저에서 http://localhost:3000 을 열면 됩니다.

- 조건 입력으로 찾기: http://localhost:3000/offices/recommend
- 사업자등록증으로 찾기 (OCR): http://localhost:3000/offices/recommend/registration — 등록증이 없어도 화면의 샘플 3장으로 체험할 수 있습니다.

Docker 없이 실행하려면 `backend/.env`의 `DATABASE_URL`을 사용 가능한 PostgreSQL로 바꾼 뒤
`npm run db:deploy -w backend && npm run db:seed -w backend` 를 실행하세요.

## 구조

| 폴더 | 스택 | 포트 |
|---|---|---|
| `frontend/` | Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4 | 3000 |
| `backend/`  | Node.js + Express 5 + TypeScript + Prisma 7 + zod + tesseract.js | 4000 |
| `docker-compose.yml` | PostgreSQL 16 | 5432 |

```text
사용자 → Next.js UI (/offices/recommend)
       → Express API (/api/offices/recommend, /api/industries/search, …)
       → Prisma → PostgreSQL (Industry, Office, OfficeIndustry N:M, OfficeBusinessType)
       → 필수 조건 filtering(DB) → 점수·추천 이유 계산(서버) → 정렬 → 응답
       → 추천 결과 UI (추천 이유 · 미충족 조건 · 완화 제안)

사업자등록증 업로드 → POST /api/business-registration/analyze
       → tesseract.js OCR (kor+eng, 학습 데이터 포함, 네트워크 불필요)
       → 필드 파싱(번호 검증, 유형, 지역, 업태/종목) → DB 업종 매칭
       → 확인·수정 화면 → 위 추천 결과로 연결
```

지도: 추천 결과와 지점 상세에 카카오맵을 표시합니다 (`frontend/src/components/map/OfficeMap.tsx`). 지점 좌표는 `Office.lat/lng` 컬럼이며 샘플 데이터는 구·동 중심 근사값입니다.

주요 파일

- 추천 로직(순수 함수): `backend/src/services/recommendation.ts`
- DB 조회: `backend/src/services/office-service.ts`
- API 라우트: `backend/src/routes/offices.ts`, `backend/src/routes/industries.ts`
- 스키마·seed: `backend/prisma/schema.prisma`, `backend/prisma/seed.ts`
- 추천 화면: `frontend/src/components/office-recommendation/`, `frontend/src/app/offices/recommend/page.tsx`
- OCR: `backend/src/services/ocr.ts`(엔진), `business-registration-parser.ts`(필드 추출), `industry-matcher.ts`(업종 매칭), `backend/src/routes/business-registration.ts`
- 등록증 화면: `frontend/src/components/business-registration/`, `frontend/src/app/offices/recommend/registration/page.tsx`
- 샘플 등록증(가상 정보): `backend/test/fixtures/business-registration/` (`generate.py`로 생성)

## API

| Method | Path | 설명 |
|---|---|---|
| GET | `/api/industries/search?q=&limit=` | 업종 검색 (업종명·키워드·설명 부분 일치) |
| GET | `/api/industries/:id` | 업종 상세 |
| GET | `/api/offices/recommend?industry=&businessType=&region=&nonCongested=&permitAddressSupported=&maxPrice=` | 조건 기반 추천 |
| GET | `/api/offices/regions?industry=&businessType=` | 지역별 지점 수 |
| GET | `/api/offices/:id` | 지점 상세 |
| GET | `/api/stats` | 랜딩 수치 (등록 가능 업종 수 · 지점 수 · 지점이 있는 지역 수, DB 기준) |
| POST | `/api/business-registration/analyze` | 사업자등록증 이미지 또는 PDF(multipart `file`, PNG/JPEG/WEBP/PDF ≤10MB) OCR → 필드 + 추천 조건 제안 |
| POST | `/api/business-registration/analyze-sample` | `{ "sample": "individual-seoul-ecommerce" }` 샘플로 동일 분석 |
| POST | `/api/business-registration/verify` | 사용자가 고친 등록증 정보(텍스트)로 국세청 확인·업종 매칭 재수행 (이미지 없음) |
| GET | `/api/business-registration/samples` | 샘플 등록증 목록 (이미지는 `/samples/:file`) |

응답 규약: 성공 `{ "data": ... }`, 실패 `{ "error": { "code", "message", "details?" } }`

```bash
curl -G http://localhost:4000/api/offices/recommend \
  --data-urlencode industry=retail --data-urlencode businessType=INDIVIDUAL \
  --data-urlencode region=서울 --data-urlencode nonCongested=true
```

## 테스트

```bash
npm test                       # 백엔드 unit test 43개 (추천 로직, OCR 파서, 업종 매칭, 이미지 검증, 국세청 진위확인, 검증 스키마)
npm run test:api -w backend    # API 통합 테스트 31개 (추천 + OCR 샘플 3장 실제 인식 + 보안, 서버 + seed DB 필요)
npm run lint                   # 프론트 ESLint + 백엔드 타입체크
npm run build
```

## 기타 스크립트

```bash
npm run dev:front / dev:back   # 개별 실행
npm run db:up / db:down        # Postgres 컨테이너 시작/종료
npm run db:migrate             # 스키마 변경 후 마이그레이션 생성 (개발용)
npm run db:seed                # seed 재입력 (upsert, 여러 번 실행 가능)
```

## 사업자등록증 샘플과 OCR에 대해

- 실제 사업자등록증은 개인정보가 있어 포함하지 않았습니다. `backend/test/fixtures/business-registration/`의 3장은 표준 서식을 따라 **가상 정보로 생성한** 이미지이며, 이미지 하단에도 그 사실이 적혀 있습니다.
- OCR은 tesseract.js를 사용하고 한국어·영어 학습 데이터(`backend/tessdata/`, 7MB)를 레포에 포함해 API 키나 네트워크 없이 동작합니다. 첫 요청 시 워커 초기화에 1~2초, 이후 한 장당 0.5~1초 걸립니다.
- 업로드된 이미지는 메모리에서만 처리되고 디스크·DB·로그에 저장하지 않으며, 처리 후 버퍼를 소거합니다. OCR 원문은 응답에 포함하지 않습니다.
- 사업자등록번호는 체크섬으로 형식을 검사한 뒤, `backend/.env`에 `NTS_API_KEY`(공공데이터포털 "국세청_사업자등록정보 진위확인 및 상태조회 서비스", 무료, 활용신청 즉시 발급)를 넣으면 국세청 API로 진위확인·상태조회까지 수행합니다. 키가 없으면 "미확인"으로 표시됩니다. 샘플 등록증은 가상 번호라 "국세청에 등록되지 않은 번호"로 나오는 것이 정상입니다.
- 보안: 매직 바이트 형식 검사, 픽셀 크기 상한(6000px/20MP)·10MB 제한, IP당 속도 제한(기본 300회/분), `Cache-Control: no-store`, helmet 보안 헤더, CORS 프론트 origin 한정. 자세한 내용은 [docs/SUBMISSION.md](docs/SUBMISSION.md) 3-5절.

## seed 데이터에 대해

`backend/prisma/seed.ts`의 데이터는 서비스 구조 검증용 가상 데이터입니다. 업종 30개의 명칭·분류·등록 상태는
코워크시티 업종 안내 페이지에서 확인한 내용을 옮겼지만, 지점 15개("… Mock 지점")와 각 지점의 조건 값은 실제 지점과 무관합니다.
실제 지점 데이터는 크롤링하지 않았습니다.
