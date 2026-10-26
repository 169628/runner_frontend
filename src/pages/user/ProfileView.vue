<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Check, CircleAlert, Lock, LogOut, Trash2 } from 'lucide-vue-next'
import ConfirmModal from '@/components/ConfirmModal.vue'
import GoogleIcon from '@/components/GoogleIcon.vue'
import PasswordForm, { type PasswordPayload } from '@/components/PasswordForm.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { ApiError, changePassword, deleteAccount, startGoogleAuth, updateNickname } from '@/api'
import { useUserStore } from '@/stores/user'
import { setCookie, TOKEN_KEY } from '@/utils/cookie'
import { formatDate } from '@/utils/formatDateTime'
import { swalHandler } from '@/utils/swalHandler'

const store = useUserStore()
const router = useRouter()
const user = computed(() => store.user!)

const nickname = ref(user.value.nickname)
const nicknameError = ref('')
const saving = ref(false)
const binding = ref(false)
const deleteOpen = ref(false)
const deleting = ref(false)

watch(() => user.value.nickname, (v) => (nickname.value = v))

const isGoogleAccount = computed(() => user.value.authProvider === 'GOOGLE')

async function saveNickname() {
  const value = nickname.value.trim()
  nicknameError.value = value.length < 2 || value.length > 20 ? '暱稱需為 2～20 字' : ''
  if (nicknameError.value) return
  saving.value = true
  try {
    const result = await updateNickname(value)
    user.value.nickname = result.nickname
    swalHandler.success('已儲存變更')
  } catch (err) {
    nicknameError.value = err instanceof ApiError ? (err.fields.nickname ?? err.message) : '儲存失敗'
  } finally {
    saving.value = false
  }
}

async function bindGoogle() {
  binding.value = true
  try {
    const result = await startGoogleAuth('BIND', '/profile')
    if (result) {
      setCookie(TOKEN_KEY, result.token)
      await router.push(result.redirect)
    }
  } finally {
    binding.value = false
  }
}

async function submitPassword(payload: PasswordPayload) {
  await changePassword(payload)
  swalHandler.success('密碼已更新', '其他裝置上的登入狀態已失效')
}

async function logout() {
  await store.logout()
  router.replace({ name: 'login' })
}

async function confirmDelete() {
  deleting.value = true
  try {
    await deleteAccount()
    store.clear()
    deleteOpen.value = false
    await router.replace({ name: 'login' })
    swalHandler.success('帳號已刪除')
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-[720px] px-5 pt-8 pb-16 lg:pt-16 lg:pb-24">
    <!-- 會員資訊 -->
    <header class="flex items-center gap-4 lg:gap-6">
      <div class="flex size-16 shrink-0 items-center justify-center rounded-full bg-accent-soft font-heading text-[28px] font-bold text-accent lg:size-24 lg:text-[40px]">
        {{ store.initial }}
      </div>
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 class="font-heading text-[26px] font-bold text-ink lg:text-[34px]">{{ user.nickname }}</h1>
          <StatusBadge :tone="user.role === 'ADMIN' ? 'sleep' : 'accent'">
            {{ user.role === 'ADMIN' ? '管理員 ADMIN' : '一般會員 USER' }}
          </StatusBadge>
        </div>
        <p class="mt-2 text-sm text-text-lo">{{ formatDate(user.createdAt) }} 加入 Pacer</p>
      </div>
      <button type="button" class="btn btn-outline h-10 shrink-0 px-4" @click="logout"><LogOut class="size-4" />登出</button>
    </header>

    <!-- 基本資料 -->
    <form class="card mt-8 rounded-3xl p-6 lg:p-8" novalidate @submit.prevent="saveNickname">
      <h2 class="text-lg font-bold text-ink">基本資料</h2>
      <label class="field-label mt-6">暱稱</label>
      <label class="input-box" :class="{ 'is-error': nicknameError }">
        <input v-model="nickname" maxlength="20" />
      </label>
      <p v-if="nicknameError" class="field-error"><CircleAlert class="size-3.5" />{{ nicknameError }}</p>

      <label class="field-label mt-6">Email</label>
      <div class="input-box bg-surface-2 text-text-lo">
        <span class="flex-1 truncate">{{ user.email }}</span>
        <Lock class="size-4 shrink-0 text-ink-2" />
      </div>
      <p class="field-hint">{{ isGoogleAccount ? '以 Google 帳號登入，Email 由 Google 提供，無法修改' : 'Email 為登入帳號，無法修改' }}</p>

      <div class="mt-8 flex gap-3 sm:justify-end">
        <button type="button" class="btn btn-outline h-[46px] flex-1 px-6 sm:flex-none" @click="nickname = user.nickname; nicknameError = ''">取消</button>
        <button type="submit" class="btn btn-primary h-[46px] flex-1 px-7 sm:flex-none" :disabled="saving">
          {{ saving ? '儲存中…' : '儲存變更' }}
        </button>
      </div>
    </form>

    <!-- Google 帳號 -->
    <section class="card mt-8 flex flex-col gap-4 rounded-3xl p-6 sm:flex-row sm:items-center sm:gap-4 lg:px-7">
      <div class="flex items-start gap-4 sm:flex-1">
        <span class="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-2 text-ink"><GoogleIcon class="size-5" /></span>
        <div class="min-w-0">
          <h2 class="text-base font-bold text-ink">Google 帳號</h2>
          <p class="mt-1 text-[13px] leading-relaxed text-text-lo">
            <template v-if="isGoogleAccount">你以 Google 帳號 {{ user.email }} 登入，密碼由 Google 管理；訓練紀錄會用於「健康分析」與「依訓練能力找賽事」。</template>
            <template v-else-if="user.google.linked">已綁定 {{ user.google.email }}，訓練紀錄將用於「健康分析」與活動列表的「依訓練能力找賽事」。</template>
            <template v-else>綁定後可讀取你的訓練紀錄，開放「健康分析」與活動列表的「依訓練能力找賽事」。</template>
          </p>
        </div>
      </div>
      <StatusBadge v-if="isGoogleAccount" :dot="false" class="self-start !px-3.5 !py-2 !text-[13px] sm:self-center"><Check class="size-3.5" />Google 登入</StatusBadge>
      <StatusBadge v-else-if="user.google.linked" :dot="false" class="self-start !px-3.5 !py-2 !text-[13px] sm:self-center"><Check class="size-3.5" />已綁定</StatusBadge>
      <button v-else type="button" class="btn btn-dark h-10 shrink-0 px-5" :disabled="binding" @click="bindGoogle">
        <GoogleIcon class="size-4" />{{ binding ? '前往 Google…' : '綁定 Google 帳號' }}
      </button>
    </section>

    <!-- 修改密碼（Google 會員沒有密碼） -->
    <div v-if="!isGoogleAccount" class="mt-8">
      <PasswordForm description="更新後，其他裝置上的登入狀態將會失效。" :submit="submitPassword" />
    </div>

    <!-- 刪除帳號 -->
    <section class="card mt-8 flex flex-col gap-4 rounded-3xl p-6 sm:flex-row sm:items-center lg:px-7">
      <div class="flex-1">
        <h2 class="text-base font-bold text-ink">刪除此帳號</h2>
        <p class="mt-1 text-[13px] text-text-lo">刪除後將無法復原，帳號與所有個人資料都會被移除。</p>
      </div>
      <button type="button" class="btn btn-danger h-10 px-5" @click="deleteOpen = true"><Trash2 class="size-4" />刪除帳號</button>
    </section>

    <ConfirmModal
      :open="deleteOpen"
      title="確定要刪除帳號嗎？"
      description="刪除後將無法復原，你的帳號、個人資料與已同步的訓練紀錄都會被永久移除。"
      confirm-label="確認刪除帳號"
      :confirm-icon="Trash2"
      :loading="deleting"
      @close="deleteOpen = false"
      @confirm="confirmDelete"
    />
  </div>
</template>
