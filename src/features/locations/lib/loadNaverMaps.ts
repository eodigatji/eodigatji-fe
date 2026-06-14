declare global {
  interface Window {
    naver?: any
    navermap_authFailure?: () => void
    __naverMapAuthState?: {
      status: 'idle' | 'failed'
      error: string | null
    }
  }
}

let naverMapsPromise: Promise<any> | null = null

function getExpectedOrigins() {
  const { origin } = window.location

  return origin.startsWith('http://localhost:')
    ? [origin, origin.replace('http://localhost:', 'http://127.0.0.1:')]
    : [origin]
}

function createAuthErrorMessage(clientId: string) {
  const expectedOrigins = getExpectedOrigins()

  return [
    '네이버 지도 인증에 실패했습니다.',
    `Client ID: ${clientId}`,
    `현재 접속 주소: ${window.location.origin}/`,
    `NCP 콘솔의 Web 서비스 URL에 ${expectedOrigins.join(', ')} 와 각 주소의 / 버전까지 등록되어 있는지 확인해주세요.`,
  ].join(' ')
}

function getScriptLoadErrorMessage() {
  return '네이버 지도 SDK 스크립트를 불러오지 못했습니다. 네트워크 상태와 Client ID 설정을 확인해주세요.'
}

export async function loadNaverMaps() {
  const keyId =
    import.meta.env.VITE_NAVER_MAP_KEY_ID?.trim() ??
    import.meta.env.VITE_NAVER_MAP_CLIENT_ID?.trim()

  if (!keyId) {
    throw new Error(
      'VITE_NAVER_MAP_KEY_ID가 설정되지 않았습니다. 이전 이름인 VITE_NAVER_MAP_CLIENT_ID도 fallback으로 지원합니다.',
    )
  }

  window.__naverMapAuthState ??= { status: 'idle', error: null }

  if (window.__naverMapAuthState.status === 'failed') {
    throw new Error(
      window.__naverMapAuthState.error ?? createAuthErrorMessage(keyId),
    )
  }

  if (window.naver?.maps) {
    return window.naver
  }

  if (naverMapsPromise) {
    return naverMapsPromise
  }

  naverMapsPromise = new Promise((resolve, reject) => {
    const scriptId = 'naver-maps-sdk'
    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null

    const cleanupAuthFailure = () => {
      if (window.navermap_authFailure === handleAuthFailure) {
        delete window.navermap_authFailure
      }
    }

    const handleAuthFailure = () => {
      const errorMessage = createAuthErrorMessage(keyId)
      window.__naverMapAuthState = {
        status: 'failed',
        error: errorMessage,
      }
      cleanupAuthFailure()
      reject(new Error(errorMessage))
    }

    const handleLoad = () => {
      cleanupAuthFailure()

      if (window.__naverMapAuthState?.status === 'failed') {
        reject(
          new Error(
            window.__naverMapAuthState.error ?? createAuthErrorMessage(keyId),
          ),
        )
        return
      }

      if (!window.naver?.maps) {
        reject(new Error(getScriptLoadErrorMessage()))
        return
      }

      resolve(window.naver)
    }

    const handleScriptError = () => {
      cleanupAuthFailure()
      reject(new Error(getScriptLoadErrorMessage()))
    }

    window.navermap_authFailure = handleAuthFailure

    if (existingScript) {
      if (window.naver?.maps) {
        handleLoad()
      } else {
        existingScript.addEventListener('load', handleLoad, { once: true })
        existingScript.addEventListener('error', handleScriptError, {
          once: true,
        })
      }

      return
    }

    const script = document.createElement('script')
    script.id = scriptId
    script.async = true
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${keyId}`
    script.addEventListener('load', handleLoad, { once: true })
    script.addEventListener('error', handleScriptError, { once: true })
    document.head.appendChild(script)
  }).catch((error) => {
    naverMapsPromise = null
    throw error
  })

  return naverMapsPromise
}
