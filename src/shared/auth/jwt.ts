type JwtPayload = Record<string, unknown>

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  const binary = window.atob(padded)
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))

  return new TextDecoder().decode(bytes)
}

export function getJwtPayload(token: string | null | undefined): JwtPayload | null {
  if (!token) {
    return null
  }

  const parts = token.split('.')

  if (parts.length < 2) {
    return null
  }

  try {
    return JSON.parse(decodeBase64Url(parts[1])) as JwtPayload
  } catch {
    return null
  }
}

function parseNumericClaim(value: unknown) {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value
  }

  if (typeof value === 'string' && /^\d+$/.test(value)) {
    return Number(value)
  }

  return null
}

export function getCurrentUserIdFromToken(token: string | null | undefined) {
  const payload = getJwtPayload(token)

  if (!payload) {
    return null
  }

  const claimCandidates = [
    payload.userId,
    payload.id,
    payload.memberId,
    payload.sub,
  ]

  for (const claim of claimCandidates) {
    const parsed = parseNumericClaim(claim)

    if (parsed !== null) {
      return parsed
    }
  }

  return null
}
