import apiClient from '../../../shared/api/client'
import { API_BASE_URL } from '../../../shared/api/config'
import type { TokenPayload } from '../../../shared/auth/tokenStorage'
import type { NotificationItem } from '../types'

type NotificationStreamOptions = {
  onConnect?: () => void
  onNotification: (notification: NotificationItem) => void
  signal: AbortSignal
  tokens: Pick<TokenPayload, 'accessToken' | 'tokenType'>
}

function buildApiUrl(path: string) {
  if (!API_BASE_URL) {
    return path
  }

  const normalizedBaseUrl = API_BASE_URL.endsWith('/')
    ? API_BASE_URL
    : `${API_BASE_URL}/`

  return new URL(path.replace(/^\//, ''), normalizedBaseUrl).toString()
}

function parseResponseErrorMessage(rawText: string) {
  const trimmedText = rawText.trim()

  if (!trimmedText) {
    return null
  }

  try {
    const parsed = JSON.parse(trimmedText) as { message?: unknown }

    if (typeof parsed.message === 'string' && parsed.message.trim()) {
      return parsed.message
    }
  } catch {
    return trimmedText
  }

  return trimmedText
}

function parseNotificationEvent(
  block: string,
  onNotification: (notification: NotificationItem) => void,
) {
  let eventName = 'message'
  const dataLines: string[] = []

  for (const line of block.split(/\r?\n/)) {
    if (!line || line.startsWith(':')) {
      continue
    }

    if (line.startsWith('event:')) {
      eventName = line.slice(6).trim()
      continue
    }

    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trimStart())
    }
  }

  if (eventName !== 'notification') {
    return
  }

  const rawPayload = dataLines.join('\n').trim()

  if (!rawPayload) {
    return
  }

  try {
    onNotification(JSON.parse(rawPayload) as NotificationItem)
  } catch {
    return
  }
}

export async function getCommentNotifications() {
  const { data } = await apiClient.get<NotificationItem[]>(
    '/v1/notifications/comments',
  )

  return data
}

export async function markCommentNotificationAsRead(notificationId: number) {
  await apiClient.patch(`/v1/notifications/comments/${notificationId}/read`)
}

export async function subscribeToCommentNotifications({
  onConnect,
  onNotification,
  signal,
  tokens,
}: NotificationStreamOptions) {
  const response = await fetch(buildApiUrl('/v1/notifications/subscribe'), {
    cache: 'no-store',
    headers: {
      Accept: 'text/event-stream',
      Authorization: `${tokens.tokenType} ${tokens.accessToken}`,
    },
    signal,
  })

  if (!response.ok) {
    const errorText = parseResponseErrorMessage(await response.text())

    throw new Error(
      errorText ?? '실시간 알림 연결을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.',
    )
  }

  if (!response.body) {
    throw new Error('실시간 알림 스트림을 읽을 수 없어요.')
  }

  onConnect?.()

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()

    if (done) {
      break
    }

    buffer += decoder.decode(value, { stream: true })

    const blocks = buffer.split(/\r?\n\r?\n/)
    buffer = blocks.pop() ?? ''

    for (const block of blocks) {
      parseNotificationEvent(block, onNotification)
    }
  }

  buffer += decoder.decode()

  if (buffer.trim()) {
    parseNotificationEvent(buffer, onNotification)
  }
}
