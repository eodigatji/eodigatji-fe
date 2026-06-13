export type TokenPayload = {
  tokenType: string
  accessToken: string
  refreshToken: string
}

const ACCESS_TOKEN_KEY = 'eodigatji.accessToken'
const REFRESH_TOKEN_KEY = 'eodigatji.refreshToken'
const TOKEN_TYPE_KEY = 'eodigatji.tokenType'
const VERIFIED_EMAIL_KEY = 'eodigatji.verifiedEmail'

export function getStoredTokens(): TokenPayload | null {
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY)
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
  const tokenType = localStorage.getItem(TOKEN_TYPE_KEY)

  if (!accessToken || !refreshToken || !tokenType) {
    return null
  }

  return {
    tokenType,
    accessToken,
    refreshToken,
  }
}

export function setStoredTokens(tokens: TokenPayload) {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
  localStorage.setItem(TOKEN_TYPE_KEY, tokens.tokenType)
}

export function clearStoredTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(TOKEN_TYPE_KEY)
}

export function getStoredVerifiedEmail() {
  return sessionStorage.getItem(VERIFIED_EMAIL_KEY)
}

export function setStoredVerifiedEmail(email: string) {
  sessionStorage.setItem(VERIFIED_EMAIL_KEY, email)
}

export function clearStoredVerifiedEmail() {
  sessionStorage.removeItem(VERIFIED_EMAIL_KEY)
}
