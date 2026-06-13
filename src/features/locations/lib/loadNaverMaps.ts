declare global {
  interface Window {
    naver?: any
    navermap_authFailure?: () => void
  }
}

let naverMapsPromise: Promise<any> | null = null

export async function loadNaverMaps() {
  const clientId = import.meta.env.VITE_NAVER_MAP_CLIENT_ID?.trim()

  if (!clientId) {
    throw new Error('VITE_NAVER_MAP_CLIENT_ID가 설정되지 않았습니다.')
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
      cleanupAuthFailure()
      reject(new Error('네이버 지도 인증에 실패했습니다. 도메인과 Key ID를 확인해 주세요.'))
    }

    const handleLoad = () => {
      cleanupAuthFailure()

      if (!window.naver?.maps) {
        reject(new Error('네이버 지도 SDK를 불러오지 못했습니다.'))
        return
      }

      resolve(window.naver)
    }

    window.navermap_authFailure = handleAuthFailure

    if (existingScript) {
      if (window.naver?.maps) {
        handleLoad()
      } else {
        existingScript.addEventListener('load', handleLoad, { once: true })
        existingScript.addEventListener(
          'error',
          () => {
            cleanupAuthFailure()
            reject(new Error('네이버 지도 SDK 스크립트 로딩에 실패했습니다.'))
          },
          { once: true },
        )
      }

      return
    }

    const script = document.createElement('script')
    script.id = scriptId
    script.async = true
    script.src =
      `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}`
    script.addEventListener('load', handleLoad, { once: true })
    script.addEventListener(
      'error',
      () => {
        cleanupAuthFailure()
        reject(new Error('네이버 지도 SDK 스크립트 로딩에 실패했습니다.'))
      },
      { once: true },
    )
    document.head.appendChild(script)
  }).catch((error) => {
    naverMapsPromise = null
    throw error
  })

  return naverMapsPromise
}
