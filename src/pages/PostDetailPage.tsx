import { CalendarDays, ImageIcon, MapPinned } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getComments, type CommentDto } from '../features/comments/api/comments'
import {
  getLocation,
  type LocationDto,
} from '../features/locations/api/locations'
import {
  createNaverMapLink,
  hasLocationCoordinates,
} from '../features/locations/lib/locationCoordinates'
import { getPost, type PostDetailDto } from '../features/posts/api/posts'
import SectionPanel from '../shared/components/ui/SectionPanel'
import StatusBadge from '../shared/components/ui/StatusBadge'
import { API_BASE_URL } from '../shared/api/config'
import { getApiErrorMessage } from '../shared/utils/getApiErrorMessage'

function formatDateTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
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

function PostDetailPage() {
  const { postId } = useParams()
  const numericPostId = Number(postId)
  const [post, setPost] = useState<PostDetailDto | null>(null)
  const [location, setLocation] = useState<LocationDto | null>(null)
  const [comments, setComments] = useState<CommentDto[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadPostDetail = useCallback(async () => {
    if (!Number.isFinite(numericPostId)) {
      setErrorMessage('올바른 게시글을 찾을 수 없어요.')
      setLoading(false)
      return
    }

    setLoading(true)
    setErrorMessage(null)

    try {
      const nextPost = await getPost(numericPostId)
      setPost(nextPost)

      const [locationResult, commentsResult] = await Promise.allSettled([
        getLocation(nextPost.locationId),
        getComments(numericPostId),
      ])

      if (locationResult.status === 'fulfilled') {
        setLocation(locationResult.value)
      } else {
        setLocation(null)
      }

      if (commentsResult.status === 'fulfilled') {
        setComments(commentsResult.value)
      } else {
        setComments([])
      }

      const failedResult = [locationResult, commentsResult].find(
        (result) => result.status === 'rejected',
      )

      if (failedResult?.status === 'rejected') {
        setErrorMessage(
          getApiErrorMessage(
            failedResult.reason,
            '추가 정보를 불러오지 못했어요. 게시글 본문은 계속 확인할 수 있어요.',
          ),
        )
      }
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, '게시글 상세 정보를 불러오지 못했어요.'),
      )
      setPost(null)
      setLocation(null)
      setComments([])
    } finally {
      setLoading(false)
    }
  }, [numericPostId])

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadPostDetail()
    }, 0)

    return () => window.clearTimeout(timerId)
  }, [loadPostDetail])

  const mapLink = useMemo(() => {
    if (!location || !hasLocationCoordinates(location)) {
      return null
    }

    return createNaverMapLink(location.name, location)
  }, [location])

  if (loading) {
    return (
      <SectionPanel>
        <p className="text-sm text-(--text-muted)">
          게시글을 불러오는 중이에요...
        </p>
      </SectionPanel>
    )
  }

  if (!post) {
    return (
      <SectionPanel>
        <p className="text-sm text-(--danger-strong)">
          {errorMessage || '게시글을 찾을 수 없어요.'}
        </p>
      </SectionPanel>
    )
  }

  return (
    <div className="detail-sidebar-grid grid gap-6">
      <section className="space-y-6">
        <SectionPanel className="sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={post.type} />
            <span className="bg-(--surface-soft rounded-full px-2.5 py-1 text-xs font-medium text-(--text-muted)">
              {post.category}
            </span>
            <span className="rounded-full border border-(--border-subtle) px-2.5 py-1 text-xs font-medium text-(--text-muted)">
              게시글 #{post.id}
            </span>
          </div>

          <h1 className="mt-4 text-2xl font-semibold sm:text-3xl">
            {post.title}
          </h1>
          <p className="mt-3 text-sm leading-7 text-(--text-muted) sm:text-base">
            {post.description}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              ['등록 시간', formatDateTime(post.createdAt)],
              ['연결 장소', location?.name ?? `장소 #${post.locationId}`],
              ['댓글', `${comments.length}개`],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-(--radius-card) bg-(--surface-soft) p-4"
              >
                <p className="text-xs font-semibold tracking-wide text-(--text-muted) uppercase">
                  {label}
                </p>
                <p className="mt-2 text-sm font-medium">{value}</p>
              </div>
            ))}
          </div>

          {post.imageUrls.length ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {post.imageUrls.map((imageUrl) => (
                <img
                  key={imageUrl}
                  src={createAssetUrl(imageUrl)}
                  alt={post.title}
                  className="h-48 w-full rounded-(--radius-card) object-cover"
                />
              ))}
            </div>
          ) : (
            <div className="mt-6 flex items-center gap-2 rounded-(--radius-card) bg-(--surface-soft) px-4 py-3 text-sm text-(--text-muted)">
              <ImageIcon className="h-4 w-4" />
              등록된 사진이 없어요.
            </div>
          )}
        </SectionPanel>

        {location ? (
          <SectionPanel>
            <div className="flex items-center gap-2">
              <MapPinned className="h-4 w-4 text-(--accent-strong)" />
              <h2 className="text-xl font-semibold">연결된 장소</h2>
            </div>
            <div className="mt-4 rounded-(--radius-card) bg-(--surface-soft) p-4">
              <p className="text-base font-semibold">{location.name}</p>
              <p className="mt-2 text-sm leading-6 text-(--text-muted)">
                {location.detail}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  to={`/locations/${location.id}`}
                  className="rounded-full bg-(--accent-strong) px-4 py-2 text-sm font-semibold text-white shadow-(--shadow-accent)"
                >
                  장소 상세 보기
                </Link>
                {mapLink ? (
                  <a
                    href={mapLink}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-(--border-subtle) bg-white px-4 py-2 text-sm font-semibold"
                  >
                    네이버 지도 열기
                  </a>
                ) : null}
              </div>
            </div>
          </SectionPanel>
        ) : null}
      </section>

      <aside className="space-y-6">
        <SectionPanel>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-(--accent-strong)" />
            <h2 className="text-xl font-semibold">댓글</h2>
          </div>

          {errorMessage ? (
            <div className="mt-4 rounded-(--radius-card) border border-(--danger-border) bg-(--danger-soft) px-4 py-3 text-sm text-(--danger-strong)">
              {errorMessage}
            </div>
          ) : null}

          {comments.length ? (
            <div className="mt-4 space-y-3">
              {comments.map((comment) => (
                <article
                  key={comment.commentId}
                  className="rounded-(--radius-card) border border-(--border-subtle) p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">
                        사용자 #{comment.userId}
                      </p>
                      <p className="mt-1 text-xs text-(--text-muted)">
                        {formatDateTime(comment.createdAt)}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-(--text-muted)">
                    {comment.content}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-(--radius-card) border border-dashed border-(--border-subtle) px-4 py-8 text-center text-sm text-(--text-muted)">
              아직 등록된 댓글이 없어요.
            </div>
          )}
        </SectionPanel>

        <SectionPanel>
          <h2 className="text-xl font-semibold">다음으로 해볼 일</h2>
          <p className="mt-2 text-sm leading-6 text-(--text-muted)">
            연결된 장소에서 실제 보관 위치를 확인하거나 다른 분실물 글도 이어서
            살펴볼 수 있어요.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to="/posts"
              className="rounded-full bg-(--accent-strong) px-4 py-2 text-sm font-semibold text-white shadow-(--shadow-accent)"
            >
              목록으로 돌아가기
            </Link>
            <Link
              to="/api-status"
              className="rounded-full border border-(--border-subtle) bg-white px-4 py-2 text-sm font-semibold"
            >
              이용 가이드 보기
            </Link>
          </div>
        </SectionPanel>
      </aside>
    </div>
  )
}

export default PostDetailPage
