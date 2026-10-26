<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LoaderCircle, TriangleAlert } from 'lucide-vue-next'
import LayoutHeader from '@/layouts/LayoutHeader.vue'
import { useUserStore } from '@/stores/user'

// Google OAuth 完成後，後端（A06）會導回這頁並以 query 告知結果
const ERROR_MESSAGE: Record<string, string> = {
  EMAIL_REGISTERED_WITH_PASSWORD: '這個 Google 帳號的 Email 已經用帳號密碼註冊過，請改用 Email 登入後，到個人基本資料綁定 Google。',
  GOOGLE_ACCOUNT_IN_USE: '這個 Google 帳號已被其他會員綁定。',
  GOOGLE_CANCELLED: '你已取消 Google 授權。',
}

const route = useRoute()
const router = useRouter()
const store = useUserStore()
const error = ref('')

onMounted(async () => {
  const { status, code, redirect } = route.query
  if (status !== 'success') {
    error.value = ERROR_MESSAGE[String(code)] ?? 'Google 登入失敗，請稍後再試。'
    return
  }
  const user = await store.fetchMe()
  if (!user) {
    error.value = '登入狀態已失效，請重新登入。'
    return
  }
  const target = typeof redirect === 'string' && redirect.startsWith('/') ? redirect : '/events'
  router.replace(target)
})
</script>

<template>
  <div class="min-h-screen bg-bg">
    <LayoutHeader />
    <main class="mx-auto flex max-w-[480px] flex-col items-center px-5 py-32 text-center">
      <template v-if="error">
        <div class="flex size-12 items-center justify-center rounded-xl bg-heart-soft text-danger">
          <TriangleAlert class="size-[22px]" />
        </div>
        <h1 class="mt-5 font-heading text-2xl font-bold">無法完成 Google 登入</h1>
        <p class="mt-3 text-sm leading-relaxed text-text-lo">{{ error }}</p>
        <RouterLink :to="store.isLoggedIn ? '/profile' : '/login'" class="btn btn-primary mt-8 h-[46px] px-7">
          {{ store.isLoggedIn ? '回到個人基本資料' : '返回登入' }}
        </RouterLink>
      </template>
      <template v-else>
        <LoaderCircle class="size-8 animate-spin text-accent" />
        <p class="mt-4 text-sm text-text-lo">正在完成 Google 登入…</p>
      </template>
    </main>
  </div>
</template>
