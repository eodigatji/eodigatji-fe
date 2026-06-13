import apiClient from '../../../shared/api/client'
import type { TokenPayload } from '../../../shared/auth/tokenStorage'

export type LoginRequest = {
  email: string
  password: string
}

export type SignupRequest = {
  email: string
  password: string
  studentNumber: string
  nickname: string
}

export async function sendVerificationEmail(email: string) {
  await apiClient.post('/v1/auth/email/send', { email })
}

export async function verifyEmailCode(email: string, code: string) {
  await apiClient.post('/v1/auth/email/verify', { email, code })
}

export async function signup(request: SignupRequest) {
  await apiClient.post('/v1/auth/signup', request)
}

export async function login(request: LoginRequest) {
  const { data } = await apiClient.post<TokenPayload>('/v1/auth/login', request)
  return data
}

export async function reissue(refreshToken: string) {
  const { data } = await apiClient.post<TokenPayload>('/v1/auth/reissue', {
    refreshToken,
  })
  return data
}
