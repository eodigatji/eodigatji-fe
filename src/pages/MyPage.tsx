import { BadgeHelp, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import SectionPanel from '../shared/components/ui/SectionPanel'

function MyPage() {
  return (
    <div className="space-y-6">
      <SectionPanel className="p-6">
        <div className="profile-summary-grid grid gap-6">
          <div>
            <p className="text-sm font-semibold text-(--accent-strong)">
              마이페이지 프로토
            </p>
            <h1 className="mt-2 text-3xl font-semibold">
              현재 스펙 기준으로는 개인 활동 데이터를 실제로 채울 수 없습니다.
            </h1>
            <p className="mt-3 text-sm leading-7 text-(--text-muted)">
              프로필 수정, 내 게시글, 내 댓글, 포인트, 활동 온도에 해당하는 API가 아직
              명세에 없어 이 화면은 구조만 남겨둔 상태입니다.
            </p>
          </div>
          <div className="rounded-(--radius-card) bg-(--surface-soft) p-5">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-white p-2">
                <UserRound className="h-5 w-5 text-(--accent-strong)" />
              </span>
              <div>
                <p className="text-sm font-medium text-(--text-muted)">예정 영역</p>
                <p className="mt-1 text-lg font-semibold">프로필 / 활동 / 포인트</p>
              </div>
            </div>
          </div>
        </div>
      </SectionPanel>

      <SectionPanel>
        <div className="flex items-start gap-4">
          <span className="rounded-full bg-(--surface-soft) p-3">
            <BadgeHelp className="h-5 w-5 text-(--text-muted)" />
          </span>
          <div>
            <h2 className="text-xl font-semibold">이 페이지에 필요한 API</h2>
            <ul className="mt-3 grid gap-2 text-sm leading-6 text-(--text-muted)">
              <li>내 프로필 조회 / 수정</li>
              <li>내 게시글 목록</li>
              <li>내 댓글 목록</li>
              <li>포인트 / 활동 온도 요약</li>
            </ul>
          </div>
        </div>
      </SectionPanel>

      <SectionPanel>
        <h2 className="text-xl font-semibold">지금은 어디를 먼저 보면 좋을까</h2>
        <p className="mt-2 text-sm leading-6 text-(--text-muted)">
          현재 프로젝트 기준으로는 인증 흐름, 보관 장소 CRUD, 게시글 검색과 댓글 기능부터
          실제 API 검증을 진행하는 편이 가장 효율적입니다.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            to="/auth/login"
            className="rounded-full bg-(--accent-strong) px-4 py-2 text-sm font-semibold text-white shadow-(--shadow-accent)"
          >
            인증 보기
          </Link>
          <Link
            to="/locations"
            className="rounded-full border border-(--border-subtle) bg-white px-4 py-2 text-sm font-semibold"
          >
            보관 장소 보기
          </Link>
          <Link
            to="/posts"
            className="rounded-full border border-(--border-subtle) bg-white px-4 py-2 text-sm font-semibold"
          >
            검색 / 댓글 보기
          </Link>
        </div>
      </SectionPanel>
    </div>
  )
}

export default MyPage
