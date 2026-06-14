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
import PostCard from '../features/posts/components/PostCard'
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

type SearchMode = 'keyword' | 'category' | 'date' | 'place'

const searchModes: Array<{
  id: SearchMode
  label: string
  placeholder: string
}> = [
  { id: 'keyword', label: '키워드', placeholder: '예: 지갑, 학생증' },
  { id: 'category', label: '카테고리', placeholder: '예: ELECTRONICS' },
  { id: 'date', label: '날짜', placeholder: '예: 2026-06-08' },
  { id: 'place', label: '장소', placeholder: '예: 학생회관, 도서관' },
]

const categoryOptions = [
  'ELECTRONICS',
  'WALLET',
  'ID_CARD',
  'BAG',
  'CLOTHING',
  'ETC',
]

function mapSearchResultToPostSummary(
  result: SearchResultDto,
  locationsById: Map<number, LocationDto>,
): PostSummary {
  const location = locationsById.get(result.locationId)

  return {
    id: result.postId,
    title: result.title,
    category: result.category,
    place: location?.name ?? `장소 #${result.locationId}`,
    date: '날짜 정보 없음',
    timeSlot: '시간 정보 없음',
    description: result.description,
    status: result.type === 'FOUND' ? 'FOUND' : 'LOST',
    comments: 0,
  }
}

function PostsPage() {
  const [searchMode, setSearchMode] = useState<SearchMode>('keyword')
  const [searchValue, setSearchValue] = useState('')
  const [results, setResults] = useState<SearchResultDto[]>([])
  const [locations, setLocations] = useState<LocationDto[]>([])
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
          '보관 장소 목록을 불러오지 못했어요. 장소 이름 기준으로만 결과를 먼저 보여드릴게요.',
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!searchValue.trim()) {
      setErrorMessage('검색어를 입력해 주세요.')
      return
    }

    setLoading(true)
    setErrorMessage(null)

    try {
      let nextResults: SearchResultDto[] = []

      switch (searchMode) {
        case 'keyword':
          nextResults = await searchPostsByKeyword(searchValue.trim())
          break
        case 'category':
          nextResults = await searchPostsByCategory(searchValue.trim())
          break
        case 'date':
          nextResults = await searchPostsByDate(searchValue.trim())
          break
        case 'place':
          nextResults = await searchPostsByPlace(searchValue.trim())
          break
      }

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

  return (
    <div className="space-y-6 pb-20 xl:pb-6">
      <section className="map-command-grid grid gap-6">
        <div className="overflow-hidden rounded-[32px] border border-(--border-subtle) bg-[color:var(--surface-card)] shadow-[var(--shadow-soft)]">
          <div className="map-stage-header p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold text-(--accent-strong)">
                  Search Flow on Map
                </p>
                <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
                  분실물 검색 결과를 장소와 함께 살펴보세요
                </h1>
                <p className="mt-3 text-sm leading-7 text-(--text-muted)">
                  검색은 상단에서 시작하고, 결과는 지도와 카드에서 함께 비교할
                  수 있어요. 좌표가 등록된 장소가 있으면 지도에서도 바로 위치를
                  확인할 수 있습니다.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  to="/posts/new"
                  className="inline-flex items-center gap-2 rounded-full bg-(--accent-strong) px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-accent)]"
                >
                  <Plus className="h-4 w-4 text-white" />
                  <p className="text-white">분실물 등록</p>
                </Link>
                <Link
                  to="/api-status"
                  className="inline-flex items-center gap-2 rounded-full border border-(--border-subtle) bg-white px-4 py-2 text-sm font-semibold"
                >
                  <Filter className="h-4 w-4" />
                  이용 가이드 보기
                </Link>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="flex flex-wrap gap-2">
                {searchModes.map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => {
                      setSearchMode(mode.id)
                      setSearchValue(
                        mode.id === 'category' ? 'ELECTRONICS' : '',
                      )
                      setErrorMessage(null)
                    }}
                    className={[
                      'rounded-full px-3 py-2 text-sm font-medium transition',
                      searchMode === mode.id
                        ? 'bg-[color:var(--accent-soft)] text-(--accent-strong)'
                        : 'border border-white/80 bg-white/90 text-(--text-muted)',
                    ].join(' ')}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_160px]">
                <div className="flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-4 py-3">
                  {searchMode === 'date' ? (
                    <CalendarDays className="h-4 w-4 text-(--text-muted)" />
                  ) : searchMode === 'place' ? (
                    <MapPinned className="h-4 w-4 text-(--text-muted)" />
                  ) : (
                    <Search className="h-4 w-4 text-(--text-muted)" />
                  )}

                  {searchMode === 'category' ? (
                    <select
                      value={searchValue}
                      onChange={(event) => setSearchValue(event.target.value)}
                      className="w-full bg-transparent text-sm outline-none"
                    >
                      <option value="">카테고리를 선택해 주세요</option>
                      {categoryOptions.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={searchValue}
                      onChange={(event) => setSearchValue(event.target.value)}
                      className="w-full bg-transparent text-sm outline-none placeholder:text-(--text-muted)"
                      placeholder={
                        searchModes.find((mode) => mode.id === searchMode)
                          ?.placeholder
                      }
                    />
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || bootLoading}
                  className="rounded-full bg-(--accent-strong) px-4 py-3 text-sm font-semibold text-white shadow-[var(--shadow-accent)] disabled:opacity-60"
                >
                  {loading ? '검색 중...' : '지도에 표시하기'}
                </button>
              </div>
            </form>
          </div>

          <div className="p-4">
            <NaverLocationMap
              className="min-h-[680px]"
              markers={mappedResults.map((result) => ({
                id: result.postId,
                name: result.title,
                detail: result.location.name,
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
              emptyMessage={
                bootLoading
                  ? '장소 정보를 준비하는 중이에요.'
                  : searched
                    ? '지도에 표시할 수 있는 좌표가 아직 없어요.'
                    : '검색을 시작하면 관련 장소를 지도에 함께 보여드릴게요.'
              }
            />
          </div>
        </div>

        <div className="space-y-6">
          <SectionPanel>
            <div className="flex items-center gap-2">
              <MapPinned className="h-4 w-4 text-(--accent-strong)" />
              <h2 className="text-lg font-semibold">선택한 결과</h2>
            </div>

            {selectedResult ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-[var(--radius-card)] bg-(--surface-soft) p-4">
                  <p className="text-xs font-semibold tracking-[0.12em] text-(--text-muted) uppercase">
                    연결된 장소
                  </p>
                  <p className="mt-2 text-base font-semibold">
                    {selectedResultLocation?.name ??
                      `장소 #${selectedResult.locationId}`}
                  </p>
                  <p className="mt-2 text-sm text-(--text-muted)">
                    위도{' '}
                    {formatCoordinateValue(selectedResultLocation?.latitude)} /
                    경도{' '}
                    {formatCoordinateValue(selectedResultLocation?.longitude)}
                  </p>
                </div>

                <PostCard
                  post={mapSearchResultToPostSummary(
                    selectedResult,
                    locationsById,
                  )}
                  to={`/posts/${selectedResult.postId}`}
                  variant="compact"
                />
              </div>
            ) : (
              <p className="mt-4 text-sm text-(--text-muted)">
                검색 결과를 선택하면 게시글 요약과 장소 정보를 여기에서 바로 볼
                수 있어요.
              </p>
            )}
          </SectionPanel>

          <SectionPanel>
            <h2 className="text-lg font-semibold">검색 상태</h2>
            {errorMessage ? (
              <div className="mt-4 rounded-[var(--radius-card)] border border-[color:var(--danger-border)] bg-[color:var(--danger-soft)] px-4 py-3 text-sm text-[color:var(--danger-strong)]">
                {errorMessage}
              </div>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[var(--radius-card)] bg-(--surface-soft) p-4">
                  <p className="text-xs font-semibold tracking-[0.12em] text-(--text-muted) uppercase">
                    검색 결과 수
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {results.length}
                  </p>
                </div>
                <div className="rounded-[var(--radius-card)] bg-(--surface-soft) p-4">
                  <p className="text-xs font-semibold tracking-[0.12em] text-(--text-muted) uppercase">
                    지도 표시 수
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {mappedResults.length}
                  </p>
                </div>
              </div>
            )}
          </SectionPanel>

          <SectionPanel>
            <h2 className="text-lg font-semibold">검색 팁</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-(--text-muted)">
              <li>
                키워드로 먼저 넓게 찾고, 카테고리나 날짜로 좁혀 가면 더 빠르게
                원하는 글을 찾을 수 있어요.
              </li>
              <li>
                지도에 표시된 결과는 실제 보관 장소와 연결된 글이라 위치 비교에
                특히 유용해요.
              </li>
              <li>
                결과가 없으면 다른 카테고리나 비슷한 장소명으로 다시 검색해
                보세요.
              </li>
            </ul>
          </SectionPanel>
        </div>
      </section>

      <section className="grid gap-4">
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
            <p className="text-sm font-semibold">검색 결과가 없어요.</p>
            <p className="mt-2 text-sm leading-6 text-(--text-muted)">
              검색 조건을 조금 바꿔서 다시 시도해 보세요. 장소명이나 카테고리를
              바꾸면 더 잘 찾을 수 있어요.
            </p>
          </SectionPanel>
        ) : null}
      </section>
    </div>
  )
}

export default PostsPage
