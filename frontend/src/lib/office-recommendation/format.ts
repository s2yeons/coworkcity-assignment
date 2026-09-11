import type { OfficeSummary } from "./types";

export function formatWon(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}원`;
}

export function formatOfficePrice(office: Pick<OfficeSummary, "price" | "priceUnit">): string {
  return `${formatWon(office.price)} / ${office.priceUnit === "YEAR" ? "1년" : "1개월"}`;
}
