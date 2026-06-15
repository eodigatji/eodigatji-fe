import { CalendarDays, Filter, MapPinned, Plus, Search } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react'
import { Link } from 'react-router-dom'
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
import PostCard from '../features/posts/components/PostCard'
import {
  getPostCategoryLabel,
  POST_CATEGORY_OPTIONS,
} from '../features/posts/constants'
import {
  getAllPostDetails,
  getPostCountMap,
} from '../features/posts/lib/postCounts'
import type { PostSummary } from '../features/posts/types'
import {
  searchPostsByCategory,
  searchPostsByDate,
  searchPostsByKeyword,
  searchPostsByPlace,
  type SearchResultDto,
} from '../features/search/api/search'
import SectionPanel from '../shared/components/ui/SectionPanel'
import { getApiErrorMessage } from '../shared/utils/getApiErrorMessage'

type SearchMode = 'all' | 'keyword' | 'category' | 'date' | 'place'

const SEARCH_MODES: Array<{
  id: SearchMode
  label: string
  placeholder: string
}> = [
  { id: 'all', label: '전체', placeholder: '' },
  { id: 'keyword', label: '키워드', placeholder: '예: 지갑, 학생증' },
  { id: 'category', label: '카테고리', placeholder: '예: 전자기기' },
  { id: 'date', label: '날짜', placeholder: '예: 2026-06-08' },
  { id: 'place', label: '장소', placeholder: '예: 학생회관, 도서관' },
]

const POSTS_PAGE_SIZE = 50

function mapSearchResultToPostSummary(
  result: SearchResultDto,
  locationsById: Map<number, LocationDto>,
): PostSummary {
  const location = locationsById.get(result.locationId)

  return {
    id: result.postId,
    title: result.title,
    category: getPostCategoryLabel(result.category),
    place: location?.name ?? `장소 #${result.locationId}`,
    date: '날짜 정보 없음',
    timeSlot: '시간 정보 없음',
    description: result.description,
    status: result.type === 'FOUND' ? 'FOUND' : 'LOST',
    comments: 0,
  }
}

function mapPostDetailToSearchResult(post: PostDetailDto): SearchResultDto {
  return {
    postId: post.id,
    locationId: post.locationId,
    title: post.title,
    description: post.description,
    type: post.type,
    category: post.category,
  }
}

function PostsPage() {
  const [searchMode, setSearchMode] = useState<SearchMode>('all')
  const [searchValue, setSearchValue] = useState('')
  const [results, setResults] = useState<SearchResultDto[]>([])
  const [locations, setLocations] = useState<LocationDto[]>([])
  const [postCountMap, setPostCountMap] = useState<Map<number, number>>(new Map())
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [bootLoading, setBootLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  const loadLocations = useCallback(async () => {
    try {
      const nextLocations = await getLocations()
      setLocations(nextLocations)
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          '보관 장소 목록을 불러오지 못했어요. 장소 이름 기준 결과만 먼저 보여드릴게요.',
        ),
      )
    } finally {
      setBootLoading(false)
    }
  }, [])

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadLocations()
    }, 0)

    return () => window.clearTimeout(timerId)
  }, [loadLocations])

  const locationsById = useMemo(
    () => new Map(locations.map((location) => [location.id, location])),
    [locations],
  )

  const postCards = useMemo(
    () =>
      results.map((result) =>
        mapSearchResultToPostSummary(result, locationsById),
      ),
    [locationsById, results],
  )

  const mappedResults = useMemo(
    () =>
      results
        .map((result) => {
          const location = locationsById.get(result.locationId)

          if (!location || !hasLocationCoordinates(location)) {
            return null
          }

          return {
            ...result,
            location,
          }
        })
        .filter(
          (
            result,
          ): result is SearchResultDto & {
            location: LocationDto & { latitude: number; longitude: number }
          } => result !== null,
        ),
    [locationsById, results],
  )

  const selectedResult =
    results.find((result) => result.postId === selectedPostId) ?? null
  const selectedResultLocation = selectedResult
    ? (locationsById.get(selectedResult.locationId) ?? null)
    : null

  useEffect(() => {
    if (!results.length) {
      setSelectedPostId(null)
      return
    }

    setSelectedPostId((current) => {
      if (current && results.some((result) => result.postId === current)) {
        return current
      }

      return results[0].postId
    })
  }, [results])

  useEffect(() => {
    let cancelled = false

    async function loadPostCounts() {
      try {
        const posts = await getAllPostDetails()

        if (cancelled) {
          return
        }

        setPostCountMap(getPostCountMap(posts))
      } catch {
        if (!cancelled) {
          setPostCountMap(new Map())
        }
      }
    }

    void loadPostCounts()

    return () => {
      cancelled = true
    }
  }, [])

  const loadAllResults = useCallback(async () => {
    let page = 0
    let totalPages = 1
    const postIds: number[] = []

    while (page < totalPages) {
      const response = await getPosts({
        page,
        size: POSTS_PAGE_SIZE,
        sort: 'createdAt,DESC',
      })

      postIds.push(...response.content.map((post) => post.id))
      totalPages = Math.max(response.totalPages, 1)
      page += 1
    }

    const uniquePostIds = [...new Set(postIds)]
    const postResults = await Promise.allSettled(
      uniquePostIds.map((id) => getPost(id)),
    )

    const fulfilledPosts = postResults.flatMap((result) =>
      result.status === 'fulfilled' ? [result.value] : [],
    )

    setPostCountMap(getPostCountMap(fulfilledPosts))

    return fulfilledPosts.map((post) => mapPostDetailToSearchResult(post))
  }, [])

  const executeSearch = useCallback(
    async (mode: SearchMode, rawValue: string) => {
      if (mode !== 'all' && !rawValue.trim()) {
        throw new Error('검색어를 입력해주세요.')
      }

      switch (mode) {
        case 'all':
          return loadAllResults()
        case 'keyword':
          return searchPostsByKeyword(rawValue.trim())
        case 'category':
          return searchPostsByCategory(rawValue.trim())
        case 'date':
          return searchPostsByDate(rawValue.trim())
        case 'place':
          return searchPostsByPlace(rawValue.trim())
      }
    },
    [loadAllResults],
  )

  useEffect(() => {
    if (searchMode !== 'all') {
      return
    }

    let cancelled = false

    async function loadInitialResults() {
      setLoading(true)
      setErrorMessage(null)

      try {
        const nextResults = await executeSearch('all', '')

        if (cancelled) {
          return
        }

        setResults(nextResults)
        setSearched(true)
      } catch (error) {
        if (cancelled) {
          return
        }

        setErrorMessage(
          getApiErrorMessage(error, '검색 결과를 불러오지 못했어요.'),
        )
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadInitialResults()

    return () => {
      cancelled = true
    }
  }, [executeSearch, searchMode])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setLoading(true)
    setErrorMessage(null)

    try {
      const nextResults = await executeSearch(searchMode, searchValue)
      setResults(nextResults)
      setSearched(true)
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, '검색 결과를 불러오지 못했어요.'),
      )
    } finally {
      setLoading(false)
    }
  }

  const emptyMapMessage = bootLoading
    ? '장소 정보를 준비하는 중이에요.'
    : searched
      ? searchMode === 'all'
        ? '지도에 표시할 수 있는 전체 게시글 좌표가 아직 없어요.'
        : '지도에 표시할 수 있는 좌표 결과가 아직 없어요.'
      : '검색을 시작하면 관련 장소를 지도에 함께 보여드릴게요.'

  return (
    <div className="space-y-5 pb-20 xl:pb-6">
      <section className="map-command-grid grid gap-5">
        <div className="overflow-hidden rounded-[32px] border border-(--border-subtle) bg-[color:var(--surface-card)] shadow-[var(--shadow-soft)]">
          <div className="map-stage-header p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold text-(--accent-strong)">
                  Lost & Found Search
                </p>
                <h1 className="mt-2 text-[2.05rem] leading-[1.08] font-semibold">
                  분실물 검색 결과를 장소와 함께 살펴보세요
                </h1>
                <p className="mt-3 text-sm leading-6 text-(--text-muted)">
                  전체 게시글 보기부터 키워드, 카테고리, 날짜, 장소 검색까지 한 곳에서
                  이어집니다. 좌표가 등록된 장소는 지도에서도 바로 비교할 수 있어요.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  to="/posts/new"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-(--accent-strong) px-3.5 py-2.5 text-center text-[13px] font-semibold text-white shadow-[var(--shadow-accent)]"
                >
                  <Plus className="h-4 w-4 text-white" />
                  <p className="text-white">게시글 등록</p>
                </Link>
                <Link
                  to="/api-status"
                  className="inline-flex items-center gap-2 rounded-full border border-(--border-subtle) bg-white px-3.5 py-2.5 text-[13px] font-semibold"
                >
                  <Filter className="h-4 w-4" />
                  이용 가이드
                </Link>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                {SEARCH_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => {
                      setSearchMode(mode.id)
                      setSearchValue(mode.id === 'category' ? 'ELECTRONICS' : '')
                      setErrorMessage(null)
                    }}
                    className={[
                      'rounded-full px-3 py-2 text-[13px] font-medium transition',
                      searchMode === mode.id
                        ? 'bg-[color:var(--accent-soft)] text-(--accent-strong)'
                        : 'border border-white/80 bg-white/90 text-(--text-muted)',
                    ].join(' ')}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              {searchMode !== 'all' ? (
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_140px]">
                  <div className="flex items-center gap-3 rounded-full border border-(--border-subtle) bg-white px-4 py-3 shadow-[0_10px_24px_-22px_rgba(19,34,56,0.5)] transition focus-within:border-[color:var(--border-accent)] focus-within:ring-2 focus-within:ring-[color:var(--accent-soft)]">
                    {searchMode === 'date' ? (
                      <CalendarDays className="h-4 w-4 shrink-0 text-(--text-muted)" />
                    ) : searchMode === 'place' ? (
                      <MapPinned className="h-4 w-4 shrink-0 text-(--text-muted)" />
                    ) : (
                      <Search className="h-4 w-4 shrink-0 text-(--text-muted)" />
                    )}

                    {searchMode === 'category' ? (
                      <select
                        value={searchValue}
                        onChange={(event) => setSearchValue(event.target.value)}
                        className="w-full bg-transparent text-sm outline-none"
                      >
                        <option value="">카테고리를 선택해 주세요</option>
                        {POST_CATEGORY_OPTIONS.map((category) => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={searchValue}
                        onChange={(event) => setSearchValue(event.target.value)}
                        className="w-full bg-transparent text-sm outline-none placeholder:text-[13px] placeholder:text-(--text-muted)"
                        placeholder={
                          SEARCH_MODES.find((mode) => mode.id === searchMode)
                            ?.placeholder
                        }
                      />
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || bootLoading}
                    className="rounded-full bg-(--accent-strong) px-3.5 py-3 text-[13px] font-semibold text-white shadow-[var(--shadow-accent)] disabled:opacity-60"
                  >
                    {loading ? '검색 중...' : '지도 표시'}
                  </button>
                </div>
              ) : null}
            </form>
          </div>

          <div className="p-4">
            <NaverLocationMap
              className="min-h-[520px]"
              markers={mappedResults.map((result) => ({
                id: result.postId,
                name: result.title,
                detail: result.location.name,
                itemCount: postCountMap.get(result.locationId) ?? 0,
                number: result.location.number,
                latitude: result.location.latitude,
                longitude: result.location.longitude,
              }))}
              activeMarkerId={selectedPostId}
              selectedCoordinates={
                selectedResultLocation &&
                hasLocationCoordinates(selectedResultLocation)
                  ? selectedResultLocation
                  : null
              }
              onMarkerSelect={(marker) => setSelectedPostId(marker.id)}
              emptyMessage={emptyMapMessage}
            />
          </div>
        </div>

        <div className="space-y-5">
          <SectionPanel>
            <div className="flex items-center gap-2">
              <MapPinned className="h-4 w-4 text-(--accent-strong)" />
              <h2 className="text-base font-semibold">선택한 글 요약</h2>
            </div>

            {selectedResult ? (
              <div className="mt-4 space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold">
                        {selectedResultLocation?.name ??
                          `장소 #${selectedResult.locationId}`}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-(--text-muted)">
                        {selectedResultLocation?.detail ??
                          '연결된 장소 상세 정보가 없어요.'}
                      </p>
                    </div>
                    <span className="rounded-full bg-(--surface-soft) px-3 py-1 text-xs font-semibold text-(--text-muted)">
                      {selectedResultLocation?.number ?? '미지정'}
                    </span>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[var(--radius-card)] bg-(--surface-soft) p-3.5">
                    <p className="text-[11px] font-semibold tracking-[0.12em] text-(--text-muted) uppercase">
                      위도
                    </p>
                    <p className="mt-2 text-sm font-semibold">
                      {formatCoordinateValue(selectedResultLocation?.latitude)}
                    </p>
                  </div>
                  <div className="rounded-[var(--radius-card)] bg-(--surface-soft) p-3.5">
                    <p className="text-[11px] font-semibold tracking-[0.12em] text-(--text-muted) uppercase">
                      경도
                    </p>
                    <p className="mt-2 text-sm font-semibold">
                      {formatCoordinateValue(selectedResultLocation?.longitude)}
                    </p>
                  </div>
                </div>

                <PostCard
                  post={mapSearchResultToPostSummary(selectedResult, locationsById)}
                  to={`/posts/${selectedResult.postId}`}
                  variant="compact"
                />
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-(--text-muted)">
                검색 결과를 선택하면 연결된 장소와 게시글 요약을 여기에서 바로
                확인할 수 있어요.
              </p>
            )}
          </SectionPanel>

          <SectionPanel>
            <h2 className="text-base font-semibold">검색 현황</h2>
            {errorMessage ? (
              <div className="mt-4 rounded-[var(--radius-card)] border border-[color:var(--danger-border)] bg-[color:var(--danger-soft)] px-4 py-3 text-sm leading-6 text-[color:var(--danger-strong)]">
                {errorMessage}
              </div>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[var(--radius-card)] bg-(--surface-soft) p-3.5">
                  <p className="text-[11px] font-semibold tracking-[0.12em] text-(--text-muted) uppercase">
                    검색 결과 수
                  </p>
                  <p className="mt-2 text-xl font-semibold">{results.length}</p>
                </div>
                <div className="rounded-[var(--radius-card)] bg-(--surface-soft) p-3.5">
                  <p className="text-[11px] font-semibold tracking-[0.12em] text-(--text-muted) uppercase">
                    지도 표시 가능
                  </p>
                  <p className="mt-2 text-xl font-semibold">
                    {mappedResults.length}
                  </p>
                </div>
              </div>
            )}
          </SectionPanel>
        </div>
      </section>

      <section className="grid gap-3">
        {postCards.map((post) => (
          <div
            key={post.id}
            onMouseEnter={() => setSelectedPostId(post.id)}
            className="cursor-pointer"
          >
            <PostCard post={post} to={`/posts/${post.id}`} />
          </div>
        ))}

        {!bootLoading && searched && !postCards.length ? (
          <SectionPanel>
            <p className="text-sm font-semibold">
              {searchMode === 'all' ? '게시글이 아직 없어요.' : '검색 결과가 없어요.'}
            </p>
            <p className="mt-2 text-sm leading-6 text-(--text-muted)">
              {searchMode === 'all'
                ? '첫 게시글이 등록되면 여기에서 전체 목록을 바로 확인할 수 있어요.'
                : '검색 조건을 조금 바꿔서 다시 시도해 보세요. 장소명이나 카테고리를 바꾸면 더 쉽게 찾을 수 있어요.'}
            </p>
          </SectionPanel>
        ) : null}
      </section>
    </div>
  )
}

export default PostsPage
