<script setup lang="ts">
import LogoMark from '@/components/LogoMark.vue'
import { useUserStore } from '@/stores/user'

const store = useUserStore()

const links = [
  { to: '/events', label: '活動探索' },
  { to: '/routes', label: '路線推薦' },
  { to: '/health', label: '健康分析' },
]
</script>

<template>
  <header class="sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur">
    <div class="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-5 lg:px-20">
      <RouterLink :to="store.isLoggedIn ? '/events' : '/login'" aria-label="Pacer 首頁">
        <LogoMark />
      </RouterLink>

      <!-- 導覽連結只在登入後出現（手機版改用底部 Tab Bar） -->
      <nav v-if="store.isLoggedIn" class="hidden items-center gap-10 md:flex">
        <RouterLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="text-[15px] text-text-lo transition-colors hover:text-ink"
          active-class="font-bold !text-ink"
        >
          {{ link.label }}
        </RouterLink>
      </nav>

      <RouterLink
        v-if="store.isLoggedIn"
        to="/profile"
        class="flex size-9 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-accent ring-accent/30 hover:ring-4"
        :title="`${store.name}｜個人基本資料`"
      >
        {{ store.initial }}
      </RouterLink>
    </div>
  </header>
</template>
