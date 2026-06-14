import { PencilLine } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react'
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
    throw new Error(`${label}에는 숫자를 입력해 주세요.`)
  }

  if (parsed < min || parsed > max) {
    throw new Error(`${label}는 ${min}에서 ${max} 사이여야 해요.`)
  }

  return Number(parsed.toFixed(6))
}

function buildLocationPayload(
  values: LocationFormValues,
): LocationCreateRequest {
  const payload: LocationCreateRequest = {
    name: values.name.trim(),
    detail: values.detail.trim(),
    number: values.number.trim(),
  }

  if (!payload.name || !payload.detail || !payload.number) {
    throw new Error('장소명, 상세 위치, 보관 번호를 모두 입력해 주세요.')
  }

  const latitude = values.latitude.trim()
  const longitude = values.longitude.trim()

  if ((latitude && !longitude) || (!latitude && longitude)) {
    throw new Error('위도와 경도를 함께 입력해 주세요.')
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
  const [initialPayload, setInitialPayload] =
    useState<LocationCreateRequest | null>(null)
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
        getApiErrorMessage(error, '보관 장소 정보를 불러오지 못했어요.'),
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
          throw new Error('수정할 장소 정보를 찾을 수 없어요.')
        }

        const patchPayload = Object.fromEntries(
          Object.entries(payload).filter(
            ([key, value]) =>
              value !== initialPayload?.[key as keyof LocationCreateRequest],
          ),
        )

        if (!Object.keys(patchPayload).length) {
          throw new Error('바뀐 내용이 없어요.')
        }

        const updated = await updateLocation(Number(locationId), patchPayload)
        navigate(`/locations/${updated.id}`)
      } else {
        const created = await createLocation(payload)
        navigate(`/locations/${created.id}`)
      }
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, '보관 장소를 저장하지 못했어요.'),
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="location-editor-grid grid gap-6">
        <section className="rounded-(--radius-panel) border border-(--border-subtle) bg-[color:var(--surface-card)] p-6 shadow-[var(--shadow-soft)]">
          <p className="text-sm text-(--text-muted)">
            보관 장소 정보를 불러오는 중이에요...
          </p>
        </section>
      </div>
    )
  }

  return (
    <form className="location-editor-grid grid gap-6" onSubmit={handleSubmit}>
      <section className="overflow-hidden rounded-(--radius-panel) border border-(--border-subtle) bg-[color:var(--surface-card)] shadow-[var(--shadow-soft)]">
        <div className="location-hero-surface p-6">
          <div className="mt-1 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-(--accent-strong)">
                {isEdit ? '장소 정보 수정' : '새 보관 장소 등록'}
              </p>
              <h1 className="mt-3 text-3xl font-semibold">
                {isEdit
                  ? '보관 장소를 최신 정보로 바꿔 주세요.'
                  : '지도에 새 보관 장소를 추가해 주세요.'}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-(--text-muted)">
                위도와 경도는 직접 입력할 수도 있고, 아래 지도에서 위치를 눌러
                자동으로 채울 수도 있어요. 좌표를 입력해 두면 목록과 상세
                화면에서 위치를 더 쉽게 확인할 수 있습니다.
              </p>
            </div>
            <div className="rounded-[var(--radius-card)] border border-white/80 bg-white/90 px-4 py-3 text-sm text-(--text-muted)">
              <p className="font-semibold text-[color:var(--text-strong)]">
                입력 방법
              </p>
              <p className="mt-1">지도를 클릭하거나 위도, 경도를 직접 입력</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-4">
          <NaverLocationMap
            className="min-h-[420px]"
            selectedCoordinates={previewCoordinates}
            onSelectCoordinates={applyCoordinates}
            emptyMessage="네이버 지도를 불러오는 중이에요."
          />

          <div className="location-coordinate-grid grid gap-3">
            <label className="grid gap-2">
              <span className="text-sm font-medium">위도 (latitude)</span>
              <input
                value={form.latitude}
                onChange={(event) =>
                  updateField('latitude', event.target.value)
                }
                className="rounded-[var(--radius-card)] border border-(--border-subtle) bg-(--surface-soft) px-4 py-3 text-sm outline-none"
                placeholder="예: 37.275280"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium">경도 (longitude)</span>
              <input
                value={form.longitude}
                onChange={(event) =>
                  updateField('longitude', event.target.value)
                }
                className="rounded-[var(--radius-card)] border border-(--border-subtle) bg-(--surface-soft) px-4 py-3 text-sm outline-none"
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
              지도를 누르면 위도와 경도가 자동으로 입력돼요.
            </div>
          </div>
        </div>
      </section>

      <aside className="space-y-6">
        <section className="rounded-(--radius-panel) border border-(--border-subtle) bg-[color:var(--surface-card)] p-5 shadow-[var(--shadow-soft)]">
          <div className="flex items-center gap-2">
            <PencilLine className="h-4 w-4 text-(--accent-strong)" />
            <h2 className="text-xl font-semibold">보관 장소 정보</h2>
          </div>

          <div className="mt-5 grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-medium">장소명</span>
              <input
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
                className="rounded-[var(--radius-card)] border border-(--border-subtle) bg-(--surface-soft) px-4 py-3 text-sm outline-none"
                placeholder="예: 학생지원관 보관함 A"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium">상세 위치</span>
              <input
                value={form.detail}
                onChange={(event) => updateField('detail', event.target.value)}
                className="rounded-[var(--radius-card)] border border-(--border-subtle) bg-(--surface-soft) px-4 py-3 text-sm outline-none"
                placeholder="예: 학생회관 1층 안내 데스크 옆"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium">보관 번호</span>
              <input
                value={form.number}
                onChange={(event) => updateField('number', event.target.value)}
                className="rounded-[var(--radius-card)] border border-(--border-subtle) bg-(--surface-soft) px-4 py-3 text-sm outline-none"
                placeholder="예: A-01"
              />
            </label>
          </div>

          {errorMessage ? (
            <p className="mt-4 rounded-[var(--radius-card)] border border-[color:var(--danger-border)] bg-[color:var(--danger-soft)] px-4 py-3 text-sm text-[color:var(--danger-strong)]">
              {errorMessage}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-(--accent-strong) px-4 py-3 text-sm font-semibold text-white shadow-[var(--shadow-accent)] disabled:opacity-60"
            >
              {submitting
                ? '저장 중...'
                : isEdit
                  ? '변경사항 저장'
                  : '장소 등록'}
            </button>
            <button
              type="button"
              onClick={() =>
                navigate(
                  isEdit && locationId
                    ? `/locations/${locationId}`
                    : '/locations',
                )
              }
              className="rounded-full border border-(--border-subtle) bg-white px-4 py-3 text-sm font-semibold"
            >
              취소
            </button>
          </div>
        </section>
      </aside>
    </form>
  )
}

export default LocationFormPage
