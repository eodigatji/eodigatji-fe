import { BellOff, Clock3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import SectionPanel from '../shared/components/ui/SectionPanel'

function NotificationsPage() {
  return (
    <div className="space-y-6">
      <SectionPanel>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">알림</h1>
            <p className="mt-1 text-sm text-(--text-muted)">
              새로운 소식이 도착하면 이곳에서 한눈에 확인할 수 있어요.
            </p>
          </div>
          <span className="rounded-full bg-(--surface-soft) px-3 py-2 text-sm font-semibold text-(--text-muted)">
            지금은 조용해요
          </span>
        </div>
      </SectionPanel>

      <SectionPanel>
        <div className="flex items-start gap-4">
          <span className="rounded-full bg-(--surface-soft) p-3">
            <BellOff className="h-5 w-5 text-(--text-muted)" />
          </span>
          <div>
            <h2 className="text-xl font-semibold">아직 알림이 없어요</h2>
            <p className="mt-2 text-sm leading-6 text-(--text-muted)">
              분실물 글이나 보관 장소를 먼저 둘러보면 필요한 정보가 생겼을 때 더
              빨리 확인할 수 있어요.
            </p>
          </div>
        </div>
      </SectionPanel>

      <SectionPanel>
        <div className="flex items-start gap-4">
          <span className="rounded-full bg-[color:var(--accent-soft)] p-3">
            <Clock3 className="h-5 w-5 text-(--accent-strong)" />
          </span>
          <div>
            <h2 className="text-xl font-semibold">지금 둘러볼 수 있는 곳</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                to="/locations"
                className="rounded-full bg-(--accent-strong) px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-accent)]"
              >
                보관 장소 보기
              </Link>
              <Link
                to="/posts"
                className="rounded-full border border-(--border-subtle) bg-white px-4 py-2 text-sm font-semibold"
              >
                분실물 찾기
              </Link>
            </div>
          </div>
        </div>
      </SectionPanel>
    </div>
  )
}

export default NotificationsPage
