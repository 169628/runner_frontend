// A02–A06 認證
import request, { USE_MOCK } from './request'
import type { ApiSuccess, User } from '@/types'

type AuthResult = ApiSuccess<{ user: User; token?: string }>

export const signup = (body: { nickname: string; email: string; password: string }) =>
  request.post<AuthResult>('/auth/register', body).then((res) => res.data.data)

export const login = (body: { email: string; password: string }) =>
  request.post<AuthResult>('/auth/login', body).then((res) => res.data.data)

export const logout = () => request.post('/auth/logout')

/**
 * Google 登入 / 綁定：真實環境是整頁導向後端 A05，完成後後端導回 /auth/callback。
 * mock 模式沒有後端，改呼叫假 API 直接完成，回傳要導去的前端路徑與 token。
 */
export async function startGoogleAuth(intent: 'LOGIN' | 'BIND', redirect?: string) {
  if (USE_MOCK) {
    const res = await request.post<ApiSuccess<{ redirect: string; token: string }>>('/auth/google/mock', { intent })
    return res.data.data
  }
  const query = new URLSearchParams({ intent, ...(redirect ? { redirect } : {}) })
  window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google?${query}`
  return null
}
