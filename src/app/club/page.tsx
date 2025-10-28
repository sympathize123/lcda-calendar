export const metadata = {
  title: "LCDA Club — Home",
  description: "성균관대학교 LCDA 동아리 메인 페이지",
};

export default function ClubHome() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-primary shadow-[var(--shadow-ring)]">
          LCDA CLUB
        </div>
        <a
          href="/calendar"
          className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
        >
          캘린더 바로가기
        </a>
      </header>

      <section className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-[var(--radius-lg)] border border-border/60 bg-surface p-6 shadow-[var(--shadow-soft)]">
          <h1 className="text-2xl font-semibold text-foreground">LCDA 동아리</h1>
          <p className="mt-2 text-sm text-muted">
            디자인과 개발이 만나는 협업 동아리. 스터디, 프로젝트, 해커톤과 함께
            더 나은 제품 경험을 만듭니다.
          </p>
          <div className="mt-4 inline-flex items-center gap-3">
            <a
              href="#activities"
              className="rounded-full border border-border/60 bg-surface px-4 py-2 text-sm hover:bg-surface-muted"
            >
              활동 살펴보기
            </a>
            <a
              href="/calendar"
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
            >
              일정 보기
            </a>
          </div>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-border/60 bg-surface p-6 shadow-[var(--shadow-soft)]">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">다음 일정</h2>
          <p className="mt-3 text-foreground">주요 세션과 이벤트는 캘린더에서 확인하세요.</p>
          <div className="mt-4 rounded-[var(--radius-md)] border border-dashed border-border/60 p-4 text-sm text-muted">
            캘린더와 연동된 하이라이트 영역(후속 작업에서 자동화 가능)
          </div>
        </div>
      </section>

      <section id="activities" className="mt-8 grid gap-6 md:grid-cols-3">
        {[
          { title: "스터디", desc: "디자인/개발 파트별 정기 스터디 진행" },
          { title: "프로젝트", desc: "학기별 소규모 팀 프로젝트" },
          { title: "행사", desc: "해커톤, 세미나, 네트워킹" },
        ].map((card) => (
          <div
            key={card.title}
            className="rounded-[var(--radius-lg)] border border-border/60 bg-surface p-5 shadow-[var(--shadow-soft)]"
          >
            <h3 className="text-lg font-semibold text-foreground">{card.title}</h3>
            <p className="mt-2 text-sm text-muted">{card.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

