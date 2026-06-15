import { ChevronDown, MapPinned, Plus, RefreshCw, Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getLocations,
  type LocationDto,
} from '../features/locations/api/locations'
import NaverLocationMap from '../features/locations/components/NaverLocationMap'
import LocationCard from '../features/locations/components/LocationCard'
import {
  formatCoordinateValue,
  hasLocationCoordinates,
} from '../features/locations/lib/locationCoordinates'
import {
  getAllPostDetails,
  getPostCountMap,
} from '../features/posts/lib/postCounts'
import SectionPanel from '../shared/components/ui/SectionPanel'
import { getApiErrorMessage } from '../shared/utils/getApiErrorMessage'

function LocationsPage() {
  const [locations, setLocations] = useState<LocationDto[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sortKey, setSortKey] = useState<'latest' | 'number' | 'name'>('latest')
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(
    null,
  )
  const [postCountMap, setPostCountMap] = useState<Map<number, number>>(new Map())
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const loadLocations = useCallback(async () => {
    setLoading(true)
    setErrorMessage('')

    try {
      const [locationsResult, postsResult] = await Promise.allSettled([
        getLocations(),
        getAllPostDetails(),
      ])

      if (locationsResult.status !== 'fulfilled') {
        throw locationsResult.reason
      }

      setLocations(locationsResult.value)

      if (postsResult.status === 'fulfilled') {
        setPostCountMap(getPostCountMap(postsResult.value))
      } else {
        setPostCountMap(new Map())
        setErrorMessage(
          getApiErrorMessage(
            postsResult.reason,
            '장소는 불러왔지만 분실물 개수 집계는 아직 준비되지 않았어요.',
          ),
        )
      }
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, '보관 장소 목록을 불러오지 못했어요.'),
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

  const filteredLocations = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase()
    const next = locations.filter((location) =>
      [location.name, location.detail, location.number]
        .join(' ')
        .toLowerCase()
        .includes(normalized),
    )

    next.sort((a, b) => {
      if (sortKey === 'name') {
        return a.name.localeCompare(b.name, 'ko')
      }

      if (sortKey === 'number') {
        return a.number.localeCompare(b.number, 'ko')
      }

      return b.id - a.id
    })

    return next
  }, [locations, searchTerm, sortKey])

  const mappedLocations = useMemo(
    () =>
      filteredLocations.filter(
        (
          location,
        ): location is LocationDto & { latitude: number; longitude: number } =>
          hasLocationCoordinates(location),
      ),
    [filteredLocations],
  )

  useEffect(() => {
    if (!filteredLocations.length) {
      setSelectedLocationId(null)
      return
    }

    setSelectedLocationId((current) => {
      if (
        current &&
        filteredLocations.some((location) => location.id === current)
      ) {
        return current
      }

      return filteredLocations[0].id
    })
  }, [filteredLocations])

  const selectedLocation =
    filteredLocations.find((location) => location.id === selectedLocationId) ??
    null

  return (
    <div className="space-y-5 pb-20 xl:pb-6">
      <section className="map-command-grid grid gap-5">
        <div className="overflow-hidden rounded-[32px] border border-(--border-subtle) bg-[color:var(--surface-card)] shadow-[var(--shadow-soft)]">
          <div className="map-stage-header p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold text-(--accent-strong)">
                  Location Control Room
                </p>
                <h1 className="mt-2 text-[2.05rem] leading-[1.08] font-semibold">
                  지도와 목록 화면에서 장소를 가볍게 관리해보세요
                </h1>
                <p className="mt-3 text-sm leading-6 text-(--text-muted)">
                  검색과 정렬은 상단에서, 선택 결과는 지도와 요약 패널에서 이어집니다.
                  각 장소 마커에는 메인 페이지처럼 연결된 분실물 개수도 함께 보여줍니다.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void loadLocations()}
                  className="inline-flex items-center gap-2 rounded-full border border-(--border-subtle) bg-white px-3.5 py-2.5 text-[13px] font-semibold"
                >
                  <RefreshCw className="h-4 w-4" />
                  새로고침
                </button>
                <Link
                  to="/locations/new"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-(--accent-strong) px-3.5 py-2.5 text-center text-[13px] font-semibold text-[color:#fff] shadow-[var(--shadow-accent)]"
                >
                  <Plus className="h-4 w-4 text-white" />
                  <p className="text-white">새 장소</p>
                </Link>
              </div>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_140px]">
              <label className="flex items-center gap-3 rounded-full border border-(--border-subtle) bg-white px-4 py-3 shadow-[0_10px_24px_-22px_rgba(19,34,56,0.5)] transition focus-within:border-[color:var(--border-accent)] focus-within:ring-2 focus-within:ring-[color:var(--accent-soft)]">
                <Search className="h-4 w-4 shrink-0 text-(--text-muted)" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="w-full bg-transparent text-sm outline-none placeholder:text-[13px] placeholder:text-(--text-muted)"
                  placeholder="장소명, 상세 위치, 보관 번호 검색"
                />
              </label>
              <label className="relative flex items-center rounded-full border border-(--border-subtle) bg-white px-3.5 py-3 shadow-[0_10px_24px_-22px_rgba(19,34,56,0.5)] transition focus-within:border-[color:var(--border-accent)] focus-within:ring-2 focus-within:ring-[color:var(--accent-soft)]">
                <select
                  value={sortKey}
                  onChange={(event) =>
                    setSortKey(
                      event.target.value as 'latest' | 'number' | 'name',
                    )
                  }
                  className="w-full appearance-none bg-transparent pr-6 text-[13px] font-medium outline-none"
                >
                  <option value="latest">최신 등록순</option>
                  <option value="number">보관 번호순</option>
                  <option value="name">장소명순</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 h-4 w-4 text-(--text-muted)" />
              </label>
            </div>
          </div>

          <div className="p-4">
            <NaverLocationMap
              className="min-h-[520px]"
              markers={mappedLocations.map((location) => ({
                id: location.id,
                name: location.name,
                detail: location.detail,
                itemCount: postCountMap.get(location.id) ?? 0,
                number: location.number,
                latitude: location.latitude,
                longitude: location.longitude,
              }))}
              activeMarkerId={selectedLocationId}
              selectedCoordinates={
                selectedLocation && hasLocationCoordinates(selectedLocation)
                  ? selectedLocation
                  : null
              }
              onMarkerSelect={(marker) => setSelectedLocationId(marker.id)}
              emptyMessage={
                loading
                  ? '장소 좌표를 불러오는 중이에요.'
                  : '현재 조건에 맞는 좌표 등록 장소가 없어요.'
              }
            />
          </div>
        </div>

        <div className="space-y-5">
          <SectionPanel>
            <div className="flex items-center gap-2">
              <MapPinned className="h-4 w-4 text-(--accent-strong)" />
              <h2 className="text-base font-semibold">선택한 장소 요약</h2>
            </div>

            {selectedLocation ? (
              <div className="mt-4 space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold">
                        {selectedLocation.name}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-(--text-muted)">
                        {selectedLocation.detail}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-(--surface-soft) px-3 py-1 text-xs font-semibold text-(--text-muted)">
                        {selectedLocation.number}
                      </span>
                      <span className="rounded-full bg-(--accent-soft) px-3 py-1 text-xs font-semibold text-(--accent-strong)">
                        물품 {postCountMap.get(selectedLocation.id) ?? 0}건
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[var(--radius-card)] bg-(--surface-soft) p-3.5">
                    <p className="text-[11px] font-semibold tracking-[0.12em] text-(--text-muted) uppercase">
                      위도
                    </p>
                    <p className="mt-2 text-sm font-semibold">
                      {formatCoordinateValue(selectedLocation.latitude)}
                    </p>
                  </div>
                  <div className="rounded-[var(--radius-card)] bg-(--surface-soft) p-3.5">
                    <p className="text-[11px] font-semibold tracking-[0.12em] text-(--text-muted) uppercase">
                      경도
                    </p>
                    <p className="mt-2 text-sm font-semibold">
                      {formatCoordinateValue(selectedLocation.longitude)}
                    </p>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Link
                    to={`/locations/${selectedLocation.id}`}
                    className="rounded-[var(--radius-card)] border border-(--border-subtle) px-4 py-3 text-sm font-semibold transition hover:bg-(--surface-soft)"
                  >
                    상세 페이지 보기
                  </Link>
                  <Link
                    to={`/locations/${selectedLocation.id}/edit`}
                    className="rounded-[var(--radius-card)] border border-(--border-subtle) px-4 py-3 text-sm font-semibold transition hover:bg-(--surface-soft)"
                  >
                    수정 화면으로 이동
                  </Link>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-(--text-muted)">
                목록 카드나 마커를 선택하면 연결된 정보가 여기서 함께 표시돼요.
              </p>
            )}

            {errorMessage ? (
              <div className="mt-4 rounded-[var(--radius-card)] border border-[color:var(--danger-border)] bg-[color:var(--danger-soft)] px-4 py-3 text-sm text-[color:var(--danger-strong)]">
                {errorMessage}
              </div>
            ) : null}
          </SectionPanel>
        </div>
      </section>

      <section className="grid gap-4">
        {filteredLocations.map((location) => (
          <div
            key={location.id}
            onMouseEnter={() => setSelectedLocationId(location.id)}
            className="cursor-pointer"
          >
            <LocationCard location={location} to={`/locations/${location.id}`} />
          </div>
        ))}
      </section>
    </div>
  )
}

export default LocationsPage
