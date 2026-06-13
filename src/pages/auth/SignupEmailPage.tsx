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
      setMessage('인증 코드를 발송했습니다. 이메일을 확인해 주세요.')
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, '인증 코드 발송에 실패했습니다.'),
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
      setMessage('이메일 인증이 완료되었습니다.')
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, '인증 코드 확인에 실패했습니다.'),
      )
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-(--accent-strong) text-sm font-semibold">
          Step 1 / POST /v1/auth/email/send, verify
        </p>
        <h1 className="text-3xl font-semibold">학교 이메일 인증</h1>
        <p className="text-(--text-muted) text-sm leading-6">
          강남대학교 이메일만 허용되며, 인증이 완료되어야 회원가입 요청을 보낼
          수 있습니다.
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
              className="rounded-(--radius-card) border border-(--border-subtle) bg-(--surface-soft) px-4 py-3 text-sm outline-none"
              placeholder="user@kangnam.ac.kr"
            />
            <button
              type="button"
              disabled={sending || !email}
              onClick={handleSendEmail}
              className="rounded-full bg-(--accent-strong) px-4 py-3 text-sm font-semibold text-white shadow-(--shadow-accent) disabled:opacity-60"
            >
              {sending ? '발송 중...' : '코드 발송'}
            </button>
          </div>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium">인증 코드</span>
          <div className="auth-code-grid grid gap-2">
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className="rounded-(--radius-card) border border-(--border-subtle) bg-(--surface-soft) px-4 py-3 text-sm outline-none"
              placeholder="6자리 숫자"
            />
            <button
              type="button"
              disabled={verifying || !email || !code}
              onClick={handleVerifyEmail}
              className="rounded-full border border-(--border-subtle) bg-white px-4 py-3 text-sm font-semibold disabled:opacity-60"
            >
              {verifying ? '확인 중...' : '인증 확인'}
            </button>
          </div>
        </label>
      </div>

      {message ? (
        <p className="rounded-(--radius-card) border border-(--border-subtle) bg-(--surface-soft) px-4 py-3 text-sm">
          {message}
        </p>
      ) : null}

      {errorMessage ? (
        <p className="rounded-(--radius-card) border border-(--danger-border) bg-(--danger-soft) px-4 py-3 text-(--danger-strong) text-sm">
          {errorMessage}
        </p>
      ) : null}

      <div className="flex items-center justify-between rounded-(--radius-card) bg-(--surface-soft) p-4">
        <div>
          <p className="text-sm font-semibold">다음 단계</p>
          <p className="mt-1 text-(--text-muted) text-sm">
            인증이 끝나면 비밀번호, 닉네임, 학번 입력으로 이동
          </p>
        </div>
        <button
          type="button"
          disabled={!isVerified}
          onClick={() => navigate('/auth/signup/profile')}
          className="rounded-full bg-(--accent-strong) px-4 py-2 text-sm font-semibold text-white shadow-(--shadow-accent) disabled:opacity-50"
        >
          다음
        </button>
      </div>
    </div>
  )
}

export default SignupEmailPage
