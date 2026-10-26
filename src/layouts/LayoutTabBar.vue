<script setup lang="ts">
import { CalendarDays, HeartPulse, Route } from 'lucide-vue-next'

const tabs = [
  { to: '/events', label: '活動探索', icon: CalendarDays },
  { to: '/routes', label: '路線推薦', icon: Route },
  { to: '/health', label: '健康分析', icon: HeartPulse },
]
</script>

<template>
  <!-- 手機版底部導覽 -->
  <nav class="fixed inset-x-4 bottom-4 z-30 flex rounded-full border border-line bg-surface/95 p-1.5 shadow-[0_8px_24px_-12px_rgba(47,43,40,0.3)] backdrop-blur md:hidden">
    <RouterLink
      v-for="tab in tabs"
      :key="tab.to"
      :to="tab.to"
      class="flex flex-1 flex-col items-center gap-1 rounded-full py-2 text-xs text-ink-2"
      active-class="bg-accent-soft font-bold !text-accent"
    >
      <component :is="tab.icon" class="size-5" />
      {{ tab.label }}
    </RouterLink>
  </nav>
</template>
