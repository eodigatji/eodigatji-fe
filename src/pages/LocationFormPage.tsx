import { MapPin, Navigation, PencilLine } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  createLocation,
  getLocation,
  updateLocation,
  type LocationCreateRequest,
} from '../features/locations/api/locations'
import NaverLocationMap from '../features/locations/components/NaverLocationMap'
import { type Coordinates } from '../features/locations/lib/locationCoordinates'
import { getApiErrorMessage } from '../shared/utils/getApiErrorMessage'

type LocationFormPageProps = {
  mode: 'create' | 'edit'
}

type LocationFormValues = {
  name: string
  detail: string
  number: string
  latitude: string
  longitude: string
}

const EMPTY_FORM: LocationFormValues = {
  name: '',
  detail: '',
  number: '',
  latitude: '',
  longitude: '',
}

function formatCoordinateInput(value: number | null) {
  return typeof value === 'number' ? value.toFixed(6) : ''
}

function parseCoordinateField(
  label: string,
  value: string,
  min: number,
  max: number,
) {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    throw new Error(`${label}는 숫자만 입력해 주세요.`)
  }

  if (parsed < min || parsed > max) {
    throw new Error(`${label}는 ${min}에서 ${max} 사이여야 합니다.`)
  }

  return Number(parsed.toFixed(6))
}

function buildLocationPayload(values: LocationFormValues): LocationCreateRequest {
  const payload: LocationCreateRequest = {
    name: values.name.trim(),
    detail: values.detail.trim(),
    number: values.number.trim(),
  }

  if (!payload.name || !payload.detail || !payload.number) {
    throw new Error('장소명, 상세 위치, 보관 번호는 모두 입력해 주세요.')
  }

  const latitude = values.latitude.trim()
  const longitude = values.longitude.trim()

  if ((latitude && !longitude) || (!latitude && longitude)) {
    throw new Error('위도와 경도는 함께 입력해 주세요.')
  }

  if (latitude && longitude) {
    payload.latitude = parseCoordinateField('위도', latitude, -90, 90)
    payload.longitude = parseCoordinateField('경도', longitude, -180, 180)
  }

  return payload
}

function LocationFormPage({ mode }: LocationFormPageProps) {
  const navigate = useNavigate()
  const { locationId } = useParams()
  const isEdit = mode === 'edit'
  const [form, setForm] = useState<LocationFormValues>(EMPTY_FORM)
  const [initialPayload, setInitialPayload] = useState<LocationCreateRequest | null>(null)
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const loadLocation = useCallback(async () => {
    if (!isEdit || !locationId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setErrorMessage('')

    try {
      const data = await getLocation(Number(locationId))
      const nextForm = {
        name: data.name,
        detail: data.detail,
        number: data.number,
        latitude: formatCoordinateInput(data.latitude),
        longitude: formatCoordinateInput(data.longitude),
      }

      setForm(nextForm)
      setInitialPayload(buildLocationPayload(nextForm))
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, '보관장소 정보를 불러오지 못했습니다.'),
      )
    } finally {
      setLoading(false)
    }
  }, [isEdit, locationId])

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadLocation()
    }, 0)

    return () => window.clearTimeout(timerId)
  }, [loadLocation])

  const previewCoordinates = useMemo<Coordinates | null>(() => {
    const latitude = form.latitude.trim()
    const longitude = form.longitude.trim()

    if (!latitude || !longitude) {
      return null
    }

    const parsedLatitude = Number(latitude)
    const parsedLongitude = Number(longitude)

    if (!Number.isFinite(parsedLatitude) || !Number.isFinite(parsedLongitude)) {
      return null
    }

    if (
      parsedLatitude < -90 ||
      parsedLatitude > 90 ||
      parsedLongitude < -180 ||
      parsedLongitude > 180
    ) {
      return null
    }

    return {
      latitude: parsedLatitude,
      longitude: parsedLongitude,
    }
  }, [form.latitude, form.longitude])

  function updateField(key: keyof LocationFormValues, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function applyCoordinates(coordinates: Coordinates) {
    setForm((current) => ({
      ...current,
      latitude: coordinates.latitude.toFixed(6),
      longitude: coordinates.longitude.toFixed(6),
    }))
  }

  function clearCoordinates() {
    setForm((current) => ({
      ...current,
      latitude: '',
      longitude: '',
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setErrorMessage('')

    try {
      const payload = buildLocationPayload(form)

      if (isEdit) {
        if (!locationId) {
          throw new Error('수정할 보관장소 ID가 없습니다.')
        }

        const patchPayload = Object.fromEntries(
          Object.entries(payload).filter(
            ([key, value]) => value !== initialPayload?.[key as keyof LocationCreateRequest],
          ),
        )

        if (!Object.keys(patchPayload).length) {
          throw new Error('변경된 항목이 없습니다.')
        }

        const updated = await updateLocation(Number(locationId), patchPayload)
        navigate(`/locations/${updated.id}`)
      } else {
        const created = await createLocation(payload)
        navigate(`/locations/${created.id}`)
      }
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, '보관장소 저장에 실패했습니다.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="location-editor-grid grid gap-6">
        <section className="rounded-(--radius-panel) border border-(--border-subtle) bg-(--surface-card) p-6 shadow-(--shadow-soft)">
          <p className="text-sm text-(--text-muted)">보관장소 정보를 불러오는 중입니다...</p>
        </section>
      </div>
    )
  }

  return (
    <form className="location-editor-grid grid gap-6" onSubmit={handleSubmit}>
      <section className="overflow-hidden rounded-(--radius-panel) border border-(--border-subtle) bg-(--surface-card) shadow-(--shadow-soft)">
        <div className="location-hero-surface p-6">
          <p className="text-sm font-semibold text-(--accent-strong)">
            {isEdit ? 'PATCH /v1/locations/{id}' : 'POST /v1/locations'}
          </p>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold">
                {isEdit ? '보관장소 수정' : '보관장소 등록'}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-(--text-muted)">
                위도와 경도는 직접 입력해도 되고, 아래 지도에서 위치를 클릭해서
                자동으로 채울 수도 있습니다. 좌표가 있으면 상세 페이지와 목록에서
                바로 지도 기반으로 보여줄 수 있습니다.
              </p>
            </div>
            <div className="rounded-(--radius-card) border border-white/80 bg-white/90 px-4 py-3 text-sm text-(--text-muted)">
              <p className="font-semibold text-(--text-strong)">입력 방법</p>
              <p className="mt-1">지도 클릭 또는 위도/경도 직접 입력</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-4">
          <NaverLocationMap
            className="min-h-[420px]"
            selectedCoordinates={previewCoordinates}
            onSelectCoordinates={applyCoordinates}
            emptyMessage="네이버 지도를 불러오는 중입니다."
          />

          <div className="location-coordinate-grid grid gap-3">
            <label className="grid gap-2">
              <span className="text-sm font-medium">위도 (latitude)</span>
              <input
                value={form.latitude}
                onChange={(event) => updateField('latitude', event.target.value)}
                className="rounded-(--radius-card) border border-(--border-subtle) bg-(--surface-soft) px-4 py-3 text-sm outline-none"
                placeholder="예: 37.275280"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium">경도 (longitude)</span>
              <input
                value={form.longitude}
                onChange={(event) => updateField('longitude', event.target.value)}
                className="rounded-(--radius-card) border border-(--border-subtle) bg-(--surface-soft) px-4 py-3 text-sm outline-none"
                placeholder="예: 127.132431"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={clearCoordinates}
              className="rounded-full border border-(--border-subtle) bg-white px-4 py-2 text-sm font-semibold"
            >
              좌표 지우기
            </button>
            <div className="rounded-full bg-(--surface-soft) px-4 py-2 text-sm text-(--text-muted)">
              지도를 클릭하면 위도/경도가 자동 입력됩니다.
            </div>
          </div>
        </div>
      </section>

      <aside className="space-y-6">
        <section className="rounded-(--radius-panel) border border-(--border-subtle) bg-(--surface-card) p-5 shadow-(--shadow-soft)">
          <div className="flex items-center gap-2">
            <PencilLine className="h-4 w-4 text-(--accent-strong)" />
            <h2 className="text-xl font-semibold">보관장소 정보</h2>
          </div>

          <div className="mt-5 grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-medium">장소명</span>
              <input
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
                className="rounded-(--radius-card) border border-(--border-subtle) bg-(--surface-soft) px-4 py-3 text-sm outline-none"
                placeholder="예: 학생지원팀 보관함 A"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium">상세 위치</span>
              <input
                value={form.detail}
                onChange={(event) => updateField('detail', event.target.value)}
                className="rounded-(--radius-card) border border-(--border-subtle) bg-(--surface-soft) px-4 py-3 text-sm outline-none"
                placeholder="예: 학생회관 1층 학생지원팀 앞"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium">보관 번호</span>
              <input
                value={form.number}
                onChange={(event) => updateField('number', event.target.value)}
                className="rounded-(--radius-card) border border-(--border-subtle) bg-(--surface-soft) px-4 py-3 text-sm outline-none"
                placeholder="예: A-01"
              />
            </label>
          </div>

          {errorMessage ? (
            <p className="mt-4 rounded-(--radius-card) border border-(--danger-border) bg-(--danger-soft) px-4 py-3 text-sm text-(--danger-strong)">
              {errorMessage}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-(--accent-strong) px-4 py-3 text-sm font-semibold text-white shadow-(--shadow-accent) disabled:opacity-60"
            >
              {submitting ? '저장 중...' : isEdit ? '변경 저장' : '장소 등록'}
            </button>
            <button
              type="button"
              onClick={() =>
                navigate(isEdit && locationId ? `/locations/${locationId}` : '/locations')
              }
              className="rounded-full border border-(--border-subtle) bg-white px-4 py-3 text-sm font-semibold"
            >
              취소
            </button>
          </div>
        </section>

        <section className="rounded-(--radius-panel) border border-(--border-subtle) bg-(--surface-card) p-5 shadow-(--shadow-soft)">
          <div className="flex items-center gap-2">
            <Navigation className="h-4 w-4 text-(--accent-strong)" />
            <h2 className="text-xl font-semibold">좌표 입력 가이드</h2>
          </div>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-(--text-muted)">
            <li>위도는 `-90`부터 `90`, 경도는 `-180`부터 `180` 사이 값만 허용됩니다.</li>
            <li>위도와 경도는 함께 입력해야 합니다. 한쪽만 입력하면 저장되지 않습니다.</li>
            <li>수정 화면에서는 실제로 바뀐 필드만 PATCH body로 전송합니다.</li>
            <li>지도 클릭으로 입력한 좌표는 소수점 6자리로 정리해서 저장합니다.</li>
          </ul>

          <div className="mt-4 rounded-(--radius-card) bg-(--surface-soft) p-4 text-sm text-(--text-muted)">
            <div className="flex items-center gap-2 text-(--text-strong)">
              <MapPin className="h-4 w-4 text-(--accent-strong)" />
              <span>현재 좌표 미리보기</span>
            </div>
            <p className="mt-2">
              위도: {previewCoordinates ? previewCoordinates.latitude.toFixed(6) : '미입력'}
            </p>
            <p className="mt-1">
              경도: {previewCoordinates ? previewCoordinates.longitude.toFixed(6) : '미입력'}
            </p>
          </div>
        </section>
      </aside>
    </form>
  )
}

export default LocationFormPage
