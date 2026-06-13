import { BellOff, Clock3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import SectionPanel from '../shared/components/ui/SectionPanel'

function NotificationsPage() {
  return (
    <div className="space-y-6">
      <SectionPanel>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">알림 센터</h1>
            <p className="mt-1 text-sm text-(--text-muted)">
              현재 API 스펙에는 알림 조회, 읽음 처리, 유사 게시글 알림 관련 엔드포인트가
              없습니다. 그래서 이 화면은 프로토 영역으로 남겨두었습니다.
            </p>
          </div>
          <span className="rounded-full bg-(--surface-soft) px-3 py-2 text-sm font-semibold text-(--text-muted)">
            API 미지원
          </span>
        </div>
      </SectionPanel>

      <SectionPanel>
        <div className="flex items-start gap-4">
          <span className="rounded-full bg-(--surface-soft) p-3">
            <BellOff className="h-5 w-5 text-(--text-muted)" />
          </span>
          <div>
            <h2 className="text-xl font-semibold">나중에 붙을 기능</h2>
            <ul className="mt-3 grid gap-2 text-sm leading-6 text-(--text-muted)">
              <li>내 게시글 댓글 알림</li>
              <li>유사 분실물 / 습득물 알림</li>
              <li>읽지 않은 알림 필터</li>
              <li>전체 읽음 처리</li>
            </ul>
          </div>
        </div>
      </SectionPanel>

      <SectionPanel>
        <div className="flex items-start gap-4">
          <span className="rounded-full bg-(--accent-soft) p-3">
            <Clock3 className="h-5 w-5 text-(--accent-strong)" />
          </span>
          <div>
            <h2 className="text-xl font-semibold">지금 바로 확인 가능한 화면</h2>
            <p className="mt-2 text-sm leading-6 text-(--text-muted)">
              알림 API 대신 현재는 인증, 보관 장소 CRUD, 게시글 검색, 댓글 API 흐름을 먼저
              검증하는 편이 가장 현실적입니다.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                to="/locations"
                className="rounded-full bg-(--accent-strong) px-4 py-2 text-sm font-semibold text-white shadow-(--shadow-accent)"
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
          </div>
        </div>
      </SectionPanel>
    </div>
  )
}

export default NotificationsPage
