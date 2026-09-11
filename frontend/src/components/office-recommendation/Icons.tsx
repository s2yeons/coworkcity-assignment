/** 선택 표시용 체크 아이콘. 유니코드 ✓ 글자 대신 써서 폰트에 따라 삐뚤거나 얇아 보이는 문제를 없앱니다. */
export function CheckIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 10.5 8 14l7.5-8.5" />
    </svg>
  );
}
