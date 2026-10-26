<script setup lang="ts">
import AdminPageHeader from '@/components/AdminPageHeader.vue'
import PasswordForm, { type PasswordPayload } from '@/components/PasswordForm.vue'
import { changePassword } from '@/api'
import { swalHandler } from '@/utils/swalHandler'

async function submit(payload: PasswordPayload) {
  await changePassword(payload)
  swalHandler.success('密碼已更新', '其他裝置上的登入狀態已失效')
}
</script>

<template>
  <AdminPageHeader :crumbs="[{ label: '管理後台', to: '/admin' }, { label: '修改密碼' }]" title="修改密碼" />
  <div class="mt-7 max-w-[720px]">
    <PasswordForm title="變更登入密碼" description="更新後，其他裝置上的登入狀態將會失效。" :submit="submit" />
  </div>
</template>
