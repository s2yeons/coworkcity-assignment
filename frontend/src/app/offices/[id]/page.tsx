import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { OfficeMap } from "@/components/map/OfficeMap";
import { Badge, RegistrationStatusBadge } from "@/components/office-recommendation/Badge";
import { ApiError } from "@/lib/api";
import { getOffice } from "@/lib/office-recommendation/api";
import { BUSINESS_TYPE_LABEL } from "@/lib/office-recommendation/constants";
import { formatWon } from "@/lib/office-recommendation/format";
import type { OfficeDetail } from "@/lib/office-recommendation/types";

/** 서버에서 백엔드 API를 호출합니다. 404는 notFound, 그 외 오류는 페이지 안에서 안내합니다. */
async function loadOffice(id: string): Promise<OfficeDetail | ApiError> {
  try {
    return await getOffice(id, { cache: "no-store" });
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) notFound();
      return error;
    }
    throw error;
  }
}

export async function generateMetadata({ params }: PageProps<"/offices/[id]">): Promise<Metadata> {
  const result = await loadOffice((await params).id);
  return { title: result instanceof ApiError ? "지점 정보 | 코워크시티" : `${result.name} | 코워크시티` };
}

export default async function OfficeDetailPage({ params, searchParams }: PageProps<"/offices/[id]">) {
  const { id } = await params;
  const from = (await searchParams).from;
  const backHref = typeof from === "string" && from ? `/offices/recommend?${from}` : "/offices/recommend";
  const result = await loadOffice(id);

  if (result instanceof ApiError) {
    return (
      <main className="flex-1 bg-white text-ink">
        <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
          <Breadcrumb items={[{ label: "홈", href: "/" }, { label: "전국 지점", href: backHref }, { label: "지점 정보" }]} />
          <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <h1 className="font-semibold text-red-800">지점 정보를 불러오지 못했어요.</h1>
            <p className="mt-1 text-sm text-red-700">잠시 후 다시 시도해주세요.</p>
            <Link
              href={`/offices/${id}${typeof from === "string" && from ? `?from=${encodeURIComponent(from)}` : ""}`}
              className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-red-300 bg-white px-5 font-medium text-red-800 hover:bg-red-100"
            >
              다시 시도
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const office = result;
  const monthly = office.priceUnit === "YEAR" ? Math.round(office.price / 12) : office.price;
  const typeLabel = office.businessTypes.map((t) => BUSINESS_TYPE_LABEL[t]).join("·");

  const rows: Array<{ label: string; value: React.ReactNode }> = [
    { label: "지점 주소", value: office.address ?? `${office.region} ${office.district}` },
    { label: "과밀/비과밀", value: office.isNonCongested ? "비과밀" : "과밀" },
    { label: "건축물 용도", value: office.buildingUse ?? "정보 없음" },
    { label: "결제 주기", value: office.priceUnit === "YEAR" ? "연간" : "월간" },
    { label: "사업자 유형", value: typeLabel },
    { label: "인허가 업종 주소지 지원", value: office.permitAddressSupported ? "가능" : "불가능" },
    { label: "현장 실태 조사 지원", value: office.siteInspectionSupported ? "가능" : "불가능" },
  ];

  return (
    <main className="flex-1 bg-white text-ink">
      <div className="bg-[linear-gradient(180deg,#e9f3ec_0%,#f6faf7_70%,#ffffff_100%)]">
      <div className="mx-auto w-full max-w-[1280px] px-4 pt-8 sm:px-6 sm:pt-10 lg:px-10">
        <Breadcrumb
          items={[
            { label: "홈", href: "/" },
            { label: "전국 지점", href: backHref },
            { label: office.name },
          ]}
        />

        <header className="mt-5 pb-10">
          <h1 className="text-[28px] font-bold tracking-[-0.03em] sm:text-[36px]">{office.name}</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
            {office.name}은 {office.address ?? `${office.region} ${office.district}`}에 있는 비상주 사무실이에요.{" "}
            {typeLabel} 사업자등록이 가능하며, 이용 요금은 {office.priceUnit === "YEAR" ? "연간 결제 기준 " : ""}월 {formatWon(monthly)}부터예요.
          </p>
          {office.isNonCongested ? (
            <p className="mt-1 text-[15px] leading-relaxed text-ink-2">이 지점은 비과밀 지역이라 법인 설립 시 등록면허세 중과세가 적용되지 않아요.</p>
          ) : (
            <p className="mt-1 text-[15px] leading-relaxed text-ink-2">이 지점은 과밀억제권역에 있어 법인 설립 시 등록면허세가 중과될 수 있어요.</p>
          )}
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge tone={office.isNonCongested ? "success" : "neutral"}>{office.isNonCongested ? "비과밀" : "과밀"}</Badge>
            {office.siteInspectionSupported && <Badge tone="outline">실사가능</Badge>}
            {office.permitAddressSupported && <Badge tone="outline">인허가 업종 주소지 지원</Badge>}
          </div>
        </header>
      </div>
      </div>
      <div className="mx-auto w-full max-w-[1280px] px-4 pb-16 sm:px-6 lg:px-10">
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div>
            {office.lat !== null && office.lng !== null && (
              <OfficeMap
                pins={[{ id: office.id, name: office.name, lat: office.lat, lng: office.lng }]}
                zoom={4}
                className="mb-10 h-64 sm:h-80"
              />
            )}
            <section aria-labelledby="info-heading">
              <h2 id="info-heading" className="text-lg font-bold">기본 정보</h2>
              <dl className="mt-4 grid gap-x-8 gap-y-6 sm:grid-cols-2">
                {rows.map((row) => (
                  <div key={row.label}>
                    <dt className="text-sm text-ink-3">{row.label}</dt>
                    <dd className="mt-1 text-[15px] font-bold text-ink">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="mt-10" aria-labelledby="industries-heading">
              <h2 id="industries-heading" className="text-lg font-bold">
                사업자등록 가능 업종 <span className="text-sm font-normal text-ink-3">{office.industries.length}개</span>
              </h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {office.industries.map((industry) => (
                  <li key={industry.id} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-sm text-ink">
                    {industry.name}
                    {industry.registrationStatus !== "AVAILABLE" && <RegistrationStatusBadge status={industry.registrationStatus} />}
                  </li>
                ))}
              </ul>
            </section>

            {office.description && (
              <section className="mt-10" aria-labelledby="desc-heading">
                <h2 id="desc-heading" className="text-lg font-bold">지점 소개</h2>
                <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{office.description}</p>
              </section>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-line bg-white p-6 shadow-[0_8px_24px_rgba(17,52,36,0.06)]">
              <h2 className="text-xl font-bold">계약 옵션</h2>
              <p className="mt-1 text-xs text-ink-3">이 과제에서는 조건 확인까지만 제공해요.</p>

              <p className="mt-5 text-sm font-medium text-ink">사업자 유형</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(["INDIVIDUAL", "CORPORATE"] as const).map((t) => {
                  const on = office.businessTypes.includes(t);
                  return (
                    <span
                      key={t}
                      className={on ? "flex h-11 items-center justify-center rounded-lg border border-brand-500 bg-brand-50 text-sm font-bold text-brand-800" : "flex h-11 items-center justify-center rounded-lg border border-line text-sm text-ink-3 line-through"}
                    >
                      {t === "INDIVIDUAL" ? "개인" : "법인"}
                    </span>
                  );
                })}
              </div>

              <p className="mt-5 text-sm font-medium text-ink">결제 주기</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(["YEAR", "MONTH"] as const).map((u) => (
                  <span
                    key={u}
                    className={office.priceUnit === u ? "flex h-11 items-center justify-center rounded-lg border border-brand-500 bg-brand-50 text-sm font-bold text-brand-800" : "flex h-11 items-center justify-center rounded-lg border border-line text-sm text-ink-3"}
                  >
                    {u === "YEAR" ? "연간" : "월간"}
                  </span>
                ))}
              </div>

              <div className="mt-6 flex items-baseline justify-between border-t border-line pt-5">
                <span className="text-sm text-ink-2">{office.priceUnit === "YEAR" ? "연간 결제" : "월간 결제"}</span>
                <span>
                  <span className="text-2xl font-bold">{formatWon(office.price)}</span>
                  <span className="text-sm text-ink-3">{office.priceUnit === "YEAR" ? "/연" : "/월"}</span>
                </span>
              </div>
              {office.priceUnit === "YEAR" && <p className="mt-1 text-right text-xs text-ink-3">월 {formatWon(monthly)} 환산</p>}

              <Link
                href={backHref}
                className="mt-5 flex min-h-12 items-center justify-center rounded-lg bg-brand-500 font-bold text-white transition-colors hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
              >
                추천 결과로 돌아가기
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
