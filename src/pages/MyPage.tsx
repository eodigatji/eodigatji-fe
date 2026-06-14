import {
  FileText,
  LogIn,
  MessageSquare,
  Thermometer,
  UserRound,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getMyPageComments,
  getMyPagePosts,
  getMyPageProfile,
  getMyPageTemperature,
  type MyPageCommentDto,
  type MyPagePostDto,
  type MyPageProfileDto,
} from '../features/mypage/api/mypage'
import { useAuthStore } from '../features/auth/store/authStore'
import SectionPanel from '../shared/components/ui/SectionPanel'
import { getApiErrorMessage } from '../shared/utils/getApiErrorMessage'

function MyPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const [profile, setProfile] = useState<MyPageProfileDto | null>(null)
  const [temperature, setTemperature] = useState<number | null>(null)
  const [posts, setPosts] = useState<MyPagePostDto[]>([])
  const [comments, setComments] = useState<MyPageCommentDto[]>([])
  const [loading, setLoading] = useState(isAuthenticated)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
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
            '내 정보를 모두 불러오지 못했어요. 잠시 후 다시 확인해 주세요.',
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
                로그인하고 내 정보를 확인해 보세요
              </h1>
              <p className="mt-3 text-sm leading-7 text-(--text-muted)">
                마이페이지에서 닉네임과 학번, 활동 온도, 내가 쓴 글과 댓글을
                간단하게 확인할 수 있어요.
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
                  지도 먼저 보기
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
      <SectionPanel className="p-6">
        <div className="profile-summary-grid grid gap-6">
          <div>
            <p className="text-sm font-semibold text-(--accent-strong)">
              내 계정
            </p>
            <h1 className="mt-2 text-3xl font-semibold">
              {profile ? `${profile.nickname}님의 활동 화면` : '내 활동 화면'}
            </h1>
            <p className="mt-3 text-sm leading-7 text-(--text-muted)">
              학교 계정 정보와 내가 작성한 글, 댓글을 간단하게 확인할 수 있어요.
            </p>
          </div>
          <div className="rounded-[var(--radius-card)] bg-(--surface-soft) p-5">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-white p-2">
                <UserRound className="h-5 w-5 text-(--accent-strong)" />
              </span>
              <div className="min-w-0">
                <p className="text-[12px] font-medium text-(--text-muted)">
                  대표 정보
                </p>
                <p className="mt-1 text-base leading-tight font-semibold break-all sm:text-lg">
                  {profile?.email ?? '계정 정보를 불러오는 중'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </SectionPanel>

      {errorMessage ? (
        <SectionPanel>
          <p className="text-sm text-[color:var(--danger-strong)]">
            {errorMessage}
          </p>
        </SectionPanel>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: UserRound,
            label: '닉네임',
            value: profile?.nickname ?? (loading ? '불러오는 중' : '-'),
          },
          {
            icon: FileText,
            label: '학번',
            value: profile?.studentNumber ?? (loading ? '불러오는 중' : '-'),
          },
          {
            icon: Thermometer,
            label: '활동 온도',
            value:
              typeof temperature === 'number'
                ? `${temperature}°`
                : loading
                  ? '불러오는 중'
                  : '-',
          },
        ].map((item) => (
          <SectionPanel key={item.label}>
            <div className="flex flex-col items-start gap-3">
              <span className="rounded-full bg-(--surface-soft) p-2">
                <item.icon className="h-4 w-4 text-(--accent-strong)" />
              </span>
              <div className="w-full min-w-0">
                <p className="text-sm text-(--text-muted)">{item.label}</p>
                <p className="mt-1 text-sm leading-tight font-semibold break-all">
                  {item.value}
                </p>
              </div>
            </div>
          </SectionPanel>
        ))}
      </section>

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
