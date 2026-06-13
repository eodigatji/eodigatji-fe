import axios, { AxiosHeaders, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '../../features/auth/store/authStore'
import {
  clearStoredTokens,
  getStoredTokens,
  type TokenPayload,
} from '../auth/tokenStorage'
import { API_BASE_URL } from './config'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

let refreshPromise: Promise<TokenPayload | null> | null = null

function attachAuthorizationHeader(
  config: InternalAxiosRequestConfig,
  value: string,
) {
  const headers = AxiosHeaders.from(config.headers)
  headers.set('Authorization', value)
  config.headers = headers
}

apiClient.interceptors.request.use((config) => {
  const tokens = getStoredTokens()

  if (tokens?.accessToken) {
    attachAuthorizationHeader(
      config,
      `${tokens.tokenType} ${tokens.accessToken}`,
    )
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }
    const tokens = getStoredTokens()
    const requestUrl = String(originalRequest?.url ?? '')

    const isAuthRequest =
      requestUrl.includes('/v1/auth/login') ||
      requestUrl.includes('/v1/auth/reissue')

    if (
      error.response?.status !== 401 ||
      originalRequest?._retry ||
      !tokens?.refreshToken ||
      isAuthRequest
    ) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    if (!refreshPromise) {
      refreshPromise = axios
        .post<TokenPayload>(`${API_BASE_URL}/v1/auth/reissue`, {
          refreshToken: tokens.refreshToken,
        })
        .then((response) => {
          useAuthStore.getState().setTokens(response.data)
          return response.data
        })
        .catch((refreshError) => {
          clearStoredTokens()
          useAuthStore.getState().clearTokens()
          return Promise.reject(refreshError)
        })
        .finally(() => {
          refreshPromise = null
        })
    }

    const nextTokens = await refreshPromise

    if (!nextTokens) {
      return Promise.reject(error)
    }

    attachAuthorizationHeader(
      originalRequest,
      `${nextTokens.tokenType} ${nextTokens.accessToken}`,
    )

    return apiClient(originalRequest)
  },
)

export default apiClient
