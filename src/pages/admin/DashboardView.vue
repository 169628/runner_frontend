<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { CalendarDays, ClipboardCheck, Users } from 'lucide-vue-next'
import AdminPageHeader from '@/components/AdminPageHeader.vue'
import SourceTag from '@/components/SourceTag.vue'
import { getOverview } from '@/api'
import { formatDate, formatShortDateTime } from '@/utils/formatDateTime'
import type { AdminOverview, CrawlLog } from '@/types'

const data = ref<AdminOverview | null>(null)
onMounted(async () => (data.value = await getOverview()))

const logText = (log: CrawlLog) => {
  const who = log.trigger === 'SCHEDULED' ? '排程' : log.operator
  if (log.status === 'FAILED') return `${who} · ${log.failureReason}`
  if (log.status === 'NO_NEW') return `${who} · 無新活動`
  return `${who} · 抓取 ${log.fetchedCount} 筆，已送審`
}
const logTag = (log: CrawlLog) =>
  log.status === 'FAILED'
    ? { label: '爬取失敗', cls: 'bg-heart-soft text-danger' }
    : log.trigger === 'SCHEDULED'
      ? { label: '排程爬取', cls: 'bg-sleep-soft text-sleep-ink' }
      : { label: '手動爬取', cls: 'bg-surface-2 text-ink-2' }
</script>

<template>
  <AdminPageHeader :crumbs="[{ label: '管理後台' }, { label: '總覽' }]" title="總覽" />

  <div v-if="!data" class="mt-8 grid gap-4 md:grid-cols-3">
    <div v-for="i in 3" :key="i" class="h-[178px] animate-pulse rounded-[20px] bg-surface-2" />
  </div>

  <template v-else>
    <div class="mt-8 grid gap-4 md:grid-cols-3">
      <div
        v-for="stat in [
          { label: '待審核活動', value: data.pendingEvents.total, note: `其中 ${data.pendingEvents.fromScheduled} 筆來自自動匯入`, icon: ClipboardCheck, box: 'bg-warn-soft text-warn' },
          { label: '已發布活動', value: data.publishedEvents.total, note: `本月新增 ${data.publishedEvents.addedThisMonth} 筆`, icon: CalendarDays, box: 'bg-accent-soft text-accent' },
          { label: '會員數', value: data.members.total, note: `管理員 ${data.members.admins} 位`, icon: Users, box: 'bg-sleep-soft text-sleep-ink' },
        ]" :key="stat.label" class="card p-6"
      >
        <div class="flex items-start justify-between">
          <p class="mt-1.5 text-[13px] text-ink-2">{{ stat.label }}</p>
          <span class="flex size-[34px] items-center justify-center rounded-[10px]" :class="stat.box"><component :is="stat.icon" class="size-[18px]" /></span>
        </div>
        <p class="mt-5 font-display text-[40px] font-medium text-ink">{{ stat.value.toLocaleString() }}</p>
        <p class="mt-3 text-xs text-ink-2">{{ stat.note }}</p>
      </div>
    </div>

    <div class="mt-7 grid items-start gap-4 xl:grid-cols-[1fr_400px]">
      <section class="card px-6 pt-6 pb-3">
        <div class="flex items-center justify-between border-b border-line pb-4">
          <h2 class="text-base font-bold text-ink">待審核活動</h2>
          <RouterLink :to="{ name: 'admin-events', query: { status: 'PENDING' } }" class="text-[13px] font-bold text-accent hover:underline">查看全部 →</RouterLink>
        </div>
        <ul>
          <li v-for="e in data.pendingList" :key="e.id" class="flex items-center gap-4 border-b border-line py-4 last:border-0">
            <div class="min-w-0 flex-1">
              <p class="truncate text-[15px] font-bold text-ink">{{ e.name }}</p>
              <p class="mt-1.5 text-xs text-ink-2">
                {{ formatDate(e.eventDate) }} · {{ e.county }} · {{ e.source === 'SCHEDULED_CRAWL' ? '排程' : '手動' }} {{ formatShortDateTime(e.submittedAt) }}
              </p>
            </div>
            <SourceTag :source="e.source" />
            <RouterLink :to="{ name: 'admin-event-edit', params: { id: e.id } }" class="btn btn-outline h-[34px] border-accent px-3.5 text-[13px] text-accent">審核</RouterLink>
          </li>
          <li v-if="!data.pendingList.length" class="py-10 text-center text-sm text-text-lo">目前沒有待審核的活動</li>
        </ul>
      </section>

      <section class="card p-6">
        <h2 class="text-base font-bold text-ink">爬蟲紀錄</h2>
        <ul class="mt-4 flex flex-col gap-4">
          <li v-for="log in data.crawlLogs" :key="log.id" class="flex items-center justify-between gap-3">
            <div class="min-w-0">
              <p class="font-display text-sm font-medium text-ink">{{ formatShortDateTime(log.startedAt) }}</p>
              <p class="mt-1 truncate text-xs" :class="log.status === 'FAILED' ? 'text-danger' : 'text-ink-2'">{{ logText(log) }}</p>
            </div>
            <span class="shrink-0 rounded-md px-2 py-1 text-xs font-semibold" :class="logTag(log).cls">{{ logTag(log).label }}</span>
          </li>
        </ul>
      </section>
    </div>
  </template>
</template>
