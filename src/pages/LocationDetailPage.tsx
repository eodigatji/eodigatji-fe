import { ExternalLink, MapPinned, PencilLine, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  deleteLocation,
  getLocation,
  type LocationDto,
} from '../features/locations/api/locations'
import NaverLocationMap from '../features/locations/components/NaverLocationMap'
import {
  createNaverMapLink,
  formatCoordinateValue,
  hasLocationCoordinates,
} from '../features/locations/lib/locationCoordinates'
import MetricGrid from '../shared/components/ui/MetricGrid'
import SectionPanel from '../shared/components/ui/SectionPanel'
import { getApiErrorMessage } from '../shared/utils/getApiErrorMessage'

function LocationDetailPage() {
  const navigate = useNavigate()
  const { locationId } = useParams()
  const [location, setLocation] = useState<LocationDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const loadLocation = useCallback(async () => {
    if (!locationId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setErrorMessage('')

    try {
      const data = await getLocation(Number(locationId))
      setLocation(data)
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, '보관장소 상세 정보를 불러오지 못했습니다.'),
      )
    } finally {
      setLoading(false)
    }
  }, [locationId])

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadLocation()
    }, 0)

    return () => window.clearTimeout(timerId)
  }, [loadLocation])

  const mapLink = useMemo(() => {
    if (!location || !hasLocationCoordinates(location)) return null
    return createNaverMapLink(location.name, location)
  }, [location])

  async function handleDelete() {
    if (!location) return

    const confirmed = window.confirm('이 보관장소를 삭제할까요?')
    if (!confirmed) return

    setDeleting(true)
    setErrorMessage('')

    try {
      await deleteLocation(location.id)
      navigate('/locations')
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, '보관장소 삭제에 실패했습니다.'))
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <SectionPanel>
        <p className="text-sm text-(--text-muted)">보관장소를 불러오는 중입니다...</p>
      </SectionPanel>
    )
  }

  if (!location) {
    return (
      <SectionPanel>
        <p className="text-sm text-(--danger-strong)">
          {errorMessage || '보관장소를 찾을 수 없습니다.'}
        </p>
      </SectionPanel>
    )
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-(--radius-panel) border border-(--border-subtle) bg-(--surface-card) shadow-(--shadow-soft)">
        <div className="location-detail-hero-grid grid gap-0">
          <div className="location-hero-surface p-6">
            <p className="text-sm font-semibold text-(--accent-strong)">
              GET /v1/locations/{'{id}'}
            </p>
            <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-semibold">{location.name}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-(--text-muted)">
                  {location.detail}에 있는 보관장소입니다. 보관 번호는 {location.number}
                  이고, 생성 일시는{' '}
                  {new Date(location.createdAt).toLocaleString('ko-KR')}입니다.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  to={`/locations/${location.id}/edit`}
                  className="inline-flex items-center gap-2 rounded-full bg-(--accent-strong) px-4 py-2 text-sm font-semibold text-white shadow-(--shadow-accent)"
                >
                  <PencilLine className="h-4 w-4" />
                  장소 수정
                </Link>
                {mapLink ? (
                  <a
                    href={mapLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-(--border-subtle) bg-white px-4 py-2 text-sm font-semibold"
                  >
                    <ExternalLink className="h-4 w-4" />
                    네이버 지도 열기
                  </a>
                ) : null}
              </div>
            </div>

            <div className="mt-6">
              <MetricGrid
                columnsClassName="sm:grid-cols-2 xl:grid-cols-4"
                items={[
                  { label: '보관 번호', value: location.number },
                  { label: '상세 위치', value: location.detail },
                  { label: '위도', value: formatCoordinateValue(location.latitude) },
                  { label: '경도', value: formatCoordinateValue(location.longitude) },
                ]}
              />
            </div>
          </div>

          <div className="p-4">
            <NaverLocationMap
              className="h-full min-h-[360px]"
              markers={
                hasLocationCoordinates(location)
                  ? [
                      {
                        id: location.id,
                        name: location.name,
                        detail: location.detail,
                        number: location.number,
                        latitude: location.latitude,
                        longitude: location.longitude,
                      },
                    ]
                  : []
              }
              selectedCoordinates={hasLocationCoordinates(location) ? location : null}
              emptyMessage="등록된 좌표가 없어 지도를 표시할 수 없습니다."
            />
          </div>
        </div>
      </section>

      <div className="detail-sidebar-grid grid gap-6">
        <SectionPanel>
          <div className="flex items-center gap-2">
            <MapPinned className="h-4 w-4 text-(--accent-strong)" />
            <h2 className="text-xl font-semibold">활용 흐름</h2>
          </div>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-(--text-muted)">
            <li>목록에서 장소를 선택하면 지도 중심으로 상세 위치를 바로 확인할 수 있습니다.</li>
            <li>좌표가 정확하지 않다면 수정 화면에서 지도를 클릭해 다시 저장하면 됩니다.</li>
            <li>네이버 지도 링크로 외부 지도로 연결해 길찾기나 확대 확인도 가능합니다.</li>
          </ul>
        </SectionPanel>

        <section className="rounded-(--radius-panel) border border-(--danger-border) bg-(--danger-soft) p-5">
          <div className="flex items-center gap-2 text-(--danger-strong)">
            <Trash2 className="h-4 w-4" />
            <h2 className="text-lg font-semibold">DELETE /v1/locations/{'{id}'}</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-(--danger-strong) opacity-80">
            삭제 후에는 목록 페이지로 이동합니다. 좌표와 장소 정보가 함께 제거되니
            다시 확인해 주세요.
          </p>
          <button
            type="button"
            disabled={deleting}
            onClick={() => void handleDelete()}
            className="mt-4 rounded-full border border-(--danger-border) bg-white px-4 py-2 text-sm font-semibold text-(--danger-strong) disabled:opacity-60"
          >
            {deleting ? '삭제 중...' : '장소 삭제'}
          </button>
          {errorMessage ? (
            <p className="mt-3 text-sm text-(--danger-strong)">{errorMessage}</p>
          ) : null}
        </section>
      </div>
    </div>
  )
}

export default LocationDetailPage
