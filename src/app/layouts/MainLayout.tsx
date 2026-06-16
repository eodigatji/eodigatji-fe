import {
  BadgeHelp,
  Bell,
  MapPinned,
  Search,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../features/auth/store/authStore'
import { useNotificationStore } from '../../features/notifications/store/notificationStore'

type NavigationItem = {
  badgeCount?: number
  icon: LucideIcon
  label: string
  to: string
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

function isPostEditPath(pathname: string) {
  return /^\/posts\/\d+\/edit$/.test(pathname)
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
      isPostDetailPath(pathname) ||
      isPostEditPath(pathname)
    )
  }

  if (itemTo === '/notifications') {
    return pathname === '/notifications'
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

function getHeaderTitle(pathname: string) {
  if (pathname === '/') {
    return '메인 지도'
  }

  if (pathname.startsWith('/posts')) {
    return '분실물 찾기'
  }

  if (pathname.startsWith('/locations')) {
    return '보관 장소'
  }

  if (pathname === '/notifications') {
    return '알림'
  }

  if (pathname === '/mypage') {
    return '내 정보'
  }

  if (pathname === '/api-status') {
    return '이용 안내'
  }

  return '어디갔지'
}

function formatBadgeCount(count: number) {
  if (count > 9) {
    return '9+'
  }

  return String(count)
}

function MainLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const unreadCount = useNotificationStore(
    (state) => state.items.filter((item) => !item.isRead).length,
  )
  const { pathname } = useLocation()

  const primaryNavigation: NavigationItem[] = isAuthenticated
    ? [
        { to: '/', label: '홈', icon: MapPinned },
        { to: '/locations', label: '장소', icon: MapPinned },
        { to: '/posts', label: '찾기', icon: Search },
        {
          to: '/notifications',
          label: '알림',
          icon: Bell,
          badgeCount: unreadCount,
        },
        { to: '/mypage', label: '내정보', icon: UserRound },
      ]
    : [
        { to: '/', label: '홈', icon: MapPinned },
        { to: '/auth/login', label: '로그인', icon: ShieldCheck },
        { to: '/locations', label: '장소', icon: MapPinned },
        { to: '/posts', label: '찾기', icon: Search },
        { to: '/api-status', label: '안내', icon: BadgeHelp },
      ]

  const headerTitle = getHeaderTitle(pathname)

  return (
    <div className="mobile-frame-app min-h-screen bg-(--surface-base) text-(--text-strong)">
      <div className="mobile-frame-shell mx-auto min-h-screen">
        <header className="sticky top-0 z-30 border-b border-white/70 bg-white/92 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3 px-3 py-3">
            <div className="min-w-0">
              <NavLink
                to="/"
                className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] text-(--accent-strong)"
              >
                <MapPinned className="h-3.5 w-3.5" />
                EODIGATJI
              </NavLink>
              <p className="mt-1 truncate text-[18px] font-semibold">
                {headerTitle}
              </p>
            </div>

            {isAuthenticated ? (
              <NavLink
                to="/notifications"
                className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-(--border-subtle) bg-white"
                aria-label="알림 보기"
              >
                <Bell className="h-4.5 w-4.5" />
                {unreadCount ? (
                  <span className="absolute -top-1 -right-0.5 rounded-full bg-(--accent-strong) px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {formatBadgeCount(unreadCount)}
                  </span>
                ) : null}
              </NavLink>
            ) : (
              <NavLink
                to="/auth/login"
                className="mobile-topbar-button inline-flex shrink-0 items-center gap-2 rounded-full bg-(color:--accent-strong) px-3.5 py-2.5 text-[13px] font-semibold text-[color:#fff] shadow-(--shadow-accent)"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>로그인</span>
              </NavLink>
            )}
          </div>
        </header>

        <main className="min-w-0 px-3 py-4 pb-24">
          <Outlet />
        </main>

        <nav className="mobile-frame-bottom-nav fixed bottom-0 z-30 border-t border-(color:--border-subtle) bg-white shadow-[0_-10px_30px_-24px_rgba(19,34,56,0.35)]">
          <div className="grid grid-cols-5 gap-1 px-1.5 py-1.5">
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
                  <span className="relative">
                    <Icon className="h-[17px] w-[17px]" />
                    {item.badgeCount ? (
                      <span className="absolute -top-1.5 -right-2 rounded-full bg-(--accent-strong) px-1 py-0.5 text-[9px] font-semibold leading-none text-white">
                        {formatBadgeCount(item.badgeCount)}
                      </span>
                    ) : null}
                  </span>
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
