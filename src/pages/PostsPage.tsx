import { CalendarDays, Filter, MapPinned, Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { getLocations, type LocationDto } from '../features/locations/api/locations'
import PostCard from '../features/posts/components/PostCard'
import {
  searchPostsByCategory,
  searchPostsByDate,
  searchPostsByKeyword,
  searchPostsByPlace,
  type SearchResultDto,
} from '../features/search/api/search'
import SectionHeader from '../shared/components/ui/SectionHeader'
import SectionPanel from '../shared/components/ui/SectionPanel'
import { getApiErrorMessage } from '../shared/utils/getApiErrorMessage'

type SearchMode = 'keyword' | 'category' | 'date' | 'place'

const searchModes: Array<{
  id: SearchMode
  label: string
  placeholder: string
}> = [
  { id: 'keyword', label: '키워드', placeholder: '예: 에어팟, 지갑, 학생증' },
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

function formatModeHint(mode: SearchMode) {
  switch (mode) {
    case 'keyword':
      return 'GET /v1/posts/search?keyword='
    case 'category':
      return 'GET /v1/posts/categories/{category}'
    case 'date':
      return 'GET /v1/posts/search/date?date='
    case 'place':
      return 'GET /v1/posts/search/place?place='
    default:
      return ''
  }
}

function mapSearchResultToPostSummary(
  result: SearchResultDto,
  locationsById: Map<number, LocationDto>,
) {
  const location = locationsById.get(result.locationId)

  return {
    id: result.postId,
    title: result.title,
    category: result.category,
    place: location?.name ?? `장소 ID ${result.locationId}`,
    date: '날짜 정보 없음',
    timeSlot: '시간 정보 없음',
    description: result.description,
    status: result.type === 'FOUND' ? 'FOUND' : 'LOST',
    comments: 0,
  } as const
}

function PostsPage() {
  const [searchMode, setSearchMode] = useState<SearchMode>('keyword')
  const [searchValue, setSearchValue] = useState('')
  const [results, setResults] = useState<SearchResultDto[]>([])
  const [locations, setLocations] = useState<LocationDto[]>([])
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
          '보관 장소 목록을 불러오지 못했습니다. 장소명은 ID 기준으로 표시됩니다.',
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
    () => results.map((result) => mapSearchResultToPostSummary(result, locationsById)),
    [locationsById, results],
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!searchValue.trim()) {
      setErrorMessage('검색어를 입력해주세요.')
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
        getApiErrorMessage(error, '검색 요청을 처리하지 못했습니다.'),
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <SectionPanel>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">게시글 검색</h1>
            <p className="mt-1 text-sm text-(--text-muted)">
              API 스펙에 있는 검색 엔드포인트를 그대로 연결했습니다. 현재 백엔드 구현상
              검색 결과가 빈 배열로 내려올 수 있어서 결과 없음 화면도 함께 정리했습니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/api-status"
              className="inline-flex items-center gap-2 rounded-full border border-(--border-subtle) bg-(--surface-soft) px-3 py-2 text-sm font-medium"
            >
              <Filter className="h-4 w-4" />
              API 현황 보기
            </Link>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {searchModes.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => {
                setSearchMode(mode.id)
                setSearchValue(mode.id === 'category' ? 'ELECTRONICS' : '')
                setErrorMessage(null)
              }}
              className={[
                'rounded-full px-3 py-2 text-sm font-medium transition',
                searchMode === mode.id
                  ? 'bg-(--accent-soft) text-(--accent-strong)'
                  : 'border border-(--border-subtle) bg-white text-(--text-muted)',
              ].join(' ')}
            >
              {mode.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="flex items-center gap-2 rounded-(--radius-card) border border-(--border-subtle) bg-(--surface-soft) px-4 py-3">
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
                <option value="">카테고리를 선택하세요</option>
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
                  searchModes.find((mode) => mode.id === searchMode)?.placeholder
                }
              />
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-(--text-muted)">
              현재 호출 엔드포인트:{' '}
              <span className="font-semibold">{formatModeHint(searchMode)}</span>
            </p>
            <button
              type="submit"
              disabled={loading || bootLoading}
              className="rounded-full bg-(--accent-strong) px-4 py-2 text-sm font-semibold text-white shadow-(--shadow-accent) disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? '검색 중...' : '검색 실행'}
            </button>
          </div>
        </form>

        {errorMessage ? (
          <div className="mt-4 rounded-(--radius-card) border border-(--danger-border) bg-(--danger-soft) px-4 py-3 text-sm text-(--danger-strong)">
            {errorMessage}
          </div>
        ) : null}
      </SectionPanel>

      <SectionPanel>
        <SectionHeader
          title="검색 결과"
          description="SearchResponseDto에는 제목, 설명, 상태, 카테고리, locationId만 포함됩니다."
          action={
            searched ? (
              <span className="rounded-full bg-(--surface-soft) px-3 py-1 text-xs font-semibold text-(--text-muted)">
                {results.length}건
              </span>
            ) : null
          }
        />

        {bootLoading ? (
          <div className="mt-4 rounded-(--radius-card) bg-(--surface-soft) px-4 py-8 text-center text-sm text-(--text-muted)">
            검색 화면을 준비하고 있습니다...
          </div>
        ) : null}

        {!bootLoading && !searched ? (
          <div className="mt-4 rounded-(--radius-card) bg-(--surface-soft) px-4 py-8 text-center text-sm text-(--text-muted)">
            검색 유형을 고르고 요청을 보내면 API 응답을 여기서 바로 확인할 수 있습니다.
          </div>
        ) : null}

        {!bootLoading && searched && results.length === 0 ? (
          <div className="mt-4 rounded-(--radius-card) border border-dashed border-(--border-subtle) px-4 py-8 text-center">
            <p className="text-sm font-semibold">검색 결과가 없습니다.</p>
            <p className="mt-2 text-sm leading-6 text-(--text-muted)">
              API 스펙 분석 문서 기준으로 현재 백엔드 검색 서비스는 빈 배열을 반환할 수
              있습니다. UI는 그 상태를 그대로 보여주도록 맞췄습니다.
            </p>
          </div>
        ) : null}

        {!bootLoading && results.length > 0 ? (
          <div className="mt-4 grid gap-4">
            {postCards.map((post) => (
              <PostCard key={post.id} post={post} to={`/posts/${post.id}`} />
            ))}
          </div>
        ) : null}
      </SectionPanel>
    </div>
  )
}

export default PostsPage
