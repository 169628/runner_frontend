<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowRight, CircleAlert, Info, Mail } from 'lucide-vue-next'
import AuthShell from '@/components/AuthShell.vue'
import AuthTabs from '@/components/AuthTabs.vue'
import GoogleButton from '@/components/GoogleButton.vue'
import PasswordInput from '@/components/PasswordInput.vue'
import { ApiError } from '@/api'
import { USE_MOCK } from '@/api/request'
import { homeOf } from '@/router'
import { useUserStore } from '@/stores/user'
import { useGoogleLogin } from './useGoogleLogin'

const store = useUserStore()
const router = useRouter()
const route = useRoute()
const google = useGoogleLogin()

const form = reactive({ email: '', password: '' })
const error = ref('')
const loading = ref(false)

async function onSubmit() {
  error.value = ''
  if (!form.email || !form.password) {
    error.value = '請輸入 Email 與密碼'
    return
  }
  loading.value = true
  try {
    const user = await store.login(form.email.trim(), form.password)
    if (user.mustChangePassword) return router.replace({ name: 'force-change-password' })
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : null
    await router.replace(redirect ?? homeOf(user.role))
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : '登入失敗，請稍後再試'
  } finally {
    loading.value = false
  }
}

const demoAccounts = [
  { label: '一般會員', email: 'runner@pacer.tw', password: 'pacer1234' },
  { label: '管理員', email: 'admin@pacer.tw', password: 'pacer1234' },
  { label: '臨時密碼', email: 'bohan.h@yahoo.com.tw', password: 'Pcr-7K2q-9Xm' },
]
const fillDemo = (account: (typeof demoAccounts)[number]) => Object.assign(form, account)
</script>

<template>
  <AuthShell>
    <h1 class="font-heading text-[28px] font-bold text-ink lg:text-[34px]">歡迎回來</h1>
    <p class="mt-3 text-sm leading-relaxed text-text-lo">登入後即可探索賽事、取得附近的跑步路線，並查看你的健康分析。</p>

    <div class="mt-8"><AuthTabs active="login" /></div>

    <form class="mt-8 flex flex-col" novalidate @submit.prevent="onSubmit">
      <label class="field-label">Email</label>
      <label class="input-box" :class="{ 'is-error': error }">
        <Mail class="size-[18px] shrink-0 text-ink-2" />
        <input v-model="form.email" type="email" placeholder="runner@pacer.tw" autocomplete="email" />
      </label>

      <div class="mt-5 mb-2 flex items-center justify-between">
        <label class="text-[13px] font-bold text-ink">密碼</label>
        <span class="flex items-center gap-1 text-xs text-text-lo"><Info class="size-3.5" />忘記密碼？請聯絡管理員</span>
      </div>
      <PasswordInput v-model="form.password" :error="!!error" />
      <p v-if="error" class="field-error"><CircleAlert class="size-3.5" />{{ error }}</p>

      <button type="submit" class="btn btn-primary mt-7 h-[52px] text-base" :disabled="loading">
        {{ loading ? '登入中…' : '登入' }}
        <ArrowRight v-if="!loading" class="size-[18px]" />
      </button>
    </form>

    <div class="my-6 flex items-center gap-4 text-[13px] text-text-lo">
      <span class="h-px flex-1 bg-line" />或<span class="h-px flex-1 bg-line" />
    </div>
    <GoogleButton label="使用 Google 帳號登入" :loading="google.loading.value" @click="google.start" />

    <!-- 只在 mock 模式顯示，方便切換角色測試畫面 -->
    <div v-if="USE_MOCK" class="mt-6 rounded-2xl border border-dashed border-line p-4 text-xs text-text-lo">
      <p class="font-semibold text-ink-2">Mock 測試帳號（點選帶入）</p>
      <div class="mt-2 flex flex-wrap gap-2">
        <button
          v-for="account in demoAccounts"
          :key="account.email"
          type="button"
          class="rounded-full bg-surface-2 px-3 py-1 hover:bg-line"
          @click="fillDemo(account)"
        >
          {{ account.label }}
        </button>
      </div>
    </div>
  </AuthShell>
</template>
