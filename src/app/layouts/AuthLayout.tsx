import { Outlet } from 'react-router-dom'

function AuthLayout() {
  return (
    <div className="min-h-screen bg-(--surface-soft) px-4 py-6 text-(--text-strong) sm:px-6 lg:px-8">
      <div className="auth-layout-grid mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl gap-6">
        <section className="auth-showcase-surface hidden overflow-hidden rounded-(--radius-panel) border border-(--border-subtle) p-8 shadow-(--shadow-soft) lg:flex lg:flex-col lg:justify-between">
          <div className="space-y-4">
            <span className="inline-flex w-fit rounded-full border border-(--border-accent) bg-(--accent-soft) px-3 py-1 text-xs font-semibold text-(--accent-strong)">
              어디갔지 인증 플로우
            </span>
            <div className="space-y-3">
              <h1 className="max-w-lg text-4xl font-semibold tracking-tight">
                교내 분실물 흐름을 빠르게 이어 주는 학생용 서비스
              </h1>
              <p className="max-w-xl text-sm leading-6 text-(--text-muted)">
                학교 이메일 인증을 시작점으로 두고, 분실물 등록과 보관
                장소 확인까지 한 화면 흐름 안에서 이어질 수 있게 설계합니다.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ['학교 메일 인증', '인증 코드 발송과 검증 상태를 분리'],
              ['계정 생성', '학번, 닉네임 입력 후 즉시 로그인 유도'],
              ['토큰 관리', '로그인 이후 access/refresh 흐름 연결'],
            ].map(([title, body]) => (
              <article
                key={title}
                className="rounded-2xl border border-white/70 bg-white/80 p-4 backdrop-blur"
              >
                <h2 className="text-sm font-semibold">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-(--text-muted)">
                  {body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="flex items-center">
          <div className="w-full rounded-(--radius-panel) border border-(--border-subtle) bg-(--surface-card) p-5 shadow-(--shadow-soft) sm:p-8">
            <Outlet />
          </div>
        </section>
      </div>
    </div>
  )
}

export default AuthLayout
