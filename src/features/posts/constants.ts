import type { PostCategory, PostStatus } from './types'

export const POST_STATUS_OPTIONS: Array<{
  value: PostStatus
  label: string
}> = [
  { value: 'LOST', label: '분실' },
  { value: 'FOUND', label: '습득' },
]

export const POST_CATEGORY_OPTIONS: Array<{
  value: PostCategory
  label: string
}> = [
  { value: 'ELECTRONICS', label: '전자기기' },
  { value: 'WALLET', label: '지갑' },
  { value: 'FASHION', label: '패션잡화' },
  { value: 'BOOK', label: '도서' },
  { value: 'ETC', label: '기타' },
]

export function getPostStatusLabel(status: PostStatus) {
  return POST_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status
}

export function getPostCategoryLabel(category: string) {
  return POST_CATEGORY_OPTIONS.find((option) => option.value === category)?.label ?? category
}
