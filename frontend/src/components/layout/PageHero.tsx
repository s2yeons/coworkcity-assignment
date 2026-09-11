import { Breadcrumb } from "./Breadcrumb";

type Crumb = { label: string; href?: string };

/** 내부 페이지 제목 영역. 코워크시티 히어로의 연한 초록 톤을 이어받은 띠 */
export function PageHero({
  crumbs,
  title,
  description,
  children,
}: {
  crumbs: Crumb[];
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-[linear-gradient(180deg,#e9f3ec_0%,#f6faf7_70%,#ffffff_100%)]">
      <div className="mx-auto w-full max-w-[1280px] px-4 pb-10 pt-8 sm:px-6 sm:pt-10 lg:px-10">
        <Breadcrumb items={crumbs} />
        <h1 className="mt-4 text-[28px] font-bold tracking-[-0.03em] text-ink sm:text-[36px]">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-2 sm:text-base">{description}</p>}
        {children}
      </div>
    </div>
  );
}
