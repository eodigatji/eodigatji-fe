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
