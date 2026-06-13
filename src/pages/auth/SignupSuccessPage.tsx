import { CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'

function SignupSuccessPage() {
  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-(--found-soft) text-(--found-strong)">
        <CheckCircle2 className="h-8 w-8" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">회원가입 완료</h1>
        <p className="max-w-md text-sm leading-6 text-(--text-muted)">
          학교 이메일 인증과 기본 정보 입력이 끝났습니다. 이제 로그인 후 홈
          화면으로 자연스럽게 연결되는 흐름을 붙이면 됩니다.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          to="/auth/login"
          className="rounded-full bg-(--accent-strong) px-4 py-3 text-sm font-semibold text-white shadow-(--shadow-accent)"
        >
          로그인으로 이동
        </Link>
        <Link
          to="/"
          className="rounded-full border border-(--border-subtle) bg-white px-4 py-3 text-sm font-semibold"
        >
          홈 프로토 보기
        </Link>
      </div>
    </div>
  )
}

export default SignupSuccessPage
