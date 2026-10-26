<script setup lang="ts">
import { reactive, ref } from 'vue'
import { CircleAlert } from 'lucide-vue-next'
import PasswordInput from './PasswordInput.vue'
import { ApiError } from '@/api'
import { isValidPassword, PASSWORD_RULE_HINT } from '@/utils/validators'

export interface PasswordPayload {
  currentPassword: string
  newPassword: string
}

const props = withDefaults(
  defineProps<{
    title?: string
    description?: string
    submitLabel?: string
    /** 是否顯示「目前密碼」欄位（臨時密碼登入時由外部帶入，不必顯示） */
    requireCurrent?: boolean
    submit: (payload: PasswordPayload) => Promise<void>
  }>(),
  { title: '修改密碼', description: '', submitLabel: '更新密碼', requireCurrent: true },
)

const form = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' })
const errors = ref<Record<string, string>>({})
const loading = ref(false)

function validate() {
  const next: Record<string, string> = {}
  if (props.requireCurrent && !form.currentPassword) next.currentPassword = '請輸入目前密碼'
  if (!isValidPassword(form.newPassword)) next.newPassword = PASSWORD_RULE_HINT
  if (form.confirmPassword !== form.newPassword) next.confirmPassword = '兩次輸入的新密碼不一致'
  errors.value = next
  return Object.keys(next).length === 0
}

async function onSubmit() {
  if (!validate()) return
  loading.value = true
  try {
    await props.submit({ currentPassword: form.currentPassword, newPassword: form.newPassword })
    Object.assign(form, { currentPassword: '', newPassword: '', confirmPassword: '' })
  } catch (err) {
    if (err instanceof ApiError) errors.value = { form: err.message, ...err.fields }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <form class="card rounded-3xl p-6 sm:p-8" novalidate @submit.prevent="onSubmit">
    <h2 class="text-lg font-bold text-ink">{{ title }}</h2>
    <p v-if="description" class="mt-1 text-[13px] text-text-lo">{{ description }}</p>

    <div v-if="requireCurrent" class="mt-6">
      <label class="field-label">目前密碼</label>
      <PasswordInput v-model="form.currentPassword" :error="!!errors.currentPassword" />
      <p v-if="errors.currentPassword" class="field-error"><CircleAlert class="size-3.5" />{{ errors.currentPassword }}</p>
    </div>

    <div class="mt-6 grid gap-4 sm:grid-cols-2">
      <div>
        <label class="field-label">新密碼</label>
        <PasswordInput v-model="form.newPassword" autocomplete="new-password" :error="!!errors.newPassword" />
      </div>
      <div>
        <label class="field-label">確認新密碼</label>
        <PasswordInput v-model="form.confirmPassword" autocomplete="new-password" :error="!!errors.confirmPassword" />
      </div>
    </div>
    <p v-if="errors.newPassword || errors.confirmPassword" class="field-error">
      <CircleAlert class="size-3.5" />{{ errors.newPassword || errors.confirmPassword }}
    </p>
    <p v-else class="field-hint">{{ PASSWORD_RULE_HINT }}</p>
    <p v-if="errors.form && !errors.currentPassword && !errors.newPassword" class="field-error">
      <CircleAlert class="size-3.5" />{{ errors.form }}
    </p>

    <div class="mt-8 flex justify-end">
      <button type="submit" class="btn btn-primary h-[46px] w-full px-7 sm:w-auto" :disabled="loading">
        {{ loading ? '處理中…' : submitLabel }}
      </button>
    </div>
  </form>
</template>
