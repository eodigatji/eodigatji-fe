import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  sendVerificationEmail,
  verifyEmailCode,
} from '../../features/auth/api/auth'
import { useAuthStore } from '../../features/auth/store/authStore'
import { getApiErrorMessage } from '../../shared/utils/getApiErrorMessage'

function SignupEmailPage() {
  const navigate = useNavigate()
  const setVerifiedEmail = useAuthStore((state) => state.setVerifiedEmail)
  const verifiedEmail = useAuthStore((state) => state.verifiedEmail)
  const [email, setEmail] = useState(verifiedEmail ?? '')
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [isVerified, setIsVerified] = useState(Boolean(verifiedEmail))

  async function handleSendEmail() {
    setSending(true)
    setMessage('')
    setErrorMessage('')

    try {
      await sendVerificationEmail(email)
      setMessage('인증 코드를 보냈어요. 학교 이메일함에서 메일을 확인해 주세요.')
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          '인증 코드를 보내지 못했어요. 잠시 후 다시 시도해 주세요.',
        ),
      )
    } finally {
      setSending(false)
    }
  }

  async function handleVerifyEmail() {
    setVerifying(true)
    setMessage('')
    setErrorMessage('')

    try {
      await verifyEmailCode(email, code)
      setVerifiedEmail(email)
      setIsVerified(true)
      setMessage('이메일 인증이 완료되었어요.')
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, '인증번호가 맞지 않아요. 다시 확인해 주세요.'),
      )
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-(--accent-strong)">회원가입 1단계</p>
        <h1 className="text-[2.05rem] leading-[1.08] font-semibold">학교 이메일 인증</h1>
        <p className="text-sm leading-6 text-(--text-muted)">
          강남대학교 이메일을 먼저 확인하면 다음 단계에서 닉네임과 학번을 입력해
          계정을 만들 수 있어요.
        </p>
      </div>

      <div className="grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm font-medium">학교 이메일</span>
          <div className="auth-code-grid grid gap-2">
            <input
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                setIsVerified(false)
              }}
              className="rounded-[var(--radius-card)] border border-(--border-subtle) bg-(--surface-soft) px-4 py-3 text-sm outline-none"
              placeholder="user@kangnam.ac.kr"
            />
            <button
              type="button"
              disabled={sending || !email}
              onClick={handleSendEmail}
              className="rounded-full bg-(--accent-strong) px-3.5 py-2.5 text-[13px] font-semibold text-white shadow-[var(--shadow-accent)] disabled:opacity-60"
            >
              {sending ? '전송 중...' : '인증코드 보내기'}
            </button>
          </div>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium">인증 코드</span>
          <div className="auth-code-grid grid gap-2">
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className="rounded-[var(--radius-card)] border border-(--border-subtle) bg-(--surface-soft) px-4 py-3 text-sm outline-none"
              placeholder="메일로 받은 6자리 코드"
            />
            <button
              type="button"
              disabled={verifying || !email || !code}
              onClick={handleVerifyEmail}
              className="rounded-full border border-(--border-subtle) bg-white px-3.5 py-2.5 text-[13px] font-semibold disabled:opacity-60"
            >
              {verifying ? '확인 중...' : '이메일 인증'}
            </button>
          </div>
        </label>
      </div>

      {message ? (
        <p className="rounded-[var(--radius-card)] border border-(--border-subtle) bg-(--surface-soft) px-4 py-3 text-sm leading-6">
          {message}
        </p>
      ) : null}

      {errorMessage ? (
        <p className="rounded-[var(--radius-card)] border border-[color:var(--danger-border)] bg-[color:var(--danger-soft)] px-4 py-3 text-sm leading-6 text-[color:var(--danger-strong)]">
          {errorMessage}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-3 rounded-[var(--radius-card)] bg-(--surface-soft) p-4">
        <div>
          <p className="text-sm font-semibold">다음 단계</p>
          <p className="mt-1 text-sm leading-6 text-(--text-muted)">
            이메일 인증이 끝나면 프로필 정보를 입력할 수 있어요.
          </p>
        </div>
        <button
          type="button"
          disabled={!isVerified}
          onClick={() => navigate('/auth/signup/profile')}
          className="shrink-0 rounded-full bg-(--accent-strong) px-3.5 py-2.5 text-[13px] font-semibold text-white shadow-[var(--shadow-accent)] disabled:opacity-50"
        >
          다음
        </button>
      </div>
    </div>
  )
}

export default SignupEmailPage
