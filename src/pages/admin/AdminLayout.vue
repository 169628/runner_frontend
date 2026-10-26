<script setup lang="ts">
import { useRouter } from 'vue-router'
import { CalendarDays, KeyRound, LayoutGrid, LogOut, Users } from 'lucide-vue-next'
import LogoMark from '@/components/LogoMark.vue'
import { useUserStore } from '@/stores/user'

const store = useUserStore()
const router = useRouter()

const menu = [
  { to: '/admin/dashboard', label: '總覽', icon: LayoutGrid },
  { to: '/admin/events', label: '活動管理', icon: CalendarDays },
  { to: '/admin/members', label: '會員與角色', icon: Users },
]

async function logout() {
  await store.logout()
  router.replace({ name: 'login' })
}
</script>

<template>
  <div class="min-h-screen bg-bg lg:flex">
    <aside class="flex flex-col gap-4 bg-ink px-4 py-4 lg:sticky lg:top-0 lg:h-screen lg:w-[248px] lg:shrink-0 lg:gap-8 lg:py-7">
      <div class="flex items-center justify-between px-2 lg:justify-start lg:gap-2.5">
        <div class="flex items-center gap-2.5">
          <LogoMark size="sm" dark />
          <span class="rounded-md bg-white/12 px-2 py-[3px] text-xs font-semibold text-white/80">後台</span>
        </div>
        <button type="button" class="text-white/60 hover:text-white lg:hidden" aria-label="登出" @click="logout"><LogOut class="size-5" /></button>
      </div>

      <nav class="flex gap-1 overflow-x-auto lg:flex-col">
        <p class="mb-1 hidden px-0 text-xs tracking-[1px] text-white/45 lg:block">管理</p>
        <RouterLink
          v-for="item in [...menu, { to: '/admin/password', label: '修改密碼', icon: KeyRound }]"
          :key="item.to"
          :to="item.to"
          class="flex shrink-0 items-center gap-3 rounded-[10px] px-3 py-[11px] text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
          :class="{ 'lg:hidden': item.to === '/admin/password', 'bg-white/10 font-bold !text-white': $route.path.startsWith(item.to) }"
        >
          <component :is="item.icon" class="size-[18px]" />
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="mt-auto hidden flex-col gap-2 lg:flex">
        <RouterLink
          to="/admin/password"
          class="flex items-center gap-3 rounded-[10px] px-3 py-[11px] text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
          active-class="bg-white/10 font-bold !text-white"
        >
          <KeyRound class="size-[18px]" />修改密碼
        </RouterLink>
        <div class="flex items-center gap-2.5 rounded-xl bg-white/6 p-3">
          <span class="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-accent text-[13px] font-bold text-white">管</span>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-semibold text-white">{{ store.name }}</p>
            <p class="font-display text-xs tracking-[1px] text-white/50">ADMIN</p>
          </div>
          <button type="button" class="text-white/60 hover:text-white" aria-label="登出" title="登出" @click="logout"><LogOut class="size-[18px]" /></button>
        </div>
      </div>
    </aside>

    <main class="min-w-0 flex-1 px-5 py-6 lg:px-10 lg:py-8">
      <RouterView />
    </main>
  </div>
</template>
