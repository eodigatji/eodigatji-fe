import { create } from 'zustand'
import {
  clearStoredTokens,
  clearStoredVerifiedEmail,
  getStoredTokens,
  getStoredVerifiedEmail,
  setStoredTokens,
  setStoredVerifiedEmail,
  type TokenPayload,
} from '../../../shared/auth/tokenStorage'

type AuthState = {
  accessToken: string | null
  refreshToken: string | null
  tokenType: string | null
  verifiedEmail: string | null
  clearTokens: () => void
  clearVerifiedEmail: () => void
  isAuthenticated: boolean
  setTokens: (tokens: TokenPayload) => void
  setVerifiedEmail: (email: string) => void
}

const initialTokens = getStoredTokens()
const initialVerifiedEmail = getStoredVerifiedEmail()

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: initialTokens?.accessToken ?? null,
  refreshToken: initialTokens?.refreshToken ?? null,
  tokenType: initialTokens?.tokenType ?? null,
  verifiedEmail: initialVerifiedEmail,
  isAuthenticated: Boolean(initialTokens?.accessToken),
  setTokens: (tokens) => {
    setStoredTokens(tokens)
    set({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenType: tokens.tokenType,
      isAuthenticated: true,
    })
  },
  clearTokens: () => {
    clearStoredTokens()
    set({
      accessToken: null,
      refreshToken: null,
      tokenType: null,
      isAuthenticated: false,
    })
  },
  setVerifiedEmail: (email) => {
    setStoredVerifiedEmail(email)
    set({ verifiedEmail: email })
  },
  clearVerifiedEmail: () => {
    clearStoredVerifiedEmail()
    set({ verifiedEmail: null })
  },
}))
