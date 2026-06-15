import { ImagePlus, PencilLine, Shapes } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getLocations,
  type LocationDto,
} from '../features/locations/api/locations'
import {
  getPostCategoryLabel,
  getPostStatusLabel,
  POST_CATEGORY_OPTIONS,
  POST_STATUS_OPTIONS,
} from '../features/posts/constants'
import {
  createPost,
  getPost,
  updatePost,
  type PostCreateRequest,
  type PostDetailDto,
} from '../features/posts/api/posts'
import type { PostCategory, PostStatus } from '../features/posts/types'
import { API_BASE_URL } from '../shared/api/config'
import { getApiErrorMessage } from '../shared/utils/getApiErrorMessage'

type PostFormPageProps = {
  mode: 'create' | 'edit'
}

type PostFormValues = {
  title: string
  description: string
  type: PostStatus
  category: PostCategory
  locationId: string
}

const EMPTY_FORM: PostFormValues = {
  title: '',
  description: '',
  type: 'LOST',
  category: 'ELECTRONICS',
  locationId: '',
}

function createAssetUrl(path: string) {
  if (!path) {
    return path
  }

  if (/^https?:\/\//.test(path)) {
    return path
  }

  if (!API_BASE_URL) {
    return path
  }

  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

function buildPostPayload(values: PostFormValues): PostCreateRequest {
  const title = values.title.trim()
  const description = values.description.trim()
  const locationId = Number(values.locationId)

  if (!title) {
    throw new Error('제목을 입력해주세요.')
  }

  if (!description) {
    throw new Error('상세 설명을 입력해주세요.')
  }

  if (!Number.isInteger(locationId) || locationId <= 0) {
    throw new Error('보관 장소를 선택해주세요.')
  }

  return {
    title,
    description,
    type: values.type,
    category: values.category,
    locationId,
  }
}

function createFormValues(post: PostDetailDto): PostFormValues {
  return {
    title: post.title,
    description: post.description,
    type: post.type,
    category: post.category,
    locationId: String(post.locationId),
  }
}

function PostFormPage({ mode }: PostFormPageProps) {
  const navigate = useNavigate()
  const { postId } = useParams()
  const isEdit = mode === 'edit'
  const [form, setForm] = useState<PostFormValues>(EMPTY_FORM)
  const [locations, setLocations] = useState<LocationDto[]>([])
  const [images, setImages] = useState<File[]>([])
  const [existingPost, setExistingPost] = useState<PostDetailDto | null>(null)
  const [initialPayload, setInitialPayload] = useState<PostCreateRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const loadForm = useCallback(async () => {
    setLoading(true)
    setErrorMessage('')

    try {
      const locationPromise = getLocations()
      const postPromise = isEdit
        ? (() => {
            if (!postId) {
              throw new Error('수정할 게시글을 찾을 수 없어요.')
            }

            return getPost(Number(postId))
          })()
        : Promise.resolve(null)

      const [nextLocations, nextPost] = await Promise.all([locationPromise, postPromise])

      setLocations(nextLocations)

      if (nextPost) {
        const nextForm = createFormValues(nextPost)
        setExistingPost(nextPost)
        setForm(nextForm)
        setInitialPayload(buildPostPayload(nextForm))
      } else {
        setExistingPost(null)
        setForm(EMPTY_FORM)
        setInitialPayload(null)
      }
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          isEdit
            ? '게시글 수정 정보를 불러오지 못했어요.'
            : '게시글 작성에 필요한 정보를 불러오지 못했어요.',
        ),
      )
    } finally {
      setLoading(false)
    }
  }, [isEdit, postId])

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadForm()
    }, 0)

    return () => window.clearTimeout(timerId)
  }, [loadForm])

  const sortedLocations = useMemo(
    () => [...locations].sort((left, right) => left.name.localeCompare(right.name)),
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

      if (isEdit) {
        if (!postId) {
          throw new Error('수정할 게시글을 찾을 수 없어요.')
        }

        const isSamePayload =
          initialPayload !== null &&
          JSON.stringify(payload) === JSON.stringify(initialPayload)

        if (isSamePayload && images.length === 0) {
          throw new Error('변경된 내용이 없어요.')
        }

        await updatePost(Number(postId), payload, images)
        navigate(`/posts/${postId}`)
        return
      }

      const createdPostId = await createPost(payload, images)
      navigate(`/posts/${createdPostId}`)
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          isEdit ? '게시글을 수정하지 못했어요.' : '게시글을 등록하지 못했어요.',
        ),
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="form-sidebar-grid grid gap-6">
        <section className="rounded-(--radius-panel) border border-(--border-subtle) bg-[color:var(--surface-card)] p-6 shadow-[var(--shadow-soft)]">
          <p className="text-sm leading-6 text-(--text-muted)">
            게시글 폼에 필요한 정보를 불러오는 중이에요...
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
            {isEdit ? '게시글 수정' : '게시글 등록'}
          </p>
          <h1 className="mt-3 text-3xl font-semibold">
            {isEdit ? '최신 API 스펙에 맞춰 게시글을 수정해주세요.' : '분실물/습득물 게시글을 작성해주세요.'}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-(--text-muted)">
            게시글 수정 API는 `PATCH` 이지만 실제로는 전체 필드를 다시 보내는 방식이라서,
            프론트에서도 제목, 설명, 상태, 카테고리, 보관 장소를 함께 전송합니다.
          </p>
        </div>

        <section className="mx-auto max-w-90 rounded-(--radius-panel) border border-(--border-subtle) bg-[color:var(--surface-card)] p-5 shadow-[var(--shadow-soft)]">
          <div className="flex items-center gap-2">
            <Shapes className="h-4 w-4 text-(--accent-strong)" />
            <h2 className="text-xl font-semibold">작성 안내</h2>
          </div>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-(--text-muted)">
            <li>카테고리는 최신 API 스펙 값인 전자기기, 지갑, 패션잡화, 도서, 기타만 전송합니다.</li>
            <li>이미지를 새로 선택하면 기존 이미지를 교체하고, 선택하지 않으면 기존 이미지가 유지됩니다.</li>
            <li>보관 장소를 연결하면 목록과 상세 화면에서 위치 정보를 함께 보여줄 수 있어요.</li>
          </ul>
        </section>

        <div className="grid gap-5 p-5">
          <label className="grid max-w-85.5 gap-2">
            <span className="text-sm font-medium">제목</span>
            <input
              value={form.title}
              onChange={(event) => updateField('title', event.target.value)}
              className="rounded-(--radius-card) border border-(--border-subtle) bg-(--surface-soft) px-4 py-3 text-sm outline-none"
              placeholder="예: 학생회관 근처에서 검은색 지갑을 잃어버렸어요"
            />
          </label>

          <div className="grid max-w-85.5 gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-medium">상태</span>
              <select
                value={form.type}
                onChange={(event) =>
                  updateField('type', event.target.value as PostStatus)
                }
                className="rounded-[var(--radius-card)] border border-(--border-subtle) bg-(--surface-soft) px-4 py-3 text-sm outline-none"
              >
                {POST_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid max-w-85.5 gap-2">
              <span className="text-sm font-medium">카테고리</span>
              <select
                value={form.category}
                onChange={(event) =>
                  updateField('category', event.target.value as PostCategory)
                }
                className="rounded-[var(--radius-card)] border border-(--border-subtle) bg-(--surface-soft) px-4 py-3 text-sm outline-none"
              >
                {POST_CATEGORY_OPTIONS.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="grid max-w-85.5 gap-2">
            <span className="text-sm font-medium">보관 장소</span>
            <select
              value={form.locationId}
              onChange={(event) => updateField('locationId', event.target.value)}
              className="rounded-[var(--radius-card)] border border-(--border-subtle) bg-(--surface-soft) px-4 py-3 text-sm outline-none"
            >
              <option value="">보관 장소를 선택해주세요.</option>
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
              onChange={(event) => updateField('description', event.target.value)}
              rows={6}
              className="resize-none rounded-[var(--radius-card)] border border-(--border-subtle) bg-(--surface-soft) px-4 py-3 text-sm leading-6 outline-none"
              placeholder="분실/습득 시각, 색상, 특징, 발견 장소 등 찾는 데 도움이 되는 정보를 적어주세요."
            />
          </label>

          <label className="grid max-w-85.5 gap-2">
            <span className="text-sm font-medium">
              {isEdit ? '이미지 교체' : '이미지 첨부'}
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImagesChange}
              className="rounded-[var(--radius-card)] border border-(--border-subtle) bg-(--surface-soft) px-4 py-3 text-sm outline-none file:mr-3 file:rounded-full file:border-0 file:bg-[color:var(--accent-soft)] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-(--accent-strong)"
            />
          </label>

          {isEdit && existingPost?.imageUrls.length ? (
            <div className="grid gap-3">
              <p className="text-sm font-medium">현재 등록된 이미지</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {existingPost.imageUrls.map((imageUrl) => (
                  <img
                    key={imageUrl}
                    src={createAssetUrl(imageUrl)}
                    alt={existingPost.title}
                    className="h-40 w-full rounded-[var(--radius-card)] object-cover"
                  />
                ))}
              </div>
              <p className="text-sm leading-6 text-(--text-muted)">
                새 이미지를 선택하지 않으면 현재 이미지가 그대로 유지돼요.
              </p>
            </div>
          ) : null}

          {images.length ? (
            <div className="rounded-[var(--radius-card)] bg-(--surface-soft) p-4 text-sm leading-6 text-(--text-muted)">
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
            <p className="rounded-[var(--radius-card)] border border-[color:var(--danger-border)] bg-[color:var(--danger-soft)] px-4 py-3 text-sm leading-6 text-[color:var(--danger-strong)]">
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
              <p className="text-[11px] font-semibold tracking-[0.08em] text-(--text-muted)">
                상태
              </p>
              <p className="mt-2 text-base font-semibold">
                {getPostStatusLabel(form.type)}
              </p>
            </div>

            <div className="rounded-[var(--radius-card)] bg-(--surface-soft) p-4">
              <p className="text-[11px] font-semibold tracking-[0.08em] text-(--text-muted)">
                카테고리
              </p>
              <p className="mt-2 text-base font-semibold">
                {getPostCategoryLabel(form.category)}
              </p>
            </div>

            <div className="rounded-[var(--radius-card)] bg-(--surface-soft) p-4">
              <p className="text-[11px] font-semibold tracking-[0.08em] text-(--text-muted)">
                선택 장소
              </p>
              <p className="mt-2 text-base font-semibold">
                {selectedLocation?.name ?? '아직 선택하지 않았어요'}
              </p>
              <p className="mt-1 text-sm leading-6 text-(--text-muted)">
                {selectedLocation
                  ? `${selectedLocation.detail} | ${selectedLocation.number}`
                  : '보관 장소를 고르면 여기에서 다시 확인할 수 있어요.'}
              </p>
            </div>

            <div className="rounded-[var(--radius-card)] bg-(--surface-soft) p-4">
              <div className="flex items-center gap-2 text-[color:var(--text-strong)]">
                <ImagePlus className="h-4 w-4 text-(--accent-strong)" />
                <span className="font-semibold">
                  {isEdit ? '교체할 이미지' : '첨부 이미지'}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-(--text-muted)">
                {images.length
                  ? `${images.length}장의 이미지를 전송할 예정이에요.`
                  : isEdit
                    ? '이미지를 새로 고르지 않으면 기존 이미지가 유지돼요.'
                    : '이미지 첨부는 선택 사항이에요.'}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={submitting || !sortedLocations.length}
              className="rounded-full bg-(--accent-strong) px-4 py-3 text-sm font-semibold text-white shadow-[var(--shadow-accent)] disabled:opacity-60"
            >
              {submitting
                ? isEdit
                  ? '수정 중...'
                  : '등록 중...'
                : isEdit
                  ? '게시글 수정'
                  : '게시글 등록'}
            </button>
            <button
              type="button"
              onClick={() => navigate(isEdit && postId ? `/posts/${postId}` : '/posts')}
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
