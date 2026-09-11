import { cn } from "@/lib/utils";
import { REGISTRATION_STATUS_LABEL } from "@/lib/office-recommendation/constants";
import type { IndustryRegistrationStatus } from "@/lib/office-recommendation/types";

type Tone = "neutral" | "info" | "success" | "warning" | "danger" | "outline";

/** 코워크시티 지점 목록의 뱃지 스타일 (비과밀 = 연한 그린, 과밀 = 회색, 실사가능 = 그린 아웃라인) */
const TONE_CLASS: Record<Tone, string> = {
  neutral: "bg-surface text-ink-2",
  info: "bg-brand-50 text-brand-800",
  success: "bg-brand-50 text-brand-700",
  warning: "bg-cream text-[#8a6a1f]",
  danger: "bg-red-50 text-red-700",
  outline: "border border-brand-100 bg-white text-brand-700",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        TONE_CLASS[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const STATUS_TONE: Record<IndustryRegistrationStatus, Tone> = {
  AVAILABLE: "success",
  OEM_REQUIRED: "warning",
  PERMIT_REQUIRED: "warning",
  UNAVAILABLE: "danger",
};

export function RegistrationStatusBadge({ status }: { status: IndustryRegistrationStatus }) {
  return <Badge tone={STATUS_TONE[status]}>{REGISTRATION_STATUS_LABEL[status]}</Badge>;
}
