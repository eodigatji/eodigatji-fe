import axios from 'axios'
import { getApiErrorMessage } from '../../../shared/utils/getApiErrorMessage'

const DEFAULT_LOGIN_ERROR_MESSAGE =
  '로그인에 실패했어요. 학교 이메일과 비밀번호를 다시 확인해 주세요.'

function normalizeMessage(value: string) {
  return value.trim().toLowerCase()
}

export function getLoginErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const rawMessage = getApiErrorMessage(error, DEFAULT_LOGIN_ERROR_MESSAGE)
    const normalizedMessage = normalizeMessage(rawMessage)

    if (
      normalizedMessage.includes('user not found') ||
      normalizedMessage.includes('account not found') ||
      normalizedMessage.includes('email not found') ||
      normalizedMessage.includes('no such user')
    ) {
      return '해당 이메일로 등록된 계정을 찾을 수 없어요.'
    }

    if (
      normalizedMessage.includes('wrong password') ||
      normalizedMessage.includes('invalid password') ||
      normalizedMessage.includes('incorrect password') ||
      normalizedMessage.includes('password mismatch')
    ) {
      return '비밀번호가 맞지 않아요. 다시 입력해 주세요.'
    }

    if (
      status === 401 ||
      normalizedMessage.includes('bad credentials') ||
      normalizedMessage.includes('invalid email or password') ||
      normalizedMessage.includes('unauthorized')
    ) {
      return '이메일 또는 비밀번호가 올바르지 않아요.'
    }
  }

  return getApiErrorMessage(error, DEFAULT_LOGIN_ERROR_MESSAGE)
}
