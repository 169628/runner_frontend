import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as api from '@/api'
import { getCookie, removeCookie, setCookie, TOKEN_KEY } from '@/utils/cookie'
import type { User } from '@/types'

export const useUserStore = defineStore('currentUser', () => {
  const user = ref<User | null>(null)
  /** 已向後端確認過登入狀態（避免每次換頁都打 /me） */
  const checked = ref(false)
  /** 臨時密碼登入時暫存，強制修改密碼頁要當作 currentPassword 送出；只放記憶體 */
  const tempPassword = ref<string | null>(null)

  const isLoggedIn = computed(() => !!user.value)
  const name = computed(() => user.value?.nickname ?? '')
  const role = computed(() => user.value?.role ?? null)
  const initial = computed(() => user.value?.nickname.slice(-1) ?? '')
  const googleLinked = computed(() => !!user.value?.google.linked)

  function setSession(next: User, token?: string) {
    if (token) setCookie(TOKEN_KEY, token)
    user.value = next
    checked.value = true
  }

  async function fetchMe() {
    try {
      user.value = await api.getMe()
    } catch {
      user.value = null
    } finally {
      checked.value = true
    }
    return user.value
  }

  /** 進路由前確認登入狀態：mock 用 cookie 判斷有沒有必要打 /me；真實環境 cookie 是 httpOnly，一律問後端 */
  async function ensureChecked() {
    if (checked.value) return user.value
    if (import.meta.env.VITE_USE_MOCK === 'true' && !getCookie(TOKEN_KEY)) {
      checked.value = true
      return null
    }
    return fetchMe()
  }

  async function login(email: string, password: string) {
    const { user: next, token } = await api.login({ email, password })
    tempPassword.value = next.mustChangePassword ? password : null
    setSession(next, token)
    return next
  }

  async function signup(nickname: string, email: string, password: string) {
    const { user: next, token } = await api.signup({ nickname, email, password })
    setSession(next, token)
    return next
  }

  function clear() {
    removeCookie(TOKEN_KEY)
    user.value = null
    tempPassword.value = null
  }

  async function logout() {
    try {
      await api.logout()
    } finally {
      clear()
    }
  }

  return {
    user,
    checked,
    tempPassword,
    isLoggedIn,
    name,
    role,
    initial,
    googleLinked,
    setSession,
    fetchMe,
    ensureChecked,
    login,
    signup,
    logout,
    clear,
  }
})
