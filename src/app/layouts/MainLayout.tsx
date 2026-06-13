import {
  BadgeCheck,
  Compass,
  House,
  LogIn,
  MapPinned,
  Plus,
  Search,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { activitySummary, primaryNavigation } from '../data/prototype'

const navigationIcons = {
  '/': House,
  '/auth/login': LogIn,
  '/locations': MapPinned,
  '/posts': Search,
  '/api-status': BadgeCheck,
} as const

function MainLayout() {
  return (
    <div className="min-h-screen bg-(--surface-base) text-(--text-strong)">
      <header className="sticky top-0 z-20 border-b border-(--border-subtle) bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <NavLink
            to="/"
            className="flex items-center gap-3 rounded-full border border-(--border-subtle) bg-(--surface-card) px-3 py-2"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-(--accent-strong) text-sm font-semibold text-white">
              어
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">어디갔지</p>
              <p className="text-xs text-(--text-muted)">
                강남대 분실물 허브
              </p>
            </div>
          </NavLink>

          <div className="hidden min-w-0 flex-1 items-center gap-2 rounded-full border border-(--border-subtle) bg-(--surface-soft) px-4 py-2 md:flex">
            <Search className="h-4 w-4 text-(--text-muted)" />
            <input
              className="w-full bg-transparent text-sm outline-none placeholder:text-(--text-muted)"
              placeholder="물품명, 장소, 날짜로 찾기"
            />
          </div>

          <nav className="ml-auto hidden items-center gap-1 lg:flex">
            {primaryNavigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-(--accent-soft) text-(--accent-strong)'
                      : 'text-(--text-muted) hover:bg-(--surface-soft) hover:text-(--text-strong)',
                  ].join(' ')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <button
            type="button"
            className="hidden items-center gap-2 rounded-full bg-(--accent-strong) px-4 py-2 text-sm font-semibold text-white shadow-(--shadow-accent) md:inline-flex"
          >
            <Plus className="h-4 w-4" />
            게시글 등록
          </button>
        </div>
      </header>

      <div className="main-layout-grid mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <aside className="hidden rounded-(--radius-panel) border border-(--border-subtle) bg-(--surface-card) p-4 shadow-(--shadow-soft) lg:block">
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold">{activitySummary.nickname}</p>
              <p className="text-xs text-(--text-muted)">
                학번 {activitySummary.studentNumber}
              </p>
            </div>
            <div className="rounded-2xl bg-(--surface-soft) p-3">
              <div className="flex items-center justify-between text-sm">
                <span>활동 온도</span>
                <span className="font-semibold text-(--accent-strong)">
                  {activitySummary.temperature}°
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-white">
                <div
                  className="h-2 rounded-full bg-(--accent-strong)"
                  style={{ width: `${activitySummary.temperature}%` }}
                />
              </div>
            </div>
            <div className="grid gap-2">
              {[
                ['포인트', `${activitySummary.points}P`],
                ['작성글', `${activitySummary.posts}`],
                ['댓글', `${activitySummary.comments}`],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-2xl border border-(--border-subtle) px-3 py-2 text-sm"
                >
                  <span className="text-(--text-muted)">{label}</span>
                  <span className="font-semibold">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <p className="eyebrow-tracking text-(--text-muted) text-xs font-semibold uppercase">
              빠른 이동
            </p>
            {[
              ['회원가입 플로우 검토', '/auth/signup/email'],
              ['보관 장소 CRUD 검토', '/locations'],
              ['현재 API 범위 확인', '/api-status'],
            ].map(([label, to]) => (
              <NavLink
                key={to}
                to={to}
                className="flex items-center gap-2 rounded-2xl px-3 py-2 text-(--text-muted) text-sm transition hover:bg-(--surface-soft) hover:text-(--text-strong)"
              >
                <Compass className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </div>
        </aside>

        <main className="min-w-0 pb-20 lg:pb-0">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-(--border-subtle) bg-white/90 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-5 px-2 py-2">
          {primaryNavigation.map((item) => {
            const Icon = navigationIcons[item.to]
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    'flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-xs font-medium',
                    isActive ? 'text-(--accent-strong)' : 'text-(--text-muted)',
                  ].join(' ')
                }
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

export default MainLayout
