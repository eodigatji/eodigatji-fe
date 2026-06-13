import axios from 'axios'

export function getApiErrorMessage(
  error: unknown,
  fallback = '요청 처리 중 문제가 발생했습니다.',
) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data

    if (typeof data === 'string' && data.trim()) {
      return data
    }

    if (data && typeof data === 'object') {
      const message = Reflect.get(data, 'message')
      if (typeof message === 'string' && message.trim()) {
        return message
      }
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallback
}
