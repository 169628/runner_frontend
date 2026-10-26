import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { startGoogleAuth } from '@/api'
import { setCookie, TOKEN_KEY } from '@/utils/cookie'
import { swalHandler } from '@/utils/swalHandler'

/** 登入 / 註冊頁共用的「使用 Google 帳號」流程 */
export function useGoogleLogin() {
  const router = useRouter()
  const loading = ref(false)

  async function start() {
    loading.value = true
    try {
      const result = await startGoogleAuth('LOGIN')
      // mock 模式：沒有真的導去 Google，直接走 callback 頁
      if (result) {
        setCookie(TOKEN_KEY, result.token)
        await router.push(result.redirect)
      }
    } catch {
      swalHandler.error('Google 登入失敗，請稍後再試')
    } finally {
      loading.value = false
    }
  }

  return { loading, start }
}
