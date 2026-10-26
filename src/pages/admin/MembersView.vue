<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Check, ChevronDown, Copy, KeyRound, Lock, Search } from 'lucide-vue-next'
import AdminPageHeader from '@/components/AdminPageHeader.vue'
import GoogleIcon from '@/components/GoogleIcon.vue'
import Pagination from '@/components/Pagination.vue'
import { ApiError, createTempPassword, getUsers, updateUserRole } from '@/api'
import { formatDate } from '@/utils/formatDateTime'
import { swalHandler } from '@/utils/swalHandler'
import type { AdminUserListMeta, AdminUserRow, Role } from '@/types'

const PAGE_SIZE = 8
const role = ref<Role | ''>('')
const keyword = ref('')
const page = ref(1)
const list = ref<AdminUserRow[]>([])
const meta = ref<AdminUserListMeta | null>(null)

async function load() {
  const result = await getUsers({ role: role.value || undefined, keyword: keyword.value || undefined, page: page.value, pageSize: PAGE_SIZE })
  list.value = result.list
  meta.value = result.meta
}

let timer: ReturnType<typeof setTimeout>
watch([role, keyword], () => {
  clearTimeout(timer)
  timer = setTimeout(() => (page.value === 1 ? load() : (page.value = 1)), 200)
})
watch(page, load)
load()

const tabs = computed(() => [
  { value: '' as const, label: '全部', count: meta.value?.roleCounts.ALL },
  { value: 'USER' as const, label: 'USER', count: meta.value?.roleCounts.USER },
  { value: 'ADMIN' as const, label: 'ADMIN', count: meta.value?.roleCounts.ADMIN },
])
const rangeText = computed(() => {
  if (!meta.value?.total) return '共 0 筆'
  const from = (meta.value.page - 1) * meta.value.pageSize + 1
  return `顯示 ${from}–${from + list.value.length - 1}，共 ${meta.value.total.toLocaleString()} 筆`
})

const AVATAR_TONES = ['bg-accent-soft text-accent', 'bg-sleep-soft text-sleep-ink', 'bg-warn-soft text-warn-ink', 'bg-heart-soft text-heart-ink']
const avatarTone = (id: number) => AVATAR_TONES[id % AVATAR_TONES.length]

// 彈出層（角色選單 / 臨時密碼）
const roleMenuFor = ref<number | null>(null)
const tempResult = ref<{ userId: number; nickname: string; tempPassword: string } | null>(null)
const copied = ref(false)

const closePopovers = () => {
  roleMenuFor.value = null
  tempResult.value = null
}
const onDocClick = (e: MouseEvent) => {
  if (!(e.target as HTMLElement).closest('[data-popover]')) closePopovers()
}
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))

const ROLE_OPTIONS: { value: Role; desc: string }[] = [
  { value: 'USER', desc: '一般會員：瀏覽活動與推薦路線' },
  { value: 'ADMIN', desc: '管理員：可進入管理後台' },
]

async function changeRole(user: AdminUserRow, next: Role) {
  roleMenuFor.value = null
  if (user.role === next) return
  try {
    await updateUserRole(user.id, next)
    user.role = next
    swalHandler.success(`已將 ${user.nickname} 變更為 ${next}`)
    load()
  } catch (err) {
    swalHandler.error(err instanceof ApiError ? err.message : '變更失敗')
  }
}

async function resetPassword(user: AdminUserRow) {
  closePopovers()
  const ok = await swalHandler.confirm(`為 ${user.nickname} 產生臨時密碼？`, '原密碼與所有裝置的登入狀態將立即失效。', '產生臨時密碼')
  if (!ok) return
  try {
    tempResult.value = await createTempPassword(user.id)
    copied.value = false
  } catch (err) {
    swalHandler.error(err instanceof ApiError ? err.message : '產生失敗')
  }
}

async function copyTemp() {
  if (!tempResult.value) return
  await navigator.clipboard.writeText(tempResult.value.tempPassword)
  copied.value = true
}
</script>

<template>
  <AdminPageHeader :crumbs="[{ label: '管理後台', to: '/admin' }, { label: '會員與角色' }]" title="會員與角色" />

  <div class="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div class="flex w-fit rounded-xl bg-surface-2 p-1">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        type="button"
        class="flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-sm"
        :class="role === tab.value ? 'bg-surface font-bold text-ink shadow-sm' : 'text-ink-2 hover:text-ink'"
        @click="role = tab.value"
      >
        {{ tab.label }} <span class="font-display text-xs font-normal">{{ tab.count?.toLocaleString() ?? '–' }}</span>
      </button>
    </div>
    <label class="flex h-[42px] items-center gap-2.5 rounded-xl border border-line bg-surface px-3.5 sm:w-[320px]">
      <Search class="size-4 text-ink-2" />
      <input v-model="keyword" class="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-text-lo" placeholder="搜尋暱稱或 Email" />
    </label>
  </div>

  <div class="mt-6 overflow-x-auto rounded-[20px] border border-line bg-surface pb-1">
    <table class="w-full min-w-[920px] text-left text-sm">
      <thead class="bg-paper text-xs text-ink-2">
        <tr>
          <th class="px-6 py-4 font-medium">會員</th>
          <th class="px-3 py-4 font-medium">Email</th>
          <th class="px-3 py-4 font-medium">註冊日期</th>
          <th class="px-3 py-4 font-medium">角色</th>
          <th class="px-6 py-4 font-medium">密碼</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in list" :key="user.id" class="border-t border-line">
          <td class="px-6 py-3">
            <div class="flex items-center gap-3">
              <span class="flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold" :class="avatarTone(user.id)">{{ user.nickname.slice(0, 1) }}</span>
              <span class="font-bold text-ink">{{ user.nickname }}<template v-if="user.isSelf">（你）</template></span>
            </div>
          </td>
          <td class="px-3 py-3 text-ink-2">{{ user.email }}</td>
          <td class="px-3 py-3 font-display text-ink-2">{{ formatDate(user.createdAt) }}</td>
          <td class="px-3 py-3">
            <div class="relative" data-popover>
              <span v-if="user.isSelf" class="inline-flex items-center gap-1.5 rounded-full bg-sleep-soft px-3 py-1 font-display text-xs font-semibold text-sleep-ink/70" title="不能修改自己的角色">
                {{ user.role }} <Lock class="size-3" />
              </span>
              <button
                v-else
                type="button"
                class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-display text-xs font-semibold"
                :class="user.role === 'ADMIN' ? 'bg-sleep-soft text-sleep-ink' : 'bg-surface-2 text-ink-2'"
                @click="roleMenuFor = roleMenuFor === user.id ? null : user.id; tempResult = null"
              >
                {{ user.role }} <ChevronDown class="size-3.5" />
              </button>
              <div v-if="roleMenuFor === user.id" class="absolute top-9 left-0 z-20 w-[240px] rounded-2xl border border-line bg-surface p-1.5 shadow-[0_12px_32px_-12px_rgba(47,43,40,0.3)]">
                <button
                  v-for="opt in ROLE_OPTIONS"
                  :key="opt.value"
                  type="button"
                  class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-paper"
                  :class="{ 'bg-paper/70': user.role === opt.value }"
                  @click="changeRole(user, opt.value)"
                >
                  <div class="flex-1">
                    <p class="font-display text-[13px] font-semibold text-ink">{{ opt.value }}</p>
                    <p class="mt-0.5 text-xs text-ink-2">{{ opt.desc }}</p>
                  </div>
                  <Check v-if="user.role === opt.value" class="size-4 text-accent" />
                </button>
              </div>
            </div>
          </td>
          <td class="px-6 py-3">
            <div class="relative" data-popover>
              <span v-if="user.authProvider === 'GOOGLE'" class="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-xs font-semibold text-ink-2">
                <GoogleIcon class="size-3.5 text-[#4285F4]" />Google 會員
              </span>
              <button
                v-else
                type="button"
                class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold"
                :class="tempResult?.userId === user.id ? 'border-accent bg-accent-soft text-accent' : 'border-line text-ink hover:bg-paper'"
                @click="resetPassword(user)"
              >
                <KeyRound class="size-3.5" />重設密碼
              </button>
              <div v-if="tempResult?.userId === user.id" class="absolute top-10 right-0 z-20 w-[300px] rounded-2xl border border-line bg-surface p-4 shadow-[0_12px_32px_-12px_rgba(47,43,40,0.3)]">
                <p class="flex items-center gap-2 text-sm font-bold text-ink"><KeyRound class="size-4" />已為 {{ tempResult.nickname }} 產生臨時密碼</p>
                <div class="mt-3 flex items-center justify-between rounded-xl bg-paper px-3.5 py-2.5">
                  <code class="font-display text-[15px] font-semibold tracking-wide text-ink">{{ tempResult.tempPassword }}</code>
                  <button type="button" class="flex items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-semibold" @click="copyTemp">
                    <Check v-if="copied" class="size-3.5 text-accent" /><Copy v-else class="size-3.5" />{{ copied ? '已複製' : '複製' }}
                  </button>
                </div>
                <p class="mt-3 text-xs leading-relaxed text-ink-2">請將密碼提供給會員。會員以臨時密碼登入後，需先設定新密碼才能進入網站。</p>
              </div>
            </div>
          </td>
        </tr>
        <tr v-if="!list.length">
          <td colspan="5" class="py-16 text-center text-sm text-text-lo">沒有符合條件的會員</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
    <p class="text-[13px] text-ink-2">{{ rangeText }}</p>
    <Pagination v-if="meta && meta.totalPages > 1" v-model="page" :total-pages="meta.totalPages" size="sm" />
  </div>
  <p class="mt-8 text-xs text-ink-2">角色分為 USER（一般會員）與 ADMIN（管理員），變更後立即生效。</p>
</template>
