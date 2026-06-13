import { Compass, MapPinned, RefreshCw } from 'lucide-react'
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
import SectionPanel from '../shared/components/ui/SectionPanel'
import { getApiErrorMessage } from '../shared/utils/getApiErrorMessage'

function LocationsPage() {
  const [locations, setLocations] = useState<LocationDto[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sortKey, setSortKey] = useState<'latest' | 'number' | 'name'>('latest')
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const loadLocations = useCallback(async () => {
    setLoading(true)
    setErrorMessage('')

    try {
      const data = await getLocations()
      setLocations(data)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, '보관장소 목록을 불러오지 못했습니다.'))
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
      if (sortKey === 'name') return a.name.localeCompare(b.name, 'ko')
      if (sortKey === 'number') return a.number.localeCompare(b.number, 'ko')
      return b.id - a.id
    })

    return next
  }, [locations, searchTerm, sortKey])

  useEffect(() => {
    if (!filteredLocations.length) {
      setSelectedLocationId(null)
      return
    }

    setSelectedLocationId((current) => {
      if (current && filteredLocations.some((location) => location.id === current)) {
        return current
      }

      return filteredLocations[0].id
    })
  }, [filteredLocations])

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

  const selectedLocation =
    filteredLocations.find((location) => location.id === selectedLocationId) ??
    filteredLocations[0] ??
    null

  return (
    <div className="space-y-6">
      <div className="location-dashboard-grid grid gap-6">
        <section className="overflow-hidden rounded-(--radius-panel) border border-(--border-subtle) bg-(--surface-card) shadow-(--shadow-soft)">
          <div className="location-hero-surface p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold text-(--accent-strong)">
                  지도 기반 보관장소 관리
                </p>
                <h1 className="mt-2 text-3xl font-semibold">보관장소 좌표 대시보드</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-(--text-muted)">
                  등록된 보관장소를 지도에서 바로 확인하고, 좌표가 없는 장소를 찾아
                  수정 화면에서 보완할 수 있습니다.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void loadLocations()}
                  className="inline-flex items-center gap-2 rounded-full border border-(--border-subtle) bg-white px-4 py-2 text-sm font-semibold"
                >
                  <RefreshCw className="h-4 w-4" />
                  새로고침
                </button>
                <Link
                  to="/locations/new"
                  className="rounded-full bg-(--accent-strong) px-4 py-2 text-sm font-semibold text-white shadow-(--shadow-accent)"
                >
                  장소 등록
                </Link>
              </div>
            </div>

            <div className="location-filter-grid mt-5 grid gap-3">
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="rounded-(--radius-card) border border-white/70 bg-white/90 px-4 py-3 text-sm outline-none placeholder:text-(--text-muted)"
                placeholder="장소명, 상세 위치, 보관 번호로 검색"
              />
              <select
                value={sortKey}
                onChange={(event) =>
                  setSortKey(event.target.value as 'latest' | 'number' | 'name')
                }
                className="rounded-(--radius-card) border border-white/70 bg-white/90 px-4 py-3 text-sm outline-none"
              >
                <option value="latest">정렬: 최신 등록순</option>
                <option value="number">보관 번호순</option>
                <option value="name">장소명순</option>
              </select>
            </div>
          </div>

          <div className="p-4">
            <NaverLocationMap
              className="min-h-[420px]"
              markers={mappedLocations.map((location) => ({
                id: location.id,
                name: location.name,
                detail: location.detail,
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
              emptyMessage="좌표가 등록된 보관장소가 아직 없습니다."
            />
          </div>
        </section>

        <aside className="space-y-6">
          <SectionPanel>
            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-(--accent-strong)" />
              <h2 className="text-xl font-semibold">좌표 현황</h2>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-(--radius-card) bg-(--surface-soft) p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-(--text-muted)">
                  전체 장소
                </p>
                <p className="mt-2 text-2xl font-semibold">{filteredLocations.length}</p>
              </div>
              <div className="rounded-(--radius-card) bg-(--surface-soft) p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-(--text-muted)">
                  좌표 등록 완료
                </p>
                <p className="mt-2 text-2xl font-semibold">{mappedLocations.length}</p>
              </div>
            </div>

            {selectedLocation ? (
              <div className="mt-5 rounded-(--radius-card) border border-(--border-subtle) p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{selectedLocation.name}</p>
                    <p className="mt-1 text-sm leading-6 text-(--text-muted)">
                      {selectedLocation.detail}
                    </p>
                  </div>
                  <span className="rounded-full bg-(--surface-soft) px-2.5 py-1 text-xs font-semibold text-(--text-muted)">
                    {selectedLocation.number}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-sm text-(--text-muted)">
                  <p>위도: {formatCoordinateValue(selectedLocation.latitude)}</p>
                  <p>경도: {formatCoordinateValue(selectedLocation.longitude)}</p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    to={`/locations/${selectedLocation.id}`}
                    className="rounded-full bg-(--accent-strong) px-4 py-2 text-sm font-semibold text-white"
                  >
                    상세 보기
                  </Link>
                  <Link
                    to={`/locations/${selectedLocation.id}/edit`}
                    className="rounded-full border border-(--border-subtle) bg-white px-4 py-2 text-sm font-semibold"
                  >
                    좌표 수정
                  </Link>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-(--text-muted)">
                검색 조건에 맞는 보관장소가 없습니다.
              </p>
            )}
          </SectionPanel>

          <SectionPanel>
            <div className="flex items-center gap-2">
              <MapPinned className="h-4 w-4 text-(--accent-strong)" />
              <h2 className="text-xl font-semibold">운영 포인트</h2>
            </div>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-(--text-muted)">
              <li>좌표가 없는 장소는 지도에 표시되지 않으니 수정 화면에서 먼저 보완해 주세요.</li>
              <li>목록 카드에도 위도와 경도가 함께 보이도록 바뀌었습니다.</li>
              <li>네이버 지도 클릭으로 입력한 좌표는 등록/수정 화면에 자동 반영됩니다.</li>
            </ul>
          </SectionPanel>
        </aside>
      </div>

      {errorMessage ? (
        <SectionPanel>
          <p className="text-sm text-(--danger-strong)">{errorMessage}</p>
        </SectionPanel>
      ) : null}

      {loading ? (
        <SectionPanel>
          <p className="text-sm text-(--text-muted)">보관장소를 불러오는 중입니다...</p>
        </SectionPanel>
      ) : (
        <section className="grid gap-4 xl:grid-cols-2">
          {filteredLocations.map((location) => (
            <div key={location.id} onMouseEnter={() => setSelectedLocationId(location.id)}>
              <LocationCard location={location} to={`/locations/${location.id}`} />
            </div>
          ))}
        </section>
      )}

      {!loading && !filteredLocations.length ? (
        <SectionPanel>
          <p className="text-sm text-(--text-muted)">
            현재 조건에 맞는 보관장소가 없습니다.
          </p>
        </SectionPanel>
      ) : null}
    </div>
  )
}

export default LocationsPage
