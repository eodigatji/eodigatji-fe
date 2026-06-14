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
      setErrorMessage('이메일 인증을 먼저 완료해 주세요.')
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
        getApiErrorMessage(
          error,
          '회원가입을 완료하지 못했어요. 입력 내용을 다시 확인해 주세요.',
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
          회원가입 2단계
        </p>
        <h1 className="text-3xl font-semibold">기본 정보 입력</h1>
        <p className="text-sm leading-6 text-(--text-muted)">
          가입 후 바로 이용할 닉네임과 학번, 비밀번호를 입력해 주세요.
        </p>
      </div>

      {verifiedEmail ? (
        <div className="rounded-[var(--radius-card)] bg-(--surface-soft) p-4 text-sm">
          확인 완료 이메일:{' '}
          <span className="font-semibold">{verifiedEmail}</span>
        </div>
      ) : (
        <div className="rounded-[var(--radius-card)] border border-[color:var(--danger-border)] bg-[color:var(--danger-soft)] p-4 text-sm text-[color:var(--danger-strong)]">
          아직 확인된 이메일이 없어요. 이메일 인증 단계로 돌아가 주세요.
        </div>
      )}

      <form className="grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-2">
          <span className="text-sm font-medium">비밀번호</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded-[var(--radius-card)] border border-(--border-subtle) bg-(--surface-soft) px-4 py-3 text-sm outline-none"
            placeholder="8자 이상 입력"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium">닉네임</span>
          <input
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            className="rounded-[var(--radius-card)] border border-(--border-subtle) bg-(--surface-soft) px-4 py-3 text-sm outline-none"
            placeholder="표시할 이름 입력"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium">학번</span>
          <input
            value={studentNumber}
            onChange={(event) => setStudentNumber(event.target.value)}
            className="rounded-[var(--radius-card)] border border-(--border-subtle) bg-(--surface-soft) px-4 py-3 text-sm outline-none"
            placeholder="20231234"
          />
        </label>

        {errorMessage ? (
          <p className="rounded-[var(--radius-card)] border border-[color:var(--danger-border)] bg-[color:var(--danger-soft)] px-4 py-3 text-sm text-[color:var(--danger-strong)]">
            {errorMessage}
          </p>
        ) : null}

        <div className="rounded-[var(--radius-card)] bg-(--surface-soft) p-4 text-sm leading-6 text-(--text-muted)">
          가입이 완료되면 바로 로그인 화면으로 이동해 계속 이용할 수 있어요.
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
            className="rounded-full bg-(--accent-strong) px-4 py-3 text-sm font-semibold text-white shadow-[var(--shadow-accent)] disabled:opacity-60"
          >
            {loading ? '가입 처리 중...' : '회원가입 완료'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default SignupProfilePage
