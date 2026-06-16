import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../../features/auth/api/auth'
import { getLoginErrorMessage } from '../../features/auth/lib/getLoginErrorMessage'
import { useAuthStore } from '../../features/auth/store/authStore'

function LoginPage() {
  const navigate = useNavigate()
  const setTokens = useAuthStore((state) => state.setTokens)
  const clearTokens = useAuthStore((state) => state.clearTokens)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setErrorMessage('')

    try {
      const tokens = await login({ email, password })
      setTokens(tokens)
      navigate('/')
    } catch (error) {
      setErrorMessage(getLoginErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-(--accent-strong)">
          계정 로그인
        </p>
        <h1 className="text-3xl font-semibold">다시 만나서 반가워요</h1>
        <p className="text-sm leading-6 text-(--text-muted)">
          로그인하면 지도에서 보관 장소를 확인하고, 분실물 관리 화면도 빠르게
          이용할 수 있어요.
        </p>
      </div>

      <form className="grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-2">
          <span className="text-sm font-medium">학교 이메일</span>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-[var(--radius-card)] border border-(--border-subtle) bg-(--surface-soft) px-4 py-3 text-sm outline-none"
            placeholder="user@kangnam.ac.kr"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium">비밀번호</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded-[var(--radius-card)] border border-(--border-subtle) bg-(--surface-soft) px-4 py-3 text-sm outline-none"
            placeholder="비밀번호 입력"
          />
        </label>

        {errorMessage ? (
          <p className="rounded-[var(--radius-card)] border border-[color:var(--danger-border)] bg-[color:var(--danger-soft)] px-4 py-3 text-sm text-[color:var(--danger-strong)]">
            {errorMessage}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-full bg-(--accent-strong) px-4 py-3 text-sm font-semibold text-white shadow-[var(--shadow-accent)] disabled:opacity-60"
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>

      {isAuthenticated ? (
        <div className="rounded-[var(--radius-card)] bg-(--surface-soft) p-4 text-sm">
          <p className="font-semibold">현재 이 기기에서 로그인된 상태예요.</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="rounded-full bg-(--accent-strong) px-4 py-2 text-sm font-semibold text-white"
            >
              보관 장소 보러가기
            </button>
            <button
              type="button"
              onClick={clearTokens}
              className="rounded-full border border-(--border-subtle) bg-white px-4 py-2 text-sm font-semibold"
            >
              로그아웃
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 text-sm text-(--text-muted)">
        <span>아직 계정이 없나요?</span>
        <Link
          to="/auth/signup/email"
          className="font-semibold text-(--accent-strong)"
        >
          회원가입 시작
        </Link>
      </div>
    </div>
  )
}

export default LoginPage
