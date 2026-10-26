<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, Building2, Calendar, CalendarClock, ExternalLink, MapPin } from 'lucide-vue-next'
import StatusBadge from '@/components/StatusBadge.vue'
import { ApiError, getEvent } from '@/api'
import { CATEGORY_LABEL } from '@/config/constants'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate, formatDateLong } from '@/utils/formatDateTime'
import type { EventDetail } from '@/types'
import dayjs from 'dayjs'

const route = useRoute()
const event = ref<EventDetail | null>(null)
const notFound = ref(false)

watch(
  () => route.params.id,
  async (id) => {
    if (!id) return
    event.value = null
    notFound.value = false
    try {
      event.value = await getEvent(String(id))
    } catch (err) {
      if (err instanceof ApiError && err.code === 'NOT_FOUND') notFound.value = true
    }
  },
  { immediate: true },
)

const WEEKDAY = ['日', '一', '二', '三', '四', '五', '六']
const heroDate = computed(() => {
  if (!event.value) return ''
  const d = dayjs(event.value.eventDate)
  const start = event.value.divisions[0]?.startTime
  return `${formatDate(d.toDate())}（${WEEKDAY[d.day()]}）${start ? `${start} 起跑` : ''}`
})
const paragraphs = computed(() => event.value?.description.split(/\n+/).filter(Boolean) ?? [])
const formatKm = (km: number) => `${Number(km.toFixed(4))} km`

const infoRows = computed(() =>
  event.value
    ? [
        { icon: Calendar, label: '活動日期', value: formatDateLong(event.value.eventDate) },
        { icon: CalendarClock, label: '報名期間', value: `${formatDate(event.value.registrationStart)} – ${formatDate(event.value.registrationEnd)}` },
        { icon: MapPin, label: '集合地點', value: event.value.venue },
        { icon: Building2, label: '主辦單位', value: event.value.organizer },
      ].filter((row) => row.value)
    : [],
)
</script>

<template>
  <div class="mx-auto max-w-[1440px] px-5 pt-5 pb-14 lg:px-20 lg:pt-7 lg:pb-20">
    <nav class="flex items-center gap-2 text-[13px] text-text-lo">
      <RouterLink to="/events" class="flex items-center gap-2 hover:text-ink"><ArrowLeft class="size-4" />活動探索</RouterLink>
      <span class="text-line">/</span>
      <span class="truncate text-ink">{{ event?.name }}</span>
    </nav>

    <div v-if="notFound" class="card mt-6 px-6 py-20 text-center">
      <h1 class="font-heading text-2xl font-bold">找不到這場賽事</h1>
      <p class="mt-3 text-sm text-text-lo">活動可能已下架或網址有誤。</p>
      <RouterLink to="/events" class="btn btn-primary mt-6 h-11 px-6">回到活動探索</RouterLink>
    </div>

    <div v-else-if="!event" class="mt-5 h-[420px] animate-pulse rounded-[28px] bg-surface-2" />

    <template v-else>
      <!-- Hero -->
      <section
        class="relative mt-5 flex h-[300px] flex-col justify-end overflow-hidden rounded-[24px] bg-cover bg-center p-6 lg:h-[420px] lg:rounded-[28px] lg:p-12"
        :style="{ backgroundImage: `url(${event.coverUrl})` }"
      >
        <div class="absolute inset-0 bg-gradient-to-t from-[#2F2B28]/85 via-[#2F2B28]/25 to-transparent" />
        <div class="relative">
          <div class="flex gap-2">
            <span class="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur">{{ CATEGORY_LABEL[event.category] }}</span>
            <span class="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur">{{ event.county }}</span>
          </div>
          <h1 class="mt-4 font-heading text-[30px] font-bold text-white lg:mt-5 lg:text-5xl">{{ event.name }}</h1>
          <div class="mt-4 flex flex-col gap-2 text-[15px] text-white/90 lg:flex-row lg:gap-7">
            <span class="flex items-center gap-2"><Calendar class="size-4" />{{ heroDate }}</span>
            <span class="flex items-center gap-2"><MapPin class="size-4" />{{ event.county }}{{ event.district }} · {{ event.venue }}</span>
          </div>
        </div>
      </section>

      <div class="mt-10 flex flex-col gap-10 lg:mt-12 lg:flex-row lg:items-start lg:gap-14">
        <div class="min-w-0 flex-1">
          <h2 class="font-heading text-[26px] font-bold text-ink">活動簡介</h2>
          <p v-for="(p, i) in paragraphs" :key="i" class="mt-5 text-base leading-[1.9] text-ink-2">{{ p }}</p>

          <h2 class="mt-14 font-heading text-[26px] font-bold text-ink">賽事組別</h2>
          <div class="mt-6 overflow-x-auto rounded-[20px] border border-line bg-surface">
            <table class="w-full min-w-[520px] text-left">
              <thead class="bg-paper text-xs text-text-lo">
                <tr>
                  <th class="px-6 py-4 font-medium">組別</th>
                  <th class="px-6 py-4 font-medium">距離</th>
                  <th class="px-6 py-4 font-medium">起跑時間</th>
                  <th class="px-6 py-4 font-medium">報名費</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="d in event.divisions" :key="d.name" class="border-t border-line text-[15px]">
                  <td class="px-6 py-4 font-bold text-ink">{{ d.name }}</td>
                  <td class="px-6 py-4 font-display text-ink-2">{{ formatKm(d.distanceKm) }}</td>
                  <td class="px-6 py-4 font-display text-ink-2">{{ d.startTime }}</td>
                  <td class="px-6 py-4 font-display text-ink-2">{{ formatCurrency(d.feeNtd) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <aside class="card w-full shrink-0 rounded-3xl p-7 lg:sticky lg:top-24 lg:w-[400px]">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-bold text-ink">活動資訊</h2>
            <StatusBadge :tone="event.badge === 'CLOSING_SOON' ? 'warn' : 'accent'">
              {{ event.badge === 'CLOSING_SOON' ? '即將截止' : '報名中' }} · 剩 {{ event.daysUntilDeadline }} 天
            </StatusBadge>
          </div>
          <ul class="mt-6 flex flex-col gap-6">
            <li v-for="row in infoRows" :key="row.label" class="flex items-center gap-3.5">
              <span class="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-accent-soft text-accent">
                <component :is="row.icon" class="size-4" />
              </span>
              <div>
                <p class="text-xs text-text-lo">{{ row.label }}</p>
                <p class="mt-1 text-[15px] font-bold text-ink">{{ row.value }}</p>
              </div>
            </li>
          </ul>
          <div class="my-6 h-px bg-line" />
          <a :href="event.registrationUrl" target="_blank" rel="noopener noreferrer" class="btn btn-primary h-[52px] w-full text-base">
            前往官方報名 <ExternalLink class="size-[18px]" />
          </a>
          <p class="mt-4 text-center text-xs text-text-lo">報名將於外部官方網站進行，Pacer 不經手任何報名費用。</p>
        </aside>
      </div>
    </template>
  </div>
</template>
