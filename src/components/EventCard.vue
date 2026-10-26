<script setup lang="ts">
import { computed } from 'vue'
import { CalendarDays, MapPin } from 'lucide-vue-next'
import StatusBadge from './StatusBadge.vue'
import { CATEGORY_LABEL } from '@/config/constants'
import { formatDateWithWeekday, formatMonthDay } from '@/utils/formatDateTime'
import type { EventSummary } from '@/types'

const props = defineProps<{ event: EventSummary }>()

const distances = computed(() => props.event.distancesKm.map((km) => `${Math.round(km)}K`))
</script>

<template>
  <RouterLink
    :to="{ name: 'event-detail', params: { id: event.id } }"
    class="group flex flex-col overflow-hidden rounded-[20px] border border-line bg-surface transition-shadow hover:shadow-[0_8px_24px_-12px_rgba(47,43,40,0.25)]"
  >
    <div
      class="flex h-[188px] items-start justify-between bg-cover bg-center p-3.5"
      :style="{ backgroundImage: `url(${event.coverUrl})` }"
    >
      <span class="rounded-full bg-white/90 px-3 py-[5px] text-xs font-semibold text-ink">
        {{ CATEGORY_LABEL[event.category] }}
      </span>
      <StatusBadge :tone="event.badge === 'CLOSING_SOON' ? 'warn' : 'accent'">
        {{ event.badge === 'CLOSING_SOON' ? '即將截止' : '報名中' }}
      </StatusBadge>
    </div>
    <div class="flex flex-col gap-2.5 px-5 pt-[18px] pb-5">
      <p class="flex items-center gap-1.5 text-[13px] font-semibold text-accent">
        <CalendarDays class="size-3.5" />
        {{ formatDateWithWeekday(event.eventDate) }}
      </p>
      <h3 class="font-heading text-xl font-bold text-ink group-hover:text-accent">{{ event.name }}</h3>
      <p class="flex items-center gap-1.5 text-[13px] text-text-lo">
        <MapPin class="size-3.5" />
        {{ event.county }} · {{ event.district }}
      </p>
      <div class="h-px bg-line" />
      <div class="flex items-center justify-between gap-2">
        <div class="flex gap-1.5">
          <span v-for="d in distances" :key="d" class="chip">{{ d }}</span>
        </div>
        <span class="text-xs whitespace-nowrap text-text-lo">報名至 {{ formatMonthDay(event.registrationEnd) }}</span>
      </div>
    </div>
  </RouterLink>
</template>
