import {
  FileText,
  LogIn,
  LogOut,
  MessageSquare,
  Thermometer,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../features/auth/store/authStore'
import {
  getMyPageComments,
  getMyPagePosts,
  getMyPageProfile,
  getMyPageTemperature,
  type MyPageCommentDto,
  type MyPagePostDto,
  type MyPageProfileDto,
} from '../features/mypage/api/mypage'
import SectionPanel from '../shared/components/ui/SectionPanel'
import { getApiErrorMessage } from '../shared/utils/getApiErrorMessage'

function MyPage() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const clearTokens = useAuthStore((state) => state.clearTokens)
  const clearVerifiedEmail = useAuthStore((state) => state.clearVerifiedEmail)

  const [profile, setProfile] = useState<MyPageProfileDto | null>(null)
  const [temperature, setTemperature] = useState<number | null>(null)
  const [posts, setPosts] = useState<MyPagePostDto[]>([])
  const [comments, setComments] = useState<MyPageCommentDto[]>([])
  const [loading, setLoading] = useState(isAuthenticated)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      setProfile(null)
      setTemperature(null)
      setPosts([])
      setComments([])
      setErrorMessage('')
      setLoading(false)
      return
    }

    let mounted = true

    async function loadMyPage() {
      setLoading(true)
      setErrorMessage('')

      const [profileResult, temperatureResult, postsResult, commentsResult] =
        await Promise.allSettled([
          getMyPageProfile(),
          getMyPageTemperature(),
          getMyPagePosts(),
          getMyPageComments(),
        ])

      if (!mounted) {
        return
      }

      if (profileResult.status === 'fulfilled') {
        setProfile(profileResult.value)
      }

      if (temperatureResult.status === 'fulfilled') {
        setTemperature(temperatureResult.value.temperature)
      }

      if (postsResult.status === 'fulfilled') {
        setPosts(postsResult.value)
      }

      if (commentsResult.status === 'fulfilled') {
        setComments(commentsResult.value)
      }

      const failedResult = [
        profileResult,
        temperatureResult,
        postsResult,
        commentsResult,
      ].find((result) => result.status === 'rejected')

      if (failedResult?.status === 'rejected') {
        setErrorMessage(
          getApiErrorMessage(
            failedResult.reason,
            '마이페이지 정보를 모두 불러오지 못했어요. 잠시 후 다시 확인해 주세요.',
          ),
        )
      }

      setLoading(false)
    }

    void loadMyPage()

    return () => {
      mounted = false
    }
  }, [isAuthenticated])

  function handleLogout() {
    clearVerifiedEmail()
    clearTokens()
    navigate('/auth/login', { replace: true })
  }

  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <SectionPanel className="p-6">
          <div className="flex items-start gap-4">
            <span className="rounded-full bg-(--surface-soft) p-3">
              <LogIn className="h-5 w-5 text-(--accent-strong)" />
            </span>
            <div>
              <h1 className="text-3xl font-semibold">
                로그인 후 내 정보를 확인해 보세요
              </h1>
              <p className="mt-3 text-sm leading-6 text-(--text-muted)">
                마이페이지에서 닉네임과 학번, 활동 온도, 작성한 글과 댓글을 한
                번에 확인할 수 있어요.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  to="/auth/login"
                  className="rounded-full bg-(--accent-strong) px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-accent)]"
                >
                  로그인하기
                </Link>
                <Link
                  to="/locations"
                  className="rounded-full border border-(--border-subtle) bg-white px-4 py-2 text-sm font-semibold"
                >
                  장소 둘러보기
                </Link>
              </div>
            </div>
          </div>
        </SectionPanel>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3 px-1">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-semibold">내 정보</h1>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-(--border-subtle) bg-white px-3.5 py-2 text-[13px] font-semibold text-(--text-muted)"
          >
            <LogOut className="h-4 w-4 text-red-900" />
            <span className="text-red-900">로그아웃</span>
          </button>
        </div>

        <div className="overflow-hidden rounded-[20px] border border-(--border-subtle) bg-white">
          {[
            {
              label: '계정 이메일',
              value: profile?.email ?? '계정 정보를 불러오는 중',
              valueClassName: 'break-all',
            },
            {
              label: '닉네임',
              value: profile?.nickname ?? (loading ? '불러오는 중' : '-'),
              valueClassName: '',
            },
            {
              label: '학번',
              value: profile?.studentNumber ?? (loading ? '불러오는 중' : '-'),
              valueClassName: '',
            },
            {
              label: '활동 온도',
              value:
                typeof temperature === 'number'
                  ? `${temperature}도`
                  : loading
                    ? '불러오는 중'
                    : '-',
              valueClassName: 'text-(--accent-strong)',
            },
          ].map((item, index, items) => (
            <div
              key={item.label}
              className={[
                'flex items-start justify-between gap-4 px-4 py-3',
                index < items.length - 1 ? 'border-b border-(--border-subtle)' : '',
              ].join(' ')}
            >
              <p className="shrink-0 text-sm text-(--text-muted)">{item.label}</p>
              <div className="flex items-center gap-2">
                {item.label === '활동 온도' ? (
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-(--accent-soft)">
                    <Thermometer className="h-3.5 w-3.5 text-(--accent-strong)" />
                  </span>
                ) : null}
                <p
                  className={[
                    'text-right text-sm font-semibold',
                    item.valueClassName,
                  ].join(' ')}
                >
                  {item.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {errorMessage ? (
        <SectionPanel>
          <p className="text-sm text-[color:var(--danger-strong)]">
            {errorMessage}
          </p>
        </SectionPanel>
      ) : null}

      <div className="detail-sidebar-grid grid gap-6">
        <SectionPanel>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-(--accent-strong)" />
            <h2 className="text-xl font-semibold">내가 작성한 글</h2>
          </div>
          {loading ? (
            <p className="mt-4 text-sm text-(--text-muted)">
              글 목록을 불러오는 중이에요.
            </p>
          ) : posts.length ? (
            <div className="mt-4 grid gap-3">
              {posts.map((post) => (
                <Link
                  key={post.postId}
                  to={`/posts/${post.postId}`}
                  className="rounded-[var(--radius-card)] border border-(--border-subtle) p-4 transition hover:bg-(--surface-soft)"
                >
                  <p className="text-sm font-semibold">{post.title}</p>
                  <p className="mt-2 text-sm text-(--text-muted)">
                    게시글 #{post.postId}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-(--text-muted)">
              아직 작성한 글이 없어요.
            </p>
          )}
        </SectionPanel>

        <SectionPanel>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-(--accent-strong)" />
            <h2 className="text-xl font-semibold">내가 남긴 댓글</h2>
          </div>
          {loading ? (
            <p className="mt-4 text-sm text-(--text-muted)">
              댓글 목록을 불러오는 중이에요.
            </p>
          ) : comments.length ? (
            <div className="mt-4 grid gap-3">
              {comments.map((comment) => (
                <article
                  key={comment.commentId}
                  className="rounded-[var(--radius-card)] border border-(--border-subtle) p-4"
                >
                  <p className="text-sm font-semibold">
                    댓글 #{comment.commentId}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-(--text-muted)">
                    {comment.content}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-(--text-muted)">
              아직 남긴 댓글이 없어요.
            </p>
          )}
        </SectionPanel>
      </div>
    </div>
  )
}

export default MyPage
