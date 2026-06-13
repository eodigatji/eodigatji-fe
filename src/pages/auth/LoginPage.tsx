import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../../features/auth/api/auth'
import { useAuthStore } from '../../features/auth/store/authStore'
import { getApiErrorMessage } from '../../shared/utils/getApiErrorMessage'

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
      navigate('/locations')
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          '로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.',
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-(--accent-strong)">
          POST /v1/auth/login
        </p>
        <h1 className="text-3xl font-semibold">로그인</h1>
        <p className="text-sm leading-6 text-(--text-muted)">
          현재 스펙 기준 가장 먼저 연결할 수 있는 진입 화면입니다. 성공하면 access
          token, refresh token을 저장하고 보호된 API 호출에 사용합니다.
        </p>
      </div>

      <form className="grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-2">
          <span className="text-sm font-medium">학교 이메일</span>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-(--radius-card) border border-(--border-subtle) bg-(--surface-soft) px-4 py-3 text-sm outline-none"
            placeholder="user@kangnam.ac.kr"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium">비밀번호</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded-(--radius-card) border border-(--border-subtle) bg-(--surface-soft) px-4 py-3 text-sm outline-none"
            placeholder="비밀번호 입력"
          />
        </label>

        {errorMessage ? (
          <p className="rounded-(--radius-card) border border-(--danger-border) bg-(--danger-soft) px-4 py-3 text-sm text-(--danger-strong)">
            {errorMessage}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-full bg-(--accent-strong) px-4 py-3 text-sm font-semibold text-white shadow-(--shadow-accent) disabled:opacity-60"
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>

      {isAuthenticated ? (
        <div className="rounded-(--radius-card) bg-(--surface-soft) p-4 text-sm">
          <p className="font-semibold">현재 토큰이 저장되어 있습니다.</p>
          <button
            type="button"
            onClick={clearTokens}
            className="mt-2 rounded-full border border-(--border-subtle) bg-white px-4 py-2 text-sm font-semibold"
          >
            저장된 토큰 지우기
          </button>
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
