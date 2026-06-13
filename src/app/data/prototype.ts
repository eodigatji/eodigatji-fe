export type PostStatus = 'LOST' | 'FOUND'

export type PostSummary = {
  id: number
  title: string
  category: string
  place: string
  date: string
  timeSlot: string
  description: string
  status: PostStatus
  comments: number
}

export type LocationItem = {
  id: number
  name: string
  detail: string
  number: string
  keeper?: string
  createdAt?: string
}

export type NotificationItem = {
  id: number
  title: string
  body: string
  time: string
  unread: boolean
}

export type ApiScopeItem = {
  id: string
  title: string
  status: 'supported' | 'partial' | 'planned'
  body: string
  endpoints: string[]
}

export const primaryNavigation = [
  { to: '/', label: '홈' },
  { to: '/auth/login', label: '인증' },
  { to: '/locations', label: '보관 장소' },
  { to: '/posts', label: '게시글/댓글' },
  { to: '/api-status', label: 'API 현황' },
] as const

export const authSteps = [
  { label: '이메일 인증', path: '/auth/signup/email' },
  { label: '회원 정보', path: '/auth/signup/profile' },
  { label: '완료', path: '/auth/signup/success' },
] as const

export const posts: PostSummary[] = [
  {
    id: 104,
    title: '검은색 에어팟 프로 케이스를 찾고 있어요',
    category: '전자기기',
    place: '교육관 3층 305호 앞',
    date: '06.08',
    timeSlot: '13:00-15:00',
    description:
      '이름 스티커가 붙어 있고, 케이스 하단에 작은 긁힘이 있습니다.',
    status: 'LOST',
    comments: 4,
  },
  {
    id: 103,
    title: '학생회관 카페에서 파란 우산을 보관 중입니다',
    category: '생활용품',
    place: '학생회관 1층 카페',
    date: '06.08',
    timeSlot: '10:00-11:00',
    description: '접이식 우산이며 손잡이에 흰색 키링이 달려 있습니다.',
    status: 'FOUND',
    comments: 2,
  },
  {
    id: 102,
    title: '도서관 노트북 충전기를 분실했습니다',
    category: '전자기기',
    place: '중앙도서관 2열람실',
    date: '06.07',
    timeSlot: '18:00-20:00',
    description: '65W USB-C 충전기와 짧은 검은색 케이블이 함께 있었습니다.',
    status: 'LOST',
    comments: 1,
  },
]

export const locations: LocationItem[] = [
  {
    id: 1,
    name: '학생지원팀 보관함 A',
    detail: '학생회관 1층 학생지원팀 옆',
    number: 'A-01',
    keeper: '학생지원팀',
  },
  {
    id: 2,
    name: '도서관 안내데스크 보관함',
    detail: '중앙도서관 1층 안내데스크 뒤편',
    number: 'LIB-02',
    keeper: '도서관 운영팀',
  },
  {
    id: 3,
    name: '공학관 행정실 임시 보관함',
    detail: '공학관 2층 행정실 내부',
    number: 'ENG-03',
    keeper: '공학관 행정실',
  },
]

export const notifications: NotificationItem[] = [
  {
    id: 1,
    title: '내 게시글에 댓글이 달렸어요',
    body: '검은색 에어팟 프로 케이스 글에 새로운 제보가 도착했습니다.',
    time: '방금 전',
    unread: true,
  },
  {
    id: 2,
    title: '유사한 습득물이 등록되었어요',
    body: '전자기기 카테고리에서 비슷한 설명의 습득물이 발견되었습니다.',
    time: '1시간 전',
    unread: true,
  },
  {
    id: 3,
    title: '보관 장소 정보가 갱신되었어요',
    body: '학생지원팀 보관함 A의 상세 위치가 최신 정보로 수정되었습니다.',
    time: '어제',
    unread: false,
  },
]

export const activitySummary = {
  nickname: '청설모',
  studentNumber: '20231234',
  temperature: 82,
  points: 240,
  posts: 6,
  comments: 12,
  unreadNotifications: 2,
}

export const apiScopes: ApiScopeItem[] = [
  {
    id: 'auth',
    title: '인증',
    status: 'supported',
    body: '학교 이메일 발송, 인증번호 검증, 회원가입, 로그인, 토큰 재발급까지 현재 스펙에 명시되어 있습니다.',
    endpoints: [
      'POST /v1/auth/email/send',
      'POST /v1/auth/email/verify',
      'POST /v1/auth/signup',
      'POST /v1/auth/login',
      'POST /v1/auth/reissue',
    ],
  },
  {
    id: 'locations',
    title: '보관 장소',
    status: 'supported',
    body: '목록, 상세, 등록, 부분 수정, 삭제까지 CRUD 흐름이 비교적 명확하게 잡혀 있습니다.',
    endpoints: [
      'GET /v1/locations',
      'GET /v1/locations/{id}',
      'POST /v1/locations',
      'PATCH /v1/locations/{id}',
      'DELETE /v1/locations/{id}',
    ],
  },
  {
    id: 'comments',
    title: '댓글',
    status: 'partial',
    body: '목록, 등록, 삭제는 있지만 게시글 도메인과 느슨하게 연결되어 있고 작성자 판정도 요청 body의 userId에 의존합니다.',
    endpoints: [
      'GET /v1/posts/{postId}/comments',
      'POST /v1/posts/{postId}/comments',
      'DELETE /v1/posts/{postId}/comments/{commentId}',
    ],
  },
  {
    id: 'search',
    title: '검색',
    status: 'planned',
    body: '키워드, 카테고리, 날짜, 장소 검색 엔드포인트 명세는 있으나 현재 구현은 모두 빈 배열을 반환합니다.',
    endpoints: [
      'GET /v1/posts/search?keyword=',
      'GET /v1/posts/categories/{category}',
      'GET /v1/posts/search/date?date=',
      'GET /v1/posts/search/place?place=',
    ],
  },
]
