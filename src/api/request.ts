import axios, { AxiosError } from 'axios'
import { isPublicApi } from '@/config/routeTable'
import { getCookie, removeCookie, TOKEN_KEY } from '@/utils/cookie'
import type { ApiErrorBody } from '@/types'

export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

/** API 呼叫失敗時統一丟出的錯誤（對應 API 規格的 error 物件） */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields: Record<string, string> = {},
  ) {
    super(message)
  }
}

const request = axios.create({
  baseURL: USE_MOCK ? '' : import.meta.env.VITE_API_BASE_URL,
  timeout: 35_000,
  withCredentials: true,
})

if (USE_MOCK) {
  // 動態載入，正式 build（VITE_USE_MOCK=false）時不會把假資料打包進去
  const { mockAdapter } = await import('@/mock/adapter')
  request.defaults.adapter = mockAdapter
}

// 依 ROUTE_TABLE 決定是否塞 Bearer token
request.interceptors.request.use((config) => {
  const token = getCookie(TOKEN_KEY)
  if (token && !isPublicApi(config.url)) config.headers.Authorization = `Bearer ${token}`
  return config
})

let onUnauthorized: (() => void) | null = null
/** 由 router 註冊：登入失效時要做的事（清除使用者、導回登入頁） */
export const setUnauthorizedHandler = (handler: () => void) => (onUnauthorized = handler)

request.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    const status = error.response?.status ?? 0
    const body = error.response?.data?.error
    if (status === 401 && !isPublicApi(error.config?.url)) {
      removeCookie(TOKEN_KEY)
      onUnauthorized?.()
    }
    return Promise.reject(
      new ApiError(status, body?.code ?? 'NETWORK_ERROR', body?.message ?? '連線失敗，請稍後再試', body?.fields),
    )
  },
)

export default request
