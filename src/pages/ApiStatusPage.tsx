import { Compass, FolderSearch, Info, MapPinned, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import SectionPanel from '../shared/components/ui/SectionPanel'

function ApiStatusPage() {
  return (
    <div className="space-y-6">
      <SectionPanel className="p-6">
        <div className="space-y-3">
          <p className="text-sm font-semibold text-(--accent-strong)">
            서비스 안내
          </p>
          <h1 className="text-3xl font-semibold">어디갔지 이용 방법</h1>
          <p className="max-w-3xl text-sm leading-7 text-(--text-muted)">
            처음 이용하는 분도 바로 적응할 수 있도록 지도 중심 흐름에 맞춰 주요
            기능을 정리해 두었어요.
          </p>
        </div>
      </SectionPanel>

      <section className="grid gap-4">
        {[
          {
            icon: MapPinned,
            title: '보관 장소 찾기',
            body: '홈과 보관함 화면에서 지도를 눌러 보관 장소 상세 정보와 좌표를 바로 확인할 수 있어요.',
          },
          {
            icon: Compass,
            title: '좌표 등록하기',
            body: '장소 등록과 수정 화면에서 지도를 클릭하거나 위도, 경도를 직접 입력할 수 있어요.',
          },
          {
            icon: FolderSearch,
            title: '분실물 글 살펴보기',
            body: '찾기 화면에서 검색 결과와 지도를 함께 비교하면 관련된 장소를 빠르게 확인할 수 있어요.',
          },
          {
            icon: UserRound,
            title: '내 정보 확인하기',
            body: '마이페이지에서 닉네임, 학번, 활동 온도와 내가 남긴 글과 댓글을 확인할 수 있어요.',
          },
        ].map((item) => (
          <SectionPanel key={item.title}>
            <div className="flex items-start gap-4">
              <span className="rounded-full bg-(--surface-soft) p-3">
                <item.icon className="h-5 w-5 text-(--accent-strong)" />
              </span>
              <div>
                <h2 className="text-xl font-semibold">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-(--text-muted)">
                  {item.body}
                </p>
              </div>
            </div>
          </SectionPanel>
        ))}
      </section>

      <SectionPanel>
        <div className="flex items-start gap-4">
          <span className="rounded-full bg-[color:var(--accent-soft)] p-3">
            <Info className="h-5 w-5 text-(--accent-strong)" />
          </span>
          <div>
            <h2 className="text-xl font-semibold">추천 시작 순서</h2>
            <ol className="mt-3 grid gap-2 text-sm leading-6 text-(--text-muted)">
              <li>1. 로그인하거나 둘러보기 모드로 화면을 엽니다.</li>
              <li>2. 지도에서 보관 장소를 눌러 상세 위치를 확인합니다.</li>
              <li>3. 필요한 경우 새 장소를 등록하거나 좌표를 수정합니다.</li>
              <li>4. 분실물 찾기 화면에서 관련 글을 지도와 함께 비교합니다.</li>
            </ol>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                to="/"
                className="rounded-full bg-(--accent-strong) px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-accent)]"
              >
                처음으로 가기
              </Link>
              <Link
                to="/locations"
                className="rounded-full border border-(--border-subtle) bg-white px-4 py-2 text-sm font-semibold"
              >
                보관함 열기
              </Link>
            </div>
          </div>
        </div>
      </SectionPanel>
    </div>
  )
}

export default ApiStatusPage
