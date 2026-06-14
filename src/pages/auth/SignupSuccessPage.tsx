import { CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'

function SignupSuccessPage() {
  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--found-soft)] text-[color:var(--found-strong)]">
        <CheckCircle2 className="h-8 w-8" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">가입이 완료됐어요</h1>
        <p className="max-w-md text-sm leading-6 text-(--text-muted)">
          이제 로그인해서 지도 중심 화면에서 보관 장소와 분실물 흐름을 바로
          확인해 보세요.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          to="/auth/login"
          className="rounded-full bg-(--accent-strong) px-4 py-3 text-sm font-semibold text-white shadow-[var(--shadow-accent)]"
        >
          로그인하러 가기
        </Link>
        <Link
          to="/"
          className="rounded-full border border-(--border-subtle) bg-white px-4 py-3 text-sm font-semibold"
        >
          처음으로 이동
        </Link>
      </div>
    </div>
  )
}

export default SignupSuccessPage
