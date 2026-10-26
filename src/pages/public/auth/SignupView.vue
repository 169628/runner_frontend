<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, CircleAlert, Mail, User } from 'lucide-vue-next'
import AuthShell from '@/components/AuthShell.vue'
import AuthTabs from '@/components/AuthTabs.vue'
import GoogleButton from '@/components/GoogleButton.vue'
import PasswordInput from '@/components/PasswordInput.vue'
import { ApiError } from '@/api'
import { useUserStore } from '@/stores/user'
import { isValidEmail, isValidPassword, PASSWORD_RULE_HINT } from '@/utils/validators'
import { useGoogleLogin } from './useGoogleLogin'

const store = useUserStore()
const router = useRouter()
const google = useGoogleLogin()

const form = reactive({ nickname: '', email: '', password: '', confirmPassword: '' })
const errors = ref<Record<string, string>>({})
const loading = ref(false)

function validate() {
  const next: Record<string, string> = {}
  const nickname = form.nickname.trim()
  if (nickname.length < 2 || nickname.length > 20) next.nickname = '暱稱需為 2～20 字'
  if (!isValidEmail(form.email)) next.email = '請輸入有效的 Email'
  if (!isValidPassword(form.password)) next.password = PASSWORD_RULE_HINT
  if (form.confirmPassword !== form.password) next.confirmPassword = '兩次輸入的密碼不一致'
  errors.value = next
  return Object.keys(next).length === 0
}

async function onSubmit() {
  if (!validate()) return
  loading.value = true
  try {
    await store.signup(form.nickname.trim(), form.email.trim(), form.password)
    await router.replace({ name: 'events' })
  } catch (err) {
    if (err instanceof ApiError) {
      errors.value = err.code === 'EMAIL_TAKEN' ? { email: err.message } : { ...err.fields, form: err.message }
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthShell>
    <h1 class="font-heading text-[28px] font-bold text-ink lg:text-[34px]">建立 Pacer 帳號</h1>
    <p class="mt-3 text-sm leading-relaxed text-text-lo">註冊後即為一般會員，可探索活動與取得路線推薦。</p>

    <div class="mt-8"><AuthTabs active="signup" /></div>

    <form class="mt-8 flex flex-col gap-5" novalidate @submit.prevent="onSubmit">
      <div>
        <label class="field-label">暱稱</label>
        <label class="input-box" :class="{ 'is-error': errors.nickname }">
          <User class="size-[18px] shrink-0 text-ink-2" />
          <input v-model="form.nickname" placeholder="你的跑者名稱" autocomplete="nickname" />
        </label>
        <p v-if="errors.nickname" class="field-error"><CircleAlert class="size-3.5" />{{ errors.nickname }}</p>
      </div>
      <div>
        <label class="field-label">Email</label>
        <label class="input-box" :class="{ 'is-error': errors.email }">
          <Mail class="size-[18px] shrink-0 text-ink-2" />
          <input v-model="form.email" type="email" placeholder="runner@pacer.tw" autocomplete="email" />
        </label>
        <p v-if="errors.email" class="field-error"><CircleAlert class="size-3.5" />{{ errors.email }}</p>
      </div>
      <div>
        <label class="field-label">密碼</label>
        <PasswordInput v-model="form.password" autocomplete="new-password" :error="!!errors.password" />
        <p :class="errors.password ? 'field-error' : 'field-hint'">
          <CircleAlert v-if="errors.password" class="size-3.5" />{{ PASSWORD_RULE_HINT }}
        </p>
      </div>
      <div>
        <label class="field-label">確認密碼</label>
        <PasswordInput v-model="form.confirmPassword" autocomplete="new-password" :error="!!errors.confirmPassword" />
        <p v-if="errors.confirmPassword" class="field-error"><CircleAlert class="size-3.5" />{{ errors.confirmPassword }}</p>
      </div>

      <p v-if="errors.form" class="field-error"><CircleAlert class="size-3.5" />{{ errors.form }}</p>
      <button type="submit" class="btn btn-primary mt-2 h-[52px] text-base" :disabled="loading">
        {{ loading ? '建立中…' : '建立帳號' }}
        <ArrowRight v-if="!loading" class="size-[18px]" />
      </button>
    </form>

    <div class="my-6 flex items-center gap-4 text-[13px] text-text-lo">
      <span class="h-px flex-1 bg-line" />或<span class="h-px flex-1 bg-line" />
    </div>
    <GoogleButton label="使用 Google 帳號註冊" :loading="google.loading.value" @click="google.start" />

    <p class="mt-6 text-center text-sm text-text-lo">
      已經有帳號？
      <RouterLink :to="{ name: 'login' }" class="ml-1 font-bold text-accent hover:underline">返回登入</RouterLink>
    </p>
  </AuthShell>
</template>
