import { BellOff, FolderSearch, MapPinned, ShieldCheck, UserRound } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiScopes } from '../app/data/prototype'
import QuickActionCard from '../features/home/components/QuickActionCard'
import {
  getLocations,
  type LocationDto,
} from '../features/locations/api/locations'
import LocationCard from '../features/locations/components/LocationCard'
import SectionHeader from '../shared/components/ui/SectionHeader'
import SectionPanel from '../shared/components/ui/SectionPanel'
import { getApiErrorMessage } from '../shared/utils/getApiErrorMessage'

const quickActions = [
  {
    title: '인증 흐름 확인',
    body: '학교 이메일 인증, 회원가입, 로그인, 토큰 재발급 흐름이 실제 API와 연결돼 있습니다.',
    to: '/auth/login',
    icon: ShieldCheck,
  },
  {
    title: '보관 장소 관리',
    body: '목록, 상세, 등록, 수정, 삭제까지 현재 스펙상 가장 안정적으로 연동되는 영역입니다.',
    to: '/locations',
    icon: MapPinned,
  },
  {
    title: '게시글 검색 / 댓글',
    body: '검색 엔드포인트를 직접 호출하고, 상세 화면에서는 댓글 목록과 작성/삭제를 검증할 수 있습니다.',
    to: '/posts',
    icon: FolderSearch,
  },
]

function HomePage() {
  const [locations, setLocations] = useState<LocationDto[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadLocations = useCallback(async () => {
    try {
      const nextLocations = await getLocations()
      setLocations(nextLocations.slice(0, 2))
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, '최근 보관 장소를 불러오지 못했습니다.'),
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadLocations()
    }, 0)

    return () => window.clearTimeout(timerId)
  }, [loadLocations])

  return (
    <div className="space-y-6">
      <section className="home-hero-surface overflow-hidden rounded-(--radius-panel) border border-(--border-subtle) p-5 shadow-(--shadow-soft) sm:p-8">
        <div className="home-hero-grid grid gap-6 lg:items-end">
          <div className="space-y-4">
            <span className="inline-flex rounded-full border border-(--border-accent) bg-(--accent-soft) px-3 py-1 text-xs font-semibold text-(--accent-strong)">
              API 스펙 기준 업데이트
            </span>
            <div className="space-y-3">
              <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
                지금 프로젝트는 인증, 보관 장소, 검색 호출, 댓글 기능부터 실제 API 기준으로 맞춰두었습니다.
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-(--text-muted) sm:text-base">
                백엔드 명세에 없는 기능은 연결된 것처럼 보이지 않게 정리했고, 현재 가능한
                화면부터 검증하기 쉽게 홈 구조를 다시 맞췄습니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/api-status"
                className="rounded-full bg-(--accent-strong) px-4 py-2 text-sm font-semibold text-white shadow-(--shadow-accent)"
              >
                API 현황 보기
              </Link>
              <Link
                to="/locations"
                className="rounded-full border border-(--border-subtle) bg-white px-4 py-2 text-sm font-semibold"
              >
                보관 장소 검증하기
              </Link>
            </div>
          </div>

          <div className="rounded-(--radius-card) border border-white/80 bg-white/80 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck className="h-4 w-4 text-(--accent-strong)" />
              현재 연결 상태
            </div>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-(--text-muted)">
              <li>인증은 이메일 발송, 코드 검증, 회원가입, 로그인까지 연결됨</li>
              <li>보관 장소는 목록, 상세, 등록, 수정, 삭제를 실제 API로 호출함</li>
              <li>게시글은 검색과 댓글만 연결되고 본문 CRUD는 아직 없음</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {quickActions.map((item) => (
          <QuickActionCard key={item.title} {...item} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.9fr)]">
        <SectionPanel>
          <SectionHeader
            title="현재 API 범위"
            description="API_SPEC_ANALYSIS.md 기준으로 화면을 다시 맞춰둔 상태입니다."
            action={
              <Link
                to="/api-status"
                className="text-sm font-semibold text-(--accent-strong)"
              >
                전체 보기
              </Link>
            }
          />

          <div className="mt-4 grid gap-3">
            {apiScopes.map((scope) => (
              <article
                key={scope.id}
                className="rounded-(--radius-card) border border-(--border-subtle) p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-base font-semibold">{scope.title}</h3>
                  <span
                    className={[
                      'rounded-full px-2.5 py-1 text-xs font-semibold',
                      scope.status === 'supported'
                        ? 'bg-(--found-soft) text-(--found-strong)'
                        : scope.status === 'partial'
                          ? 'bg-(--lost-soft) text-(--lost-strong)'
                          : 'bg-(--surface-soft) text-(--text-muted)',
                    ].join(' ')}
                  >
                    {scope.status === 'supported'
                      ? '지원'
                      : scope.status === 'partial'
                        ? '부분 지원'
                        : '준비 중'}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-(--text-muted)">
                  {scope.body}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {scope.endpoints.slice(0, 2).map((endpoint) => (
                    <span
                      key={endpoint}
                      className="rounded-full bg-(--surface-soft) px-2.5 py-1 text-xs font-medium text-(--text-muted)"
                    >
                      {endpoint}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </SectionPanel>

        <div className="grid gap-6">
          <SectionPanel>
            <SectionHeader
              title="최근 보관 장소"
              description="이 섹션은 실제 locations API를 호출합니다."
              action={
                <Link
                  to="/locations"
                  className="text-sm font-semibold text-(--accent-strong)"
                >
                  관리 화면
                </Link>
              }
            />

            {errorMessage ? (
              <div className="mt-4 rounded-(--radius-card) border border-(--danger-border) bg-(--danger-soft) px-4 py-3 text-sm text-(--danger-strong)">
                {errorMessage}
              </div>
            ) : null}

            {loading ? (
              <div className="mt-4 rounded-(--radius-card) bg-(--surface-soft) px-4 py-8 text-center text-sm text-(--text-muted)">
                보관 장소를 불러오는 중입니다...
              </div>
            ) : null}

            {!loading && locations.length > 0 ? (
              <div className="mt-4 space-y-3">
                {locations.map((location) => (
                  <LocationCard key={location.id} location={location} variant="compact" />
                ))}
              </div>
            ) : null}
          </SectionPanel>

          <SectionPanel>
            <SectionHeader title="아직 프로토인 화면" />
            <div className="mt-4 grid gap-3">
              {[
                {
                  title: '알림 페이지',
                  body: '알림 관련 엔드포인트가 현재 스펙에 없어 프로토 안내 화면으로 유지합니다.',
                  to: '/notifications',
                  icon: BellOff,
                },
                {
                  title: '마이페이지',
                  body: '내 활동, 포인트, 프로필 수정 API가 생기면 그때 실제 데이터로 전환합니다.',
                  to: '/mypage',
                  icon: UserRound,
                },
              ].map((item) => (
                <Link
                  key={item.title}
                  to={item.to}
                  className="rounded-(--radius-card) border border-(--border-subtle) p-4 transition hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-(--surface-soft) p-2">
                      <item.icon className="h-4 w-4 text-(--text-muted)" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="mt-1 text-sm leading-6 text-(--text-muted)">
                        {item.body}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </SectionPanel>
        </div>
      </section>
    </div>
  )
}

export default HomePage
