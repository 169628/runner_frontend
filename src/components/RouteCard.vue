<script setup lang="ts">
import { ExternalLink } from 'lucide-vue-next'
import type { RunRoute } from '@/types'

defineProps<{ route: RunRoute; active?: boolean }>()
</script>

<template>
  <div
    class="flex w-full items-center gap-4 rounded-[20px] border bg-surface p-3.5 text-left transition-colors"
    :class="active ? 'border-2 border-accent bg-[#F7FAF8] p-[13px]' : 'border-line hover:border-accent/50'"
  >
    <div class="size-[92px] shrink-0 rounded-xl bg-cover bg-center" :style="{ backgroundImage: `url(${route.coverUrl})` }" />
    <div class="flex min-w-0 flex-1 flex-col gap-1.5">
      <h3 class="truncate font-heading text-lg font-bold text-ink">{{ route.name }}</h3>
      <p class="truncate text-[13px] text-text-lo">
        <template v-if="route.loop">{{ route.start.name }} · 起終點同處</template>
        <template v-else-if="route.start.name.length + route.end.name.length > 8">
          起點 {{ route.start.name }} → 終點 {{ route.end.name }}
        </template>
        <template v-else>{{ route.start.name }} → {{ route.end.name }}</template>
      </p>
      <p class="flex items-center gap-1.5 truncate text-xs text-text-lo">
        <ExternalLink class="size-3 shrink-0" />
        來源：{{ route.source.name }}
      </p>
    </div>
    <div class="flex shrink-0 flex-col items-end gap-1 pr-1.5">
      <p class="font-display text-[22px] font-medium text-ink">{{ route.distanceKm }} km</p>
      <p class="text-xs text-text-lo">路線全長</p>
    </div>
  </div>
</template>
