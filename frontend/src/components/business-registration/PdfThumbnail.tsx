import { cn } from "@/lib/utils";

export type Preview = { url: string; isPdf: boolean };

/** PDF로 올린 파일의 미리보기 자리. next/image는 PDF를 렌더링할 수 없어 대신 보여주는 자리표시자입니다. */
export function PdfThumbnail({ className }: { className?: string }) {
  return (
    <div className={cn("flex shrink-0 flex-col items-center justify-center gap-1 rounded-md border border-line bg-surface text-ink-3", className)}>
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" strokeLinejoin="round" strokeLinecap="round" />
        <path d="M15 2v5h5" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <span className="text-[10px] font-bold tracking-wide">PDF</span>
    </div>
  );
}
