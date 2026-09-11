import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatWon } from "@/lib/office-recommendation/format";
import type { RecommendedOffice } from "@/lib/office-recommendation/types";
import { Badge } from "./Badge";

type Props = {
  item: RecommendedOffice;
  rank: number;
  industryName: string;
  /** 사용자가 선택한 선택 조건 수 */
  selectedConditionCount: number;
  /** 상세 페이지에서 돌아올 때 사용할 현재 검색 조건 query string */
  backQuery: string;
  /** 지도 마커와 연동: 마커를 눌렀거나 카드에 마우스를 올린 상태 */
  active?: boolean;
  onHover?: (id: string | null) => void;
};

function Check({ muted }: { muted?: boolean }) {
  return (
    <span aria-hidden="true" className={cn("w-4 shrink-0 text-center font-bold", muted ? "text-ink-3" : "text-brand-600")}>
      {muted ? "–" : "✓"}
    </span>
  );
}

/** 이름 · 가격 · 추천 이유 세 가지에 위계를 두고, 나머지는 상세로 넘긴 카드 */
export function OfficeCard({ item, rank, industryName, selectedConditionCount, backQuery, active, onHover }: Props) {
  const allMatched = selectedConditionCount > 0 && item.unmetConditions.length === 0;

  return (
    <article
      id={`office-card-${item.id}`}
      onMouseEnter={() => onHover?.(item.id)}
      onMouseLeave={() => onHover?.(null)}
      className={cn(
        "flex w-full flex-col rounded-2xl border bg-white p-6 transition-shadow hover:shadow-[0_8px_24px_rgba(17,52,36,0.08)]",
        allMatched ? "border-brand-300" : "border-line",
        active && "ring-2 ring-ink ring-offset-2",
      )}
      aria-labelledby={`office-${item.id}-name`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">
          추천 {rank}
        </span>
        {allMatched && (
          <span className="inline-flex items-center rounded-full bg-brand-500 px-2.5 py-1 text-xs font-bold text-white">
            선택 조건 모두 충족
          </span>
        )}
      </div>

      <h3 id={`office-${item.id}-name`} className="mt-3 text-[19px] font-bold tracking-[-0.01em] text-ink">
        {item.name}
      </h3>
      <p className="mt-1 text-sm text-ink-3">{item.address ?? `${item.region} ${item.district}`}</p>

      <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="지점 조건">
        <li>
          <Badge tone={item.isNonCongested ? "success" : "neutral"}>{item.isNonCongested ? "비과밀" : "과밀"}</Badge>
        </li>
        {item.siteInspectionSupported && (
          <li>
            <Badge tone="outline">실사가능</Badge>
          </li>
        )}
        {item.permitAddressSupported && (
          <li>
            <Badge tone="outline">인허가 지원</Badge>
          </li>
        )}
      </ul>

      <div className="mt-5 flex items-baseline justify-between gap-3 border-t border-line pt-5">
        <span className="text-sm text-ink-3">{item.priceUnit === "YEAR" ? "연간 결제" : "월간 결제"}</span>
        <span className="text-right">
          <span className="text-[22px] font-bold tracking-[-0.01em] text-ink">{formatWon(item.price)}</span>
          <span className="ml-0.5 text-sm text-ink-3">{item.priceUnit === "YEAR" ? "/연" : "/월"}</span>
          {item.priceUnit === "YEAR" && (
            <span className="block text-xs text-ink-3">월 {formatWon(item.monthlyPrice)} 환산</span>
          )}
        </span>
      </div>

      <ul className="mt-5 space-y-2 text-sm" aria-label="추천 이유">
        <li className="flex items-start gap-2 text-ink">
          <Check />
          <span>{industryName} 사업자등록 가능</span>
        </li>
        {item.matchReasons.map((reason) => (
          <li key={reason} className="flex items-start gap-2 font-semibold text-ink">
            <Check />
            <span>{reason}</span>
          </li>
        ))}
        {item.unmetConditions.map((c) => (
          <li key={c} className="flex items-start gap-2 text-ink-3">
            <Check muted />
            <span>{c}</span>
          </li>
        ))}
      </ul>

      {selectedConditionCount > 0 && (
        <p className={cn("mt-4 text-xs", allMatched ? "font-medium text-brand-700" : "text-ink-3")}>
          {allMatched
            ? `선택하신 조건 ${selectedConditionCount}개를 모두 충족해요.`
            : `선택하신 조건 ${selectedConditionCount}개 중 ${item.matchReasons.length}개를 충족해요.`}
        </p>
      )}

      <div className="mt-auto pt-6">
        <Link
          href={`/offices/${item.id}${backQuery ? `?from=${encodeURIComponent(backQuery)}` : ""}`}
          className="flex min-h-12 w-full items-center justify-center rounded-xl border border-line-2 bg-white font-bold text-ink transition-colors hover:border-ink hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        >
          상세보기
          <span className="sr-only">: {item.name}</span>
        </Link>
      </div>
    </article>
  );
}
