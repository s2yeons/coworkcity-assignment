import { cn } from "@/lib/utils";

type Props = {
  onPrev?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  /** 다음 버튼이 비활성일 때 이유를 안내합니다. */
  hint?: string;
};

export function StepNav({ onPrev, onNext, nextLabel = "다음", nextDisabled, hint }: Props) {
  return (
    <div className="mt-8 flex flex-col gap-3 border-t border-line pt-6">
      {nextDisabled && hint && (
        <p className="text-sm text-ink-3" role="status">
          {hint}
        </p>
      )}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        {onPrev ? (
          <button
            type="button"
            onClick={onPrev}
            className="min-h-12 rounded-lg border border-line-2 bg-white px-5 font-medium text-ink-2 transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          >
            이전
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          className={cn(
            "min-h-[52px] rounded-xl px-8 font-bold text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500",
            nextDisabled
              ? "cursor-not-allowed bg-line-2"
              : "bg-brand-500 hover:bg-brand-600",
          )}
        >
          {nextLabel}
        </button>
      </div>
    </div>
  );
}
