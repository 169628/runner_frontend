<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ShieldCheck, User } from 'lucide-vue-next'
import LogoMark from '@/components/LogoMark.vue'
import PasswordForm, { type PasswordPayload } from '@/components/PasswordForm.vue'
import { changePassword } from '@/api'
import { homeOf } from '@/router'
import { useUserStore } from '@/stores/user'
import { swalHandler } from '@/utils/swalHandler'

const store = useUserStore()
const router = useRouter()

async function submit({ currentPassword, newPassword }: PasswordPayload) {
  await changePassword({ currentPassword: store.tempPassword ?? currentPassword, newPassword })
  store.tempPassword = null
  if (store.user) store.user.mustChangePassword = false
  swalHandler.success('新密碼設定完成')
  await router.replace(homeOf(store.user?.role ?? 'USER'))
}
</script>

<template>
  <div class="min-h-screen bg-bg">
    <!-- 尚未完成改密碼前，不顯示導覽連結 -->
    <header class="border-b border-line">
      <div class="mx-auto flex h-[76px] max-w-[1440px] items-center px-5 lg:px-20">
        <LogoMark />
      </div>
    </header>

    <main class="mx-auto max-w-[600px] px-5 py-16 lg:py-[174px]">
      <div class="flex size-12 items-center justify-center rounded-xl bg-accent-soft text-accent">
        <ShieldCheck class="size-[22px]" />
      </div>
      <h1 class="mt-5 text-[34px] font-bold text-ink">請先設定新密碼</h1>
      <p class="mt-4 text-[15px] leading-[1.6] text-text-lo">
        你目前使用的是管理員提供的臨時密碼。為了帳號安全，請設定一組新密碼，完成後即可進入網站。
      </p>
      <p class="mt-7 flex items-center gap-2.5 rounded-xl bg-surface-2 px-4 py-3 text-sm font-semibold text-ink-2">
        <User class="size-4" /> 登入帳號：{{ store.user?.email }}
      </p>
      <div class="mt-7">
        <PasswordForm
          title="設定新密碼"
          submit-label="設定新密碼並進入網站"
          :require-current="!store.tempPassword"
          :submit="submit"
        />
      </div>
    </main>
  </div>
</template>
