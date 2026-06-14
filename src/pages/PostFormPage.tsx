import { ImagePlus, PencilLine, Shapes } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getLocations,
  type LocationDto,
} from '../features/locations/api/locations'
import { createPost, type PostCreateRequest } from '../features/posts/api/posts'
import type { PostStatus } from '../features/posts/types'
import { getApiErrorMessage } from '../shared/utils/getApiErrorMessage'

type PostFormValues = {
  title: string
  description: string
  type: PostStatus
  category: string
  locationId: string
}

const POST_CATEGORY_OPTIONS = [
  'ELECTRONICS',
  'WALLET',
  'ID_CARD',
  'BAG',
  'CLOTHING',
  'ETC',
] as const

const EMPTY_FORM: PostFormValues = {
  title: '',
  description: '',
  type: 'LOST',
  category: 'ELECTRONICS',
  locationId: '',
}

function buildPostPayload(values: PostFormValues): PostCreateRequest {
  const title = values.title.trim()
  const description = values.description.trim()
  const locationId = Number(values.locationId)

  if (!title) {
    throw new Error('제목을 입력해 주세요.')
  }

  if (!description) {
    throw new Error('설명을 입력해 주세요.')
  }

  if (!Number.isInteger(locationId) || locationId <= 0) {
    throw new Error('보관 장소를 선택해 주세요.')
  }

  return {
    title,
    description,
    type: values.type,
    category: values.category,
    locationId,
  }
}

function PostFormPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState<PostFormValues>(EMPTY_FORM)
  const [locations, setLocations] = useState<LocationDto[]>([])
  const [images, setImages] = useState<File[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const loadLocations = useCallback(async () => {
    setLoading(true)
    setErrorMessage('')

    try {
      const data = await getLocations()
      setLocations(data)
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

  const sortedLocations = useMemo(
    () =>
      [...locations].sort((left, right) => left.name.localeCompare(right.name)),
    [locations],
  )

  const selectedLocation = useMemo(
    () =>
      sortedLocations.find(
        (location) => String(location.id) === form.locationId,
      ) ?? null,
    [form.locationId, sortedLocations],
  )

  function updateField<Key extends keyof PostFormValues>(
    key: Key,
    value: PostFormValues[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function handleImagesChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFiles = Array.from(event.target.files ?? [])
    setImages(nextFiles)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setErrorMessage('')

    try {
      const payload = buildPostPayload(form)
      const createdPostId = await createPost(payload, images)
      navigate(`/posts/${createdPostId}`)
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, '분실물 글을 등록하지 못했어요.'),
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="form-sidebar-grid grid gap-6">
        <section className="rounded-(--radius-panel) border border-(--border-subtle) bg-[color:var(--surface-card)] p-6 shadow-[var(--shadow-soft)]">
          <p className="text-sm text-(--text-muted)">
            등록에 필요한 장소 목록을 불러오는 중이에요...
          </p>
        </section>
      </div>
    )
  }

  return (
    <form className="form-sidebar-grid grid gap-6" onSubmit={handleSubmit}>
      <section className="overflow-hidden rounded-(--radius-panel) border border-(--border-subtle) bg-[color:var(--surface-card)] shadow-[var(--shadow-soft)]">
        <div className="map-stage-header p-6">
          <p className="text-sm font-semibold text-(--accent-strong)">
            Post Creation
          </p>
          <h1 className="mt-3 text-3xl font-semibold">
            분실물 등록 글을 새로 작성해 주세요.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-(--text-muted)">
            분실물 유형과 보관 장소를 함께 등록해 두면, 검색 화면과 상세
            화면에서 다른 사용자들이 더 빠르게 위치를 파악할 수 있어요.
          </p>
        </div>

        <section className="mx-auto max-w-90 rounded-(--radius-panel) border border-(--border-subtle) bg-[color:var(--surface-card)] p-5 shadow-[var(--shadow-soft)]">
          <div className="flex items-center gap-2">
            <Shapes className="h-4 w-4 text-(--accent-strong)" />
            <h2 className="text-xl font-semibold">작성 팁</h2>
          </div>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-(--text-muted)">
            <li>제목에는 물품 이름과 상황을 짧게 적어 두면 찾기 쉬워요.</li>
            <li>
              설명에는 색상, 특징, 분실 또는 습득 장소를 자세히 적어 주세요.
            </li>
            <li>
              보관 장소를 연결하면 다른 사용자가 위치를 더 빠르게 확인할 수
              있어요.
            </li>
          </ul>
        </section>

        <div className="grid gap-5 p-5">
          <label className="grid max-w-85.5 gap-2">
            <span className="text-sm font-medium">제목</span>
            <input
              value={form.title}
              onChange={(event) => updateField('title', event.target.value)}
              className="not-[]:border rounded-(--radius-card) border-(--border-subtle) bg-(--surface-soft) px-4 py-3 text-sm outline-none"
              placeholder="예: 학생회관 근처에서 지갑을 잃어버렸어요"
            />
          </label>

          <div className="grid max-w-85.5 gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-medium">글 유형</span>
              <select
                value={form.type}
                onChange={(event) =>
                  updateField('type', event.target.value as PostStatus)
                }
                className="rounded-[var(--radius-card)] border border-(--border-subtle) bg-(--surface-soft) px-4 py-3 text-sm outline-none"
              >
                <option value="LOST">LOST</option>
                <option value="FOUND">FOUND</option>
              </select>
            </label>

            <label className="grid max-w-85.5 gap-2">
              <span className="text-sm font-medium">카테고리</span>
              <select
                value={form.category}
                onChange={(event) =>
                  updateField('category', event.target.value)
                }
                className="rounded-[var(--radius-card)] border border-(--border-subtle) bg-(--surface-soft) px-4 py-3 text-sm outline-none"
              >
                {POST_CATEGORY_OPTIONS.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="grid max-w-85.5 gap-2">
            <span className="text-sm font-medium">연결할 보관 장소</span>
            <select
              value={form.locationId}
              onChange={(event) =>
                updateField('locationId', event.target.value)
              }
              className="rounded-[var(--radius-card)] border border-(--border-subtle) bg-(--surface-soft) px-4 py-3 text-sm outline-none"
            >
              <option value="">장소를 선택해 주세요</option>
              {sortedLocations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name} | {location.number}
                </option>
              ))}
            </select>
          </label>

          <label className="grid max-w-85.5 gap-2">
            <span className="text-sm font-medium">상세 설명</span>
            <textarea
              value={form.description}
              onChange={(event) =>
                updateField('description', event.target.value)
              }
              rows={6}
              className="resize-none rounded-[var(--radius-card)] border border-(--border-subtle) bg-(--surface-soft) px-4 py-3 text-sm outline-none"
              placeholder="예: 검은색 반지갑이고 학생증이 같이 들어 있었어요."
            />
          </label>

          <label className="grid max-w-85.5 gap-2">
            <span className="text-sm font-medium">사진 첨부</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImagesChange}
              className="rounded-[var(--radius-card)] border border-(--border-subtle) bg-(--surface-soft) px-4 py-3 text-sm outline-none file:mr-3 file:rounded-full file:border-0 file:bg-[color:var(--accent-soft)] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-(--accent-strong)"
            />
          </label>

          {images.length ? (
            <div className="rounded-[var(--radius-card)] bg-(--surface-soft) p-4 text-sm text-(--text-muted)">
              <p className="font-semibold text-[color:var(--text-strong)]">
                선택한 이미지 {images.length}장
              </p>
              <ul className="mt-2 space-y-1">
                {images.map((image) => (
                  <li key={`${image.name}-${image.size}`}>{image.name}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {errorMessage ? (
            <p className="rounded-[var(--radius-card)] border border-[color:var(--danger-border)] bg-[color:var(--danger-soft)] px-4 py-3 text-sm text-[color:var(--danger-strong)]">
              {errorMessage}
            </p>
          ) : null}
        </div>
      </section>

      <aside className="space-y-6">
        <section className="rounded-(--radius-panel) border border-(--border-subtle) bg-[color:var(--surface-card)] p-5 shadow-[var(--shadow-soft)]">
          <div className="flex items-center gap-2">
            <PencilLine className="h-4 w-4 text-(--accent-strong)" />
            <h2 className="text-xl font-semibold">등록 요약</h2>
          </div>

          <div className="mt-5 grid gap-4">
            <div className="rounded-[var(--radius-card)] bg-(--surface-soft) p-4">
              <p className="text-[11px] font-semibold tracking-[0.12em] text-(--text-muted) uppercase">
                글 유형
              </p>
              <p className="mt-2 text-base font-semibold">{form.type}</p>
            </div>

            <div className="rounded-[var(--radius-card)] bg-(--surface-soft) p-4">
              <p className="text-[11px] font-semibold tracking-[0.12em] text-(--text-muted) uppercase">
                카테고리
              </p>
              <p className="mt-2 text-base font-semibold">{form.category}</p>
            </div>

            <div className="rounded-[var(--radius-card)] bg-(--surface-soft) p-4">
              <p className="text-[11px] font-semibold tracking-[0.12em] text-(--text-muted) uppercase">
                선택 장소
              </p>
              <p className="mt-2 text-base font-semibold">
                {selectedLocation?.name ?? '아직 선택하지 않았어요'}
              </p>
              <p className="mt-1 text-sm text-(--text-muted)">
                {selectedLocation
                  ? `${selectedLocation.detail} | ${selectedLocation.number}`
                  : '장소를 선택하면 여기서 다시 확인할 수 있어요.'}
              </p>
            </div>

            <div className="rounded-[var(--radius-card)] bg-(--surface-soft) p-4">
              <div className="flex items-center gap-2 text-[color:var(--text-strong)]">
                <ImagePlus className="h-4 w-4 text-(--accent-strong)" />
                <span className="font-semibold">첨부 이미지</span>
              </div>
              <p className="mt-2 text-sm text-(--text-muted)">
                {images.length
                  ? `${images.length}장의 이미지가 첨부될 예정이에요.`
                  : '이미지는 선택 사항이에요.'}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={submitting || !sortedLocations.length}
              className="rounded-full bg-(--accent-strong) px-4 py-3 text-sm font-semibold text-white shadow-[var(--shadow-accent)] disabled:opacity-60"
            >
              {submitting ? '등록 중...' : '분실물 등록'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/posts')}
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

export default PostFormPage
