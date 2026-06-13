import { Link } from 'react-router-dom'
import { apiScopes } from '../app/data/prototype'
import { API_BASE_URL } from '../shared/api/config'
import SectionPanel from '../shared/components/ui/SectionPanel'

const statusStyle = {
  supported: 'bg-(--found-soft) text-(--found-strong)',
  partial: 'bg-(--lost-soft) text-(--lost-strong)',
  planned: 'bg-(--accent-soft) text-(--accent-strong)',
} as const

const statusLabel = {
  supported: '지원됨',
  partial: '부분 지원',
  planned: '명세만 있음',
} as const

function ApiStatusPage() {
  return (
    <div className="space-y-6">
      <SectionPanel className="p-6">
        <div className="space-y-3">
          <p className="text-(--accent-strong) text-sm font-semibold">
            API_SPEC_ANALYSIS.md 기준
          </p>
          <h1 className="text-3xl font-semibold">현재 연동 가능 범위</h1>
          <p className="max-w-3xl text-(--text-muted) text-sm leading-7">
            현재 프로젝트는 API 문서 기준으로 인증과 보관 장소를 실연동 우선
            범위로 보고, 댓글은 게시글 상세의 부분 기능으로, 검색은 구현 전
            프로토 단계로 정리하는 편이 가장 현실적입니다.
          </p>
          <p className="text-(--text-muted) text-sm">
            현재 API Base URL: <span className="font-semibold">{API_BASE_URL || '미설정'}</span>
          </p>
        </div>
      </SectionPanel>

      <section className="grid gap-4">
        {apiScopes.map((scope) => (
          <SectionPanel key={scope.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">{scope.title}</h2>
                <p className="mt-2 text-(--text-muted) text-sm leading-6">
                  {scope.body}
                </p>
              </div>
              <span
                className={[
                  'rounded-full px-2.5 py-1 text-xs font-semibold',
                  statusStyle[scope.status],
                ].join(' ')}
              >
                {statusLabel[scope.status]}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {scope.endpoints.map((endpoint) => (
                <span
                  key={endpoint}
                  className="rounded-full border border-(--border-subtle) bg-(--surface-soft) px-3 py-2 text-(--text-muted) text-xs"
                >
                  {endpoint}
                </span>
              ))}
            </div>
          </SectionPanel>
        ))}
      </section>

      <SectionPanel>
        <h2 className="text-xl font-semibold">프론트 다음 우선순위</h2>
        <ol className="mt-4 grid gap-3 text-(--text-muted) text-sm leading-6">
          <li>1. 로그인, 회원가입, 토큰 재발급 흐름 실연동</li>
          <li>2. 보관 장소 목록, 상세, 등록, 수정, 삭제 실연동</li>
          <li>3. 게시글 상세 내부 댓글 패널 실연동</li>
          <li>4. 검색과 게시글 본문 영역은 백엔드 구현 후 전환</li>
        </ol>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            to="/auth/login"
            className="rounded-full bg-(--accent-strong) px-4 py-2 text-sm font-semibold text-white shadow-(--shadow-accent)"
          >
            인증 화면 보기
          </Link>
          <Link
            to="/locations"
            className="rounded-full border border-(--border-subtle) bg-white px-4 py-2 text-sm font-semibold"
          >
            보관 장소 보기
          </Link>
        </div>
      </SectionPanel>
    </div>
  )
}

export default ApiStatusPage
