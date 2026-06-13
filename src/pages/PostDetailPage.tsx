import { MessageSquare, RefreshCw, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { posts } from '../app/data/prototype'
import {
  createComment,
  deleteComment,
  getComments,
  type CommentDto,
} from '../features/comments/api/comments'
import SectionPanel from '../shared/components/ui/SectionPanel'
import StatusBadge from '../shared/components/ui/StatusBadge'
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

function PostDetailPage() {
  const { postId } = useParams()
  const numericPostId = Number(postId)

  const basePost = useMemo(
    () =>
      posts.find((item) => item.id === numericPostId) ?? {
        id: numericPostId,
        title: `게시글 #${postId}`,
        category: 'API 응답 대기',
        place: '게시글 본문 API 없음',
        date: '정보 없음',
        timeSlot: '정보 없음',
        description:
          '현재 API 스펙에는 게시글 본문 조회 엔드포인트가 없습니다. 그래서 상세 상단은 프로토 데이터 또는 대체 문구로 보여주고, 댓글 영역만 실제 API와 연결합니다.',
        status: 'LOST' as const,
        comments: 0,
      },
    [numericPostId, postId],
  )

  const [comments, setComments] = useState<CommentDto[]>([])
  const [commentBody, setCommentBody] = useState('')
  const [userIdInput, setUserIdInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadComments = useCallback(async () => {
    if (!Number.isFinite(numericPostId)) {
      setErrorMessage('유효한 게시글 ID가 아닙니다.')
      setLoading(false)
      return
    }

    setLoading(true)
    setErrorMessage(null)

    try {
      const nextComments = await getComments(numericPostId)
      setComments(nextComments)
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, '댓글 목록을 불러오지 못했습니다.'),
      )
    } finally {
      setLoading(false)
    }
  }, [numericPostId])

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadComments()
    }, 0)

    return () => window.clearTimeout(timerId)
  }, [loadComments])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!commentBody.trim()) {
      setErrorMessage('댓글 내용을 입력해주세요.')
      return
    }

    const userId = Number(userIdInput)

    if (!Number.isInteger(userId) || userId <= 0) {
      setErrorMessage('API 스펙에 맞게 userId를 숫자로 입력해주세요.')
      return
    }

    setSubmitting(true)
    setErrorMessage(null)

    try {
      await createComment(numericPostId, {
        userId,
        content: commentBody.trim(),
      })
      setCommentBody('')
      await loadComments()
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, '댓글을 등록하지 못했습니다.'),
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteComment(commentId: number) {
    const shouldDelete = window.confirm('이 댓글을 삭제할까요?')

    if (!shouldDelete) {
      return
    }

    setErrorMessage(null)

    try {
      await deleteComment(numericPostId, commentId)
      await loadComments()
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, '댓글을 삭제하지 못했습니다.'),
      )
    }
  }

  return (
    <div className="detail-sidebar-grid grid gap-6">
      <section className="space-y-6">
        <SectionPanel className="sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={basePost.status} />
            <span className="rounded-full bg-(--surface-soft) px-2.5 py-1 text-xs font-medium text-(--text-muted)">
              {basePost.category}
            </span>
            <span className="rounded-full border border-(--border-subtle) px-2.5 py-1 text-xs font-medium text-(--text-muted)">
              게시글 ID {basePost.id}
            </span>
          </div>

          <h1 className="mt-4 text-2xl font-semibold sm:text-3xl">
            {basePost.title}
          </h1>
          <p className="mt-3 text-sm leading-7 text-(--text-muted) sm:text-base">
            {basePost.description}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              ['장소', basePost.place],
              ['분실 추정', `${basePost.date} ${basePost.timeSlot}`],
              ['댓글', `${comments.length}개`],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-(--radius-card) bg-(--surface-soft) p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-(--text-muted)">
                  {label}
                </p>
                <p className="mt-2 text-sm font-medium">{value}</p>
              </div>
            ))}
          </div>
        </SectionPanel>

        <SectionPanel>
          <h2 className="text-xl font-semibold">현재 연결 범위</h2>
          <ul className="mt-4 grid gap-3 text-sm leading-6 text-(--text-muted)">
            <li>게시글 본문 조회 API는 아직 명세에 없어서 상세 상단은 프로토 데이터로 표시합니다.</li>
            <li>댓글 목록 조회, 등록, 삭제는 실제 API 스펙 기준으로 연결했습니다.</li>
            <li>댓글 작성 시 JWT와 별개로 request body에 userId를 넣어야 하는 현재 스펙 제약을 그대로 반영했습니다.</li>
          </ul>
        </SectionPanel>
      </section>

      <aside className="space-y-6">
        <SectionPanel>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">댓글</h2>
              <p className="mt-1 text-sm text-(--text-muted)">
                `GET/POST/DELETE /v1/posts/{numericPostId}/comments`
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadComments()}
              className="inline-flex items-center gap-2 rounded-full border border-(--border-subtle) px-3 py-2 text-sm font-medium"
            >
              <RefreshCw className="h-4 w-4" />
              새로고침
            </button>
          </div>

          {errorMessage ? (
            <div className="mt-4 rounded-(--radius-card) border border-(--danger-border) bg-(--danger-soft) px-4 py-3 text-sm text-(--danger-strong)">
              {errorMessage}
            </div>
          ) : null}

          {loading ? (
            <div className="mt-4 rounded-(--radius-card) bg-(--surface-soft) px-4 py-8 text-center text-sm text-(--text-muted)">
              댓글을 불러오는 중입니다...
            </div>
          ) : null}

          {!loading && comments.length === 0 ? (
            <div className="mt-4 rounded-(--radius-card) border border-dashed border-(--border-subtle) px-4 py-8 text-center text-sm text-(--text-muted)">
              아직 등록된 댓글이 없습니다.
            </div>
          ) : null}

          {!loading && comments.length > 0 ? (
            <div className="mt-4 space-y-3">
              {comments.map((comment) => (
                <article
                  key={comment.commentId}
                  className="rounded-(--radius-card) border border-(--border-subtle) p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">사용자 #{comment.userId}</p>
                      <p className="mt-1 text-xs text-(--text-muted)">
                        {formatDateTime(comment.createdAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleDeleteComment(comment.commentId)}
                      className="inline-flex items-center gap-1 rounded-full border border-(--danger-border) bg-(--danger-soft) px-2.5 py-1 text-xs font-semibold text-(--danger-strong)"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      삭제
                    </button>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-(--text-muted)">
                    {comment.content}
                  </p>
                </article>
              ))}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-[140px_minmax(0,1fr)]">
              <label className="space-y-2 text-sm font-medium">
                <span>userId</span>
                <input
                  value={userIdInput}
                  onChange={(event) => setUserIdInput(event.target.value)}
                  inputMode="numeric"
                  className="w-full rounded-(--radius-card) border border-(--border-subtle) bg-(--surface-soft) px-4 py-3 text-sm outline-none"
                  placeholder="예: 1"
                />
              </label>

              <label className="space-y-2 text-sm font-medium">
                <span>댓글 내용</span>
                <textarea
                  value={commentBody}
                  onChange={(event) => setCommentBody(event.target.value)}
                  rows={4}
                  className="w-full rounded-(--radius-card) border border-(--border-subtle) bg-(--surface-soft) px-4 py-3 text-sm outline-none placeholder:text-(--text-muted)"
                  placeholder="API 스펙 기준 댓글 내용을 입력하세요."
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs leading-5 text-(--text-muted)">
                현재 백엔드는 댓글 작성 시 JWT와 별개로 request body의 userId를 사용합니다.
              </p>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-full bg-(--accent-strong) px-4 py-2 text-sm font-semibold text-white shadow-(--shadow-accent) disabled:cursor-not-allowed disabled:opacity-60"
              >
                <MessageSquare className="h-4 w-4" />
                {submitting ? '등록 중...' : '댓글 등록'}
              </button>
            </div>
          </form>
        </SectionPanel>

        <SectionPanel>
          <h2 className="text-xl font-semibold">다음 단계</h2>
          <p className="mt-2 text-sm leading-6 text-(--text-muted)">
            게시글 본문 CRUD와 알림, 마이페이지 API가 추가되면 이 상세 화면도 실제 데이터로
            자연스럽게 확장할 수 있습니다.
          </p>
          <Link
            to="/api-status"
            className="mt-4 inline-flex text-sm font-semibold text-(--accent-strong)"
          >
            현재 API 범위 다시 보기
          </Link>
        </SectionPanel>
      </aside>
    </div>
  )
}

export default PostDetailPage
