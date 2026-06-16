import {
  ImageIcon,
  MapPinned,
  MessageSquare,
  PencilLine,
  Trash2,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  createComment,
  deleteComment,
  getComments,
  type CommentDto,
} from '../features/comments/api/comments'
import {
  getLocation,
  type LocationDto,
} from '../features/locations/api/locations'
import {
  createNaverMapLink,
  hasLocationCoordinates,
} from '../features/locations/lib/locationCoordinates'
import { useAuthStore } from '../features/auth/store/authStore'
import { getPostCategoryLabel } from '../features/posts/constants'
import {
  deletePost,
  getPost,
  type PostDetailDto,
} from '../features/posts/api/posts'
import { getCurrentUserIdFromToken } from '../shared/auth/jwt'
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
  const navigate = useNavigate()
  const { postId } = useParams()
  const accessToken = useAuthStore((state) => state.accessToken)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const numericPostId = Number(postId)
  const [post, setPost] = useState<PostDetailDto | null>(null)
  const [location, setLocation] = useState<LocationDto | null>(null)
  const [comments, setComments] = useState<CommentDto[]>([])
  const [commentContent, setCommentContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [submittingComment, setSubmittingComment] = useState(false)
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(
    null,
  )
  const [deletingPost, setDeletingPost] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const currentUserId = useMemo(
    () => getCurrentUserIdFromToken(accessToken),
    [accessToken],
  )

  const loadComments = useCallback(async (targetPostId: number) => {
    const nextComments = await getComments(targetPostId)
    setComments(nextComments)
    return nextComments
  }, [])

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
        loadComments(numericPostId),
      ])

      if (locationResult.status === 'fulfilled') {
        setLocation(locationResult.value)
      } else {
        setLocation(null)
      }

      if (commentsResult.status === 'rejected') {
        setComments([])
      }

      const failedResult = [locationResult, commentsResult].find(
        (result) => result.status === 'rejected',
      )

      if (failedResult?.status === 'rejected') {
        setErrorMessage(
          getApiErrorMessage(
            failedResult.reason,
            '일부 정보를 불러오지 못했어요. 게시글 본문은 계속 확인할 수 있어요.',
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
  }, [loadComments, numericPostId])

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

  const canManagePost = currentUserId !== null && currentUserId === post?.userId

  async function handleSubmitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const content = commentContent.trim()

    if (!content) {
      setErrorMessage('댓글 내용을 입력해주세요.')
      return
    }

    if (!Number.isFinite(numericPostId)) {
      setErrorMessage('댓글을 등록할 게시글을 찾을 수 없어요.')
      return
    }

    if (!currentUserId) {
      setErrorMessage(
        '현재 사용자 정보를 확인할 수 없어 댓글을 등록하지 못했어요. 다시 로그인 후 시도해주세요.',
      )
      return
    }

    setSubmittingComment(true)
    setErrorMessage(null)

    try {
      await createComment(numericPostId, {
        userId: currentUserId,
        content,
      })
      setCommentContent('')
      await loadComments(numericPostId)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, '댓글을 등록하지 못했어요.'))
    } finally {
      setSubmittingComment(false)
    }
  }

  async function handleDeleteComment(commentId: number) {
    if (!Number.isFinite(numericPostId)) {
      setErrorMessage('댓글을 삭제할 게시글을 찾을 수 없어요.')
      return
    }

    const confirmed = window.confirm('이 댓글을 삭제할까요?')

    if (!confirmed) {
      return
    }

    setDeletingCommentId(commentId)
    setErrorMessage(null)

    try {
      await deleteComment(numericPostId, commentId)
      await loadComments(numericPostId)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, '댓글을 삭제하지 못했어요.'))
    } finally {
      setDeletingCommentId(null)
    }
  }

  async function handleDeletePost() {
    if (!post) {
      return
    }

    const confirmed = window.confirm('이 게시글을 삭제할까요?')

    if (!confirmed) {
      return
    }

    setDeletingPost(true)
    setErrorMessage(null)

    try {
      await deletePost(post.id)
      navigate('/posts')
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, '게시글을 삭제하지 못했어요.'))
    } finally {
      setDeletingPost(false)
    }
  }

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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={post.type} />
              <span className="rounded-full bg-(--surface-soft) px-2.5 py-1 text-xs font-medium text-(--text-muted)">
                {getPostCategoryLabel(post.category)}
              </span>
              <span className="rounded-full border border-(--border-subtle) px-2.5 py-1 text-xs font-medium text-(--text-muted)">
                게시글 #{post.id}
              </span>
            </div>

            {canManagePost ? (
              <div className="flex flex-wrap gap-2">
                <Link
                  to={`/posts/${post.id}/edit`}
                  className="inline-flex items-center gap-2 rounded-full border border-(--border-subtle) bg-white px-3.5 py-2 text-[13px] font-semibold"
                >
                  <PencilLine className="h-4 w-4" />
                  수정
                </Link>
                <button
                  type="button"
                  disabled={deletingPost}
                  onClick={() => void handleDeletePost()}
                  className="inline-flex items-center gap-2 rounded-full border border-[color:var(--danger-border)] bg-white px-3.5 py-2 text-[13px] font-semibold text-[color:var(--danger-strong)] disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                  {deletingPost ? '삭제 중...' : '삭제'}
                </button>
              </div>
            ) : null}
          </div>

          <h1 className="mt-4 text-2xl font-semibold sm:text-3xl">
            {post.title}
          </h1>
          <p className="mt-3 text-sm leading-7 text-(--text-muted) sm:text-base">
            {post.description}
          </p>

          <div className="post-detail-summary-grid mt-6 grid gap-3 sm:grid-cols-3">
            {[
              ['등록 시각', formatDateTime(post.createdAt)],
              ['보관 장소', location?.name ?? `장소 #${post.locationId}`],
              ['댓글 수', `${comments.length}개`],
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
              등록된 이미지가 없어요.
            </div>
          )}
        </SectionPanel>

        {location ? (
          <SectionPanel>
            <div className="flex items-center gap-2">
              <MapPinned className="h-4 w-4 text-(--accent-strong)" />
              <h2 className="text-xl font-semibold">연결된 보관 장소</h2>
            </div>
            <div className="mt-4 rounded-(--radius-card) bg-(--surface-soft) p-4">
              <p className="text-base font-semibold">{location.name}</p>
              <p className="mt-2 text-sm leading-6 text-(--text-muted)">
                {location.detail}
              </p>
              <div className="post-detail-actions mt-4 flex flex-wrap gap-3">
                <Link
                  to={`/locations/${location.id}`}
                  className="rounded-full bg-(--accent-strong) px-4 py-2.5 text-[13px] font-semibold whitespace-nowrap text-white shadow-(--shadow-accent)"
                >
                  장소 상세 보기
                </Link>
                {mapLink ? (
                  <a
                    href={mapLink}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-(--border-subtle) bg-white px-4 py-2.5 text-[13px] font-semibold whitespace-nowrap"
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
            <MessageSquare className="h-4 w-4 text-(--accent-strong)" />
            <h2 className="text-xl font-semibold">댓글</h2>
          </div>

          {isAuthenticated ? (
            <form onSubmit={handleSubmitComment} className="mt-4 grid gap-3">
              <textarea
                value={commentContent}
                onChange={(event) => setCommentContent(event.target.value)}
                rows={4}
                className="resize-none rounded-[var(--radius-card)] border border-(--border-subtle) bg-(--surface-soft) px-4 py-3 text-sm leading-6 outline-none"
                placeholder="게시글과 관련된 위치 정보나 발견 상황을 댓글로 남겨보세요."
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingComment}
                  className="rounded-full bg-(--accent-strong) px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-accent)] disabled:opacity-60"
                >
                  {submittingComment ? '등록 중...' : '댓글 등록'}
                </button>
              </div>
            </form>
          ) : (
            <p className="mt-4 text-sm leading-6 text-(--text-muted)">
              댓글 작성은 로그인 후 이용할 수 있어요.
            </p>
          )}

          {errorMessage ? (
            <div className="mt-4 rounded-(--radius-card) border border-(--danger-border) bg-(--danger-soft) px-4 py-3 text-sm text-(--danger-strong)">
              {errorMessage}
            </div>
          ) : null}

          {comments.length ? (
            <div className="mt-4 space-y-3">
              {comments.map((comment) => {
                const canDeleteComment =
                  currentUserId !== null && currentUserId === comment.userId

                return (
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

                      {canDeleteComment ? (
                        <button
                          type="button"
                          disabled={deletingCommentId === comment.commentId}
                          onClick={() =>
                            void handleDeleteComment(comment.commentId)
                          }
                          className="rounded-full border border-[color:var(--danger-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[color:var(--danger-strong)] disabled:opacity-60"
                        >
                          {deletingCommentId === comment.commentId
                            ? '삭제 중...'
                            : '삭제'}
                        </button>
                      ) : null}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-(--text-muted)">
                      {comment.content}
                    </p>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="mt-4 rounded-(--radius-card) border border-dashed border-(--border-subtle) px-4 py-8 text-center text-sm text-(--text-muted)">
              아직 등록된 댓글이 없어요.
            </div>
          )}
        </SectionPanel>
      </aside>
    </div>
  )
}

export default PostDetailPage
