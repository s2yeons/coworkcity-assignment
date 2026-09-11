import { cn } from "@/lib/utils";
import { STEPS, type Step } from "@/lib/office-recommendation/search-params";

type Props = {
  current: Step;
  maxReachable: Step;
  onSelect: (step: Step) => void;
};

export function StepIndicator({ current, maxReachable, onSelect }: Props) {
  return (
    <nav aria-label="입력 단계">
      <ol className="flex flex-wrap items-center gap-2 text-sm">
        {STEPS.map((step, index) => {
          const isCurrent = step.id === current;
          const isDone = step.id < current;
          const reachable = step.id <= maxReachable;
          return (
            <li key={step.id} className="flex shrink-0 items-center gap-2">
              {index > 0 && <span aria-hidden="true" className="h-px w-3 bg-line-2 sm:w-4" />}
              <button
                type="button"
                onClick={() => onSelect(step.id)}
                disabled={!reachable || isCurrent}
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "flex min-h-9 items-center gap-2 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500",
                  isCurrent ? "bg-brand-500 px-3.5 py-1.5 font-bold text-white" : "px-1 sm:px-3 sm:py-1.5",
                  isDone && "bg-brand-50 text-brand-700 hover:bg-brand-100",
                  !isCurrent && !isDone && "text-ink-3",
                  !reachable && "cursor-not-allowed",
                )}
              >
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full text-xs",
                    isCurrent && "bg-white/20",
                    isDone && "bg-brand-500 text-white",
                    !isCurrent && !isDone && "border border-line-2",
                  )}
                  aria-hidden="true"
                >
                  {isDone ? "✓" : step.id}
                </span>
                <span className={cn(!isCurrent && "sr-only sm:not-sr-only")}>
                  <span className="sr-only">{step.id}단계 </span>
                  {step.label}
                  {isDone && <span className="sr-only"> (완료)</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
