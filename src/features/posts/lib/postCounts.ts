import { getPost, getPosts, type PostDetailDto } from '../api/posts'

const POST_COUNT_PAGE_SIZE = 50

export async function getAllPostDetails() {
  let page = 0
  let totalPages = 1
  const postIds: number[] = []

  while (page < totalPages) {
    const response = await getPosts({
      page,
      size: POST_COUNT_PAGE_SIZE,
      sort: 'createdAt,DESC',
    })

    postIds.push(...response.content.map((post) => post.id))
    totalPages = Math.max(response.totalPages, 1)
    page += 1
  }

  const uniquePostIds = [...new Set(postIds)]
  const settledPosts = await Promise.allSettled(
    uniquePostIds.map((postId) => getPost(postId)),
  )

  return settledPosts.flatMap((result) =>
    result.status === 'fulfilled' ? [result.value] : [],
  )
}

export function getPostCountMap(posts: PostDetailDto[]) {
  const counts = new Map<number, number>()

  for (const post of posts) {
    counts.set(post.locationId, (counts.get(post.locationId) ?? 0) + 1)
  }

  return counts
}
