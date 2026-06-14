import { ArrowRight, LogIn, MapPinned } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../features/auth/store/authStore'
import {
  getLocations,
  type LocationDto,
} from '../features/locations/api/locations'
import NaverLocationMap from '../features/locations/components/NaverLocationMap'
import {
  formatCoordinateValue,
  hasLocationCoordinates,
} from '../features/locations/lib/locationCoordinates'
import {
  getPost,
  getPosts,
  type PostDetailDto,
} from '../features/posts/api/posts'
import SectionPanel from '../shared/components/ui/SectionPanel'
import { getApiErrorMessage } from '../shared/utils/getApiErrorMessage'

const HOME_POST_PAGE_SIZE = 50

type LocationDashboardItem = LocationDto & {
  itemCount: number
  recentPosts: PostDetailDto[]
}

async function getAllPostDetails() {
  let page = 0
  let totalPages = 1
  const postIds: number[] = []

  while (page < totalPages) {
    const response = await getPosts({
      page,
      size: HOME_POST_PAGE_SIZE,
      sort: 'createdAt,DESC',
    })

    postIds.push(...response.content.map((post) => post.id))
    totalPages = Math.max(response.totalPages, 1)
    page += 1
  }

  const uniquePostIds = [...new Set(postIds)]
  const settledPosts = await Promise.allSettled(
    uniquePostIds.map((postId) => getPost(postId)),
  )

  return settledPosts.flatMap((result) =>
    result.status === 'fulfilled' ? [result.value] : [],
  )
}

function HomePage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const [locations, setLocations] = useState<LocationDto[]>([])
  const [posts, setPosts] = useState<PostDetailDto[]>([])
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(
    null,
  )
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadDashboard = useCallback(async () => {
    if (!isAuthenticated) {
      return
    }

    setLoading(true)
    setErrorMessage(null)

    try {
      const [locationsResult, postsResult] = await Promise.allSettled([
        getLocations(),
        getAllPostDetails(),
      ])

      const nextLocations =
        locationsResult.status === 'fulfilled' ? locationsResult.value : []
      const nextPosts =
        postsResult.status === 'fulfilled' ? postsResult.value : []

      setLocations(nextLocations)
      setPosts(nextPosts)

      if (locationsResult.status === 'rejected') {
        setErrorMessage(
          getApiErrorMessage(
            locationsResult.reason,
            '메인 지도에 필요한 보관 장소 정보를 불러오지 못했어요.',
          ),
        )
        return
      }

      if (postsResult.status === 'rejected') {
        setErrorMessage(
          getApiErrorMessage(
            postsResult.reason,
            '보관 장소는 불러왔지만 물품 수 집계는 아직 준비하지 못했어요.',
          ),
        )
      }
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      if (!isAuthenticated) {
        return
      }

      void loadDashboard()
    }, 0)

    return () => window.clearTimeout(timerId)
  }, [isAuthenticated, loadDashboard])

  const postsByLocation = useMemo(() => {
    const groupedPosts = new Map<number, PostDetailDto[]>()
    const sortedPosts = [...posts].sort(
      (left, right) =>
        new Date(right.createdAt).getTime() -
        new Date(left.createdAt).getTime(),
    )

    for (const post of sortedPosts) {
      const bucket = groupedPosts.get(post.locationId)

      if (bucket) {
        bucket.push(post)
      } else {
        groupedPosts.set(post.locationId, [post])
      }
    }

    return groupedPosts
  }, [posts])

  const locationItems = useMemo<LocationDashboardItem[]>(
    () =>
      locations.map((location) => ({
        ...location,
        itemCount: postsByLocation.get(location.id)?.length ?? 0,
        recentPosts: postsByLocation.get(location.id) ?? [],
      })),
    [locations, postsByLocation],
  )

  const mappedLocations = useMemo(
    () =>
      locationItems.filter(
        (
          location,
        ): location is LocationDashboardItem & {
          latitude: number
          longitude: number
        } => hasLocationCoordinates(location),
      ),
    [locationItems],
  )

  const selectedLocation =
    locationItems.find((location) => location.id === selectedLocationId) ??
    locationItems[0] ??
    null

  const highlightedLocations = useMemo(
    () =>
      [...locationItems]
        .sort((left, right) => {
          if (right.itemCount !== left.itemCount) {
            return right.itemCount - left.itemCount
          }

          return left.name.localeCompare(right.name)
        })
        .slice(0, 4),
    [locationItems],
  )

  if (!isAuthenticated) {
    return (
      <div className="space-y-5 pb-20 xl:pb-6">
        <SectionPanel className="overflow-hidden p-0">
          <div className="map-stage-header p-6">
            <p className="text-sm font-semibold text-(color:--accent-strong)">
              Map First Home
            </p>
            <h1 className="mt-2 text-3xl leading-tight font-semibold">
              로그인 후 메인에서 보관 장소와 물품 현황을 바로 확인하세요.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-(color:--text-muted)">
              메인 화면은 지도를 중심으로 구성하고, 장소 등록이나 분실물 찾기
              같은 작업은 하단 네비게이션으로 이어가도록 정리했습니다.
            </p>
          </div>
          <div className="grid gap-4 p-4">
            <div className="location-map-frame min-h-[320px]">
              <div className="location-map-overlay">
                <p className="text-sm font-medium text-(color:--text-strong)">
                  로그인하면 지도 위 보관 장소 마커와 장소별 물품 수를 바로 볼
                  수 있어요.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/auth/login"
                className="inline-flex items-center gap-2 rounded-full bg-(color:--accent-strong) px-4 py-2.5 text-sm font-semibold text-white shadow-(--shadow-accent)"
              >
                <LogIn className="h-4 w-4" />
                로그인하기
              </Link>
              <Link
                to="/auth/signup/email"
                className="inline-flex items-center gap-2 rounded-full border border-(color:--border-subtle) bg-white px-4 py-2.5 text-sm font-semibold"
              >
                회원가입 시작
              </Link>
            </div>
          </div>
        </SectionPanel>
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-20 xl:pb-6">
      <section className="grid gap-5">
        <div className="overflow-hidden rounded-[32px] bg-(color:--surface-card) shadow-(--shadow-soft)">
          <div className="map-stage-header p-5">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold text-(color:--accent-strong)">
                Main Map
              </p>
              <h1 className="mt-2 text-[1.95rem] leading-[1.12] font-semibold tracking-tight">
                보관 장소와 물품 현황을 지도에서 바로 확인하세요.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-(color:--text-muted)">
                장소별 물품 수를 마커로 보고, 선택한 장소의 최근 물품까지 바로
                확인할 수 있어요.
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-2.5">
              {[
                `보관 장소 ${locations.length}곳`,
                `지도 표시 ${mappedLocations.length}곳`,
                `물품 ${posts.length}건`,
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/80 bg-white/80 px-2.5 py-1 text-xs font-medium text-(color:--text-muted)"
                >
                  {item}
                </span>
              ))}
            </div>

            {errorMessage ? (
              <div className="mt-4 rounded-(--radius-card) border border-(color:--danger-border) bg-(color:--danger-soft) px-4 py-3 text-sm text-(color:--danger-strong)">
                {errorMessage}
              </div>
            ) : null}
          </div>

          <div className="border-t border-(color:--border-subtle) p-5">
            <div className="flex items-center gap-2">
              <MapPinned className="h-4 w-4 text-(color:--accent-strong)" />
              <h2 className="text-base font-semibold">선택한 보관 장소</h2>
            </div>

            {selectedLocation ? (
              <div className="mt-4 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">
                      {selectedLocation.name}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-(color:--text-muted)">
                      {selectedLocation.detail}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-(color:--surface-soft) px-3 py-1 text-xs font-semibold text-(color:--text-muted)">
                      {selectedLocation.number}
                    </span>
                    <span className="rounded-full bg-(color:--accent-soft) px-3 py-1 text-xs font-semibold text-(color:--accent-strong)">
                      물품 {selectedLocation.itemCount}건
                    </span>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-(--radius-card) bg-(color:--surface-soft) p-3.5">
                    <p className="text-[11px] font-semibold tracking-[0.12em] text-(color:--text-muted) uppercase">
                      보관 번호
                    </p>
                    <p className="mt-2 text-sm font-semibold">
                      {selectedLocation.number}
                    </p>
                  </div>
                  <div className="rounded-(--radius-card) bg-(color:--surface-soft) p-3.5">
                    <p className="text-[11px] font-semibold tracking-[0.12em] text-(color:--text-muted) uppercase">
                      위도
                    </p>
                    <p className="mt-2 text-sm font-semibold">
                      {formatCoordinateValue(selectedLocation.latitude)}
                    </p>
                  </div>
                  <div className="rounded-(--radius-card) bg-(color:--surface-soft) p-3.5">
                    <p className="text-[11px] font-semibold tracking-[0.12em] text-(color:--text-muted) uppercase">
                      경도
                    </p>
                    <p className="mt-2 text-sm font-semibold">
                      {formatCoordinateValue(selectedLocation.longitude)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">이 장소의 최근 물품</p>
                    <Link
                      to={`/locations/${selectedLocation.id}`}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-(color:--accent-strong)"
                    >
                      장소 상세
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>

                  {selectedLocation.recentPosts.length ? (
                    <div className="grid gap-2">
                      {selectedLocation.recentPosts.slice(0, 3).map((post) => (
                        <Link
                          key={post.id}
                          to={`/posts/${post.id}`}
                          className="flex items-center justify-between rounded-(--radius-card) border border-(color:--border-subtle) px-4 py-3 text-sm font-medium transition hover:bg-(color:--surface-soft)"
                        >
                          <span className="min-w-0 truncate">{post.title}</span>
                          <span className="shrink-0 text-(color:--text-muted)">
                            {post.category}
                          </span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-(color:--text-muted)">
                      아직 이 장소에 연결된 물품이 없어요.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-(color:--text-muted)">
                지도의 마커를 선택하면 보관 장소 정보와 연결된 물품 목록을 바로
                볼 수 있어요.
              </p>
            )}
          </div>

          <div className="border-t border-(color:--border-subtle) p-4">
            <NaverLocationMap
              className="min-h-[540px]"
              markers={mappedLocations.map((location) => ({
                id: location.id,
                name: location.name,
                detail: location.detail,
                itemCount: location.itemCount,
                number: location.number,
                latitude: location.latitude,
                longitude: location.longitude,
              }))}
              activeMarkerId={selectedLocation?.id ?? null}
              selectedCoordinates={
                selectedLocation && hasLocationCoordinates(selectedLocation)
                  ? selectedLocation
                  : null
              }
              onMarkerSelect={(marker) => setSelectedLocationId(marker.id)}
              emptyMessage={
                loading
                  ? '메인 지도를 준비하고 있어요.'
                  : '좌표가 등록된 보관 장소가 아직 없어요.'
              }
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        {highlightedLocations.map((location) => (
          <button
            key={location.id}
            type="button"
            onClick={() => setSelectedLocationId(location.id)}
            className="rounded-(--radius-panel) border border-(color:--border-subtle) bg-(color:--surface-card) p-4 text-left shadow-(--shadow-soft) transition hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold">{location.name}</p>
                <p className="mt-2 text-sm leading-6 text-(color:--text-muted)">
                  {location.detail}
                </p>
              </div>
              <span className="rounded-full bg-(color:--accent-soft) px-3 py-1 text-xs font-semibold text-(color:--accent-strong)">
                {location.itemCount}건
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-(color:--text-muted)">
              <span>
                좌표 {hasLocationCoordinates(location) ? '등록 완료' : '미등록'}
              </span>
              <span>지도에서 보기</span>
            </div>
          </button>
        ))}
      </section>
    </div>
  )
}

export default HomePage
