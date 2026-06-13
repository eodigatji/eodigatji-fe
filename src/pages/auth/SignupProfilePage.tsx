import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signup } from '../../features/auth/api/auth'
import { useAuthStore } from '../../features/auth/store/authStore'
import { getApiErrorMessage } from '../../shared/utils/getApiErrorMessage'

function SignupProfilePage() {
  const navigate = useNavigate()
  const verifiedEmail = useAuthStore((state) => state.verifiedEmail)
  const clearVerifiedEmail = useAuthStore((state) => state.clearVerifiedEmail)
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [studentNumber, setStudentNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!verifiedEmail) {
      setErrorMessage('이메일 인증을 먼저 완료해주세요.')
      return
    }

    setLoading(true)
    setErrorMessage('')

    try {
      await signup({
        email: verifiedEmail,
        password,
        nickname,
        studentNumber,
      })
      clearVerifiedEmail()
      navigate('/auth/signup/success')
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, '회원가입 처리 중 문제가 발생했습니다.'),
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-(--accent-strong)">
          Step 2 / POST /v1/auth/signup
        </p>
        <h1 className="text-3xl font-semibold">회원 정보 입력</h1>
        <p className="text-sm leading-6 text-(--text-muted)">
          현재 스펙 기준으로는 닉네임과 학번 중복 확인 API가 따로 없습니다. 그래서
          회원가입 요청 결과를 그대로 반영합니다.
        </p>
      </div>

      {verifiedEmail ? (
        <div className="rounded-(--radius-card) bg-(--surface-soft) p-4 text-sm">
          인증 완료 이메일: <span className="font-semibold">{verifiedEmail}</span>
        </div>
      ) : (
        <div className="rounded-(--radius-card) border border-(--danger-border) bg-(--danger-soft) p-4 text-sm text-(--danger-strong)">
          아직 인증된 이메일이 없습니다. 이메일 인증 단계로 돌아가 주세요.
        </div>
      )}

      <form className="grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-2">
          <span className="text-sm font-medium">비밀번호</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded-(--radius-card) border border-(--border-subtle) bg-(--surface-soft) px-4 py-3 text-sm outline-none"
            placeholder="8자 이상 입력"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium">닉네임</span>
            <input
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              className="rounded-(--radius-card) border border-(--border-subtle) bg-(--surface-soft) px-4 py-3 text-sm outline-none"
              placeholder="닉네임"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium">학번</span>
            <input
              value={studentNumber}
              onChange={(event) => setStudentNumber(event.target.value)}
              className="rounded-(--radius-card) border border-(--border-subtle) bg-(--surface-soft) px-4 py-3 text-sm outline-none"
              placeholder="20231234"
            />
          </label>
        </div>

        {errorMessage ? (
          <p className="rounded-(--radius-card) border border-(--danger-border) bg-(--danger-soft) px-4 py-3 text-sm text-(--danger-strong)">
            {errorMessage}
          </p>
        ) : null}

        <div className="rounded-(--radius-card) bg-(--surface-soft) p-4 text-sm leading-6 text-(--text-muted)">
          회원가입이 성공하면 별도의 사용자 정보 응답 없이 `201 Created`만 반환합니다.
          완료 후 로그인 페이지로 이어지는 흐름을 준비해두었습니다.
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/auth/signup/email"
            className="rounded-full border border-(--border-subtle) bg-white px-4 py-3 text-sm font-semibold"
          >
            이전
          </Link>
          <button
            type="submit"
            disabled={loading || !verifiedEmail}
            className="rounded-full bg-(--accent-strong) px-4 py-3 text-sm font-semibold text-white shadow-(--shadow-accent) disabled:opacity-60"
          >
            {loading ? '가입 처리 중...' : '회원가입'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default SignupProfilePage
