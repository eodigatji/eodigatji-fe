import {
  BadgeHelp,
  MapPinned,
  Search,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../features/auth/store/authStore'

type NavigationItem = {
  to: string
  label: string
  icon: typeof MapPinned
}

function isLocationDetailPath(pathname: string) {
  return /^\/locations\/\d+$/.test(pathname)
}

function isLocationEditPath(pathname: string) {
  return /^\/locations\/\d+\/edit$/.test(pathname)
}

function isPostDetailPath(pathname: string) {
  return /^\/posts\/\d+$/.test(pathname)
}

function isNavigationItemActive(pathname: string, itemTo: string) {
  if (itemTo === '/') {
    return pathname === '/'
  }

  if (itemTo === '/locations') {
    return (
      pathname === '/locations' ||
      isLocationDetailPath(pathname) ||
      isLocationEditPath(pathname)
    )
  }

  if (itemTo === '/posts') {
    return (
      pathname === '/posts' ||
      pathname === '/posts/new' ||
      isPostDetailPath(pathname)
    )
  }

  if (itemTo === '/mypage') {
    return pathname === '/mypage'
  }

  if (itemTo === '/auth/login') {
    return pathname === '/auth/login'
  }

  if (itemTo === '/api-status') {
    return pathname === '/api-status'
  }

  return pathname === itemTo
}

function MainLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const { pathname } = useLocation()

  const primaryNavigation: NavigationItem[] = isAuthenticated
    ? [
        { to: '/', label: '홈', icon: MapPinned },
        { to: '/locations', label: '장소', icon: MapPinned },
        { to: '/posts', label: '찾기', icon: Search },
        { to: '/mypage', label: '내정보', icon: UserRound },
      ]
    : [
        { to: '/', label: '홈', icon: MapPinned },
        { to: '/auth/login', label: '로그인', icon: ShieldCheck },
        { to: '/locations', label: '장소', icon: MapPinned },
        { to: '/posts', label: '찾기', icon: Search },
        { to: '/api-status', label: '안내', icon: BadgeHelp },
      ]

  return (
    <div className="mobile-frame-app min-h-screen bg-(color:--surface-base) text-(color:--text-strong)">
      <div className="mobile-frame-shell mx-auto min-h-screen">
        <header className="sticky top-0 z-30 border-b border-white/70 bg-white/92 backdrop-blur-xl">
          <div className="mobile-topbar flex items-center gap-2 px-3 py-3">
            <NavLink
              to="/"
              className="mobile-brand-chip flex min-w-0 flex-1 items-center gap-2 rounded-full border border-(color:--border-subtle) bg-white px-2.5 py-2 shadow-[0_18px_34px_-28px_rgba(19,34,56,0.65)]"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-(color:--accent-strong) text-sm font-semibold text-white">
                M
              </span>
              <div className="min-w-0">
                <p className="text-[15px] font-semibold">메인 지도</p>
                <p className="text-[11px] leading-4 text-(color:--text-muted)">
                  보관 장소와 물품 현황을 먼저 확인하는 홈
                </p>
              </div>
            </NavLink>

            <NavLink
              to="/posts"
              className="mobile-search-action app-command-bar grid h-11 w-11 shrink-0 place-items-center rounded-[24px] border border-(color:--border-subtle) bg-(color:--surface-soft)"
            >
              <Search className="h-5 w-5 text-(color:--text-muted)" />
            </NavLink>

            <NavLink
              to={isAuthenticated ? '/locations/new' : '/auth/login'}
              className="mobile-topbar-button hidden shrink-0 items-center justify-center rounded-full bg-(color:--accent-strong) px-3 py-2 text-center text-[13px] font-semibold text-[color:#fff] shadow-(--shadow-accent) sm:inline-flex"
            >
              {isAuthenticated ? '장소 등록' : '로그인'}
            </NavLink>
          </div>
        </header>

        <main className="min-w-0 px-3 py-4 pb-24">
          <Outlet />
        </main>

        <nav className="mobile-frame-bottom-nav fixed bottom-0 z-30 border-t border-(color:--border-subtle) bg-white/92 backdrop-blur">
          <div
            className={`grid gap-1 px-1.5 py-1.5 ${
              isAuthenticated ? 'grid-cols-4' : 'grid-cols-5'
            }`}
          >
            {primaryNavigation.map((item) => {
              const Icon = item.icon
              const isActive = isNavigationItemActive(pathname, item.to)

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={() =>
                    [
                      'mobile-nav-item flex flex-col items-center gap-0.5 rounded-xl px-1.5 py-2 text-[10px] font-medium',
                      isActive
                        ? 'bg-(color:--accent-soft) text-(color:--accent-strong)'
                        : 'text-(color:--text-muted)',
                    ].join(' ')
                  }
                >
                  <Icon className="h-[17px] w-[17px]" />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </div>
        </nav>
      </div>
    </div>
  )
}

export default MainLayout
