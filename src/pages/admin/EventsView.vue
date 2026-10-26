<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CloudOff, Pencil, Plus, RefreshCw, RotateCcw, Search, Trash2 } from 'lucide-vue-next'
import AdminPageHeader from '@/components/AdminPageHeader.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import EventStatusBadge from '@/components/EventStatusBadge.vue'
import Pagination from '@/components/Pagination.vue'
import PillSelect from '@/components/PillSelect.vue'
import SourceTag from '@/components/SourceTag.vue'
import { ApiError, deleteEvent, getAdminEvents, triggerCrawl, updateEventStatus } from '@/api'
import { CATEGORY_LABEL, COUNTIES, SOURCE_LABEL, STATUS_LABEL } from '@/config/constants'
import { formatDate, formatDotDateTime, formatShortDateTime } from '@/utils/formatDateTime'
import { swalHandler } from '@/utils/swalHandler'
import type { AdminEventListMeta, AdminEventRow, CrawlJob, EventCategory, EventSource, EventStatus } from '@/types'

const PAGE_SIZE = 8
const route = useRoute()
const router = useRouter()

const status = ref<EventStatus | ''>((route.query.status as EventStatus) ?? '')
const keyword = ref('')
const category = ref<EventCategory | ''>('')
const county = ref('')
const source = ref<EventSource | ''>('')
const page = ref(1)

const list = ref<AdminEventRow[]>([])
const meta = ref<AdminEventListMeta | null>(null)
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const result = await getAdminEvents({
      status: status.value || undefined,
      keyword: keyword.value || undefined,
      category: category.value || undefined,
      county: county.value || undefined,
      source: source.value || undefined,
      page: page.value,
      pageSize: PAGE_SIZE,
    })
    list.value = result.list
    meta.value = result.meta
  } finally {
    loading.value = false
  }
}

let timer: ReturnType<typeof setTimeout>
watch([status, keyword, category, county, source], () => {
  clearTimeout(timer)
  timer = setTimeout(() => (page.value === 1 ? load() : (page.value = 1)), 200)
  router.replace({ query: status.value ? { status: status.value } : {} })
})
watch(page, load)
load()

const tabs = computed(() => [
  { value: '' as const, label: '全部', count: meta.value?.statusCounts.ALL },
  ...(Object.keys(STATUS_LABEL) as EventStatus[]).map((s) => ({ value: s, label: STATUS_LABEL[s], count: meta.value?.statusCounts[s] })),
])
const categoryOptions = (Object.keys(CATEGORY_LABEL) as EventCategory[]).map((v) => ({ value: v, label: CATEGORY_LABEL[v] }))
const countyOptions = COUNTIES.map((c) => ({ value: c, label: c }))
const sourceOptions = (Object.keys(SOURCE_LABEL) as EventSource[]).map((v) => ({ value: v, label: SOURCE_LABEL[v] }))
const rangeText = computed(() => {
  if (!meta.value || !meta.value.total) return '共 0 筆'
  const from = (meta.value.page - 1) * meta.value.pageSize + 1
  return `顯示 ${from}–${from + list.value.length - 1}，共 ${meta.value.total} 筆`
})

// 下架
async function close(row: AdminEventRow) {
  if (!(await swalHandler.confirm(`確定要下架「${row.name}」？`, '下架後前台活動列表將不再顯示此活動。', '下架'))) return
  await updateEventStatus(row.id, 'CLOSED')
  swalHandler.success('已下架')
  load()
}

// 刪除
const deleting = ref<AdminEventRow | null>(null)
const deleteLoading = ref(false)
async function confirmDelete() {
  if (!deleting.value) return
  deleteLoading.value = true
  try {
    await deleteEvent(deleting.value.id)
    swalHandler.success('活動已刪除')
    deleting.value = null
    load()
  } finally {
    deleteLoading.value = false
  }
}

// 手動爬取
const crawling = ref(false)
const failedJob = ref<CrawlJob | null>(null)
async function crawl() {
  failedJob.value = null
  crawling.value = true
  try {
    const job = await triggerCrawl()
    if (job.status === 'FAILED') failedJob.value = job
    else if (job.status === 'NO_NEW') swalHandler.info('沒有新的活動')
    else {
      swalHandler.success(`抓取 ${job.fetchedCount} 筆，已送審`)
      load()
    }
  } catch (err) {
    swalHandler.error(err instanceof ApiError ? err.message : '爬取失敗')
  } finally {
    crawling.value = false
  }
}
</script>

<template>
  <AdminPageHeader :crumbs="[{ label: '管理後台', to: '/admin' }, { label: '活動管理' }]" title="活動管理">
    <template #actions>
      <button type="button" class="btn btn-outline h-11 px-5" :disabled="crawling" @click="crawl">
        <RefreshCw class="size-4" :class="{ 'animate-spin': crawling }" />{{ crawling ? '爬取中…' : '手動爬取' }}
      </button>
      <RouterLink :to="{ name: 'admin-event-new' }" class="btn btn-primary h-11 px-5"><Plus class="size-4" />新增活動</RouterLink>
    </template>
  </AdminPageHeader>

  <!-- 狀態分頁 -->
  <div class="mt-6 flex gap-1 overflow-x-auto border-b border-line">
    <button
      v-for="tab in tabs"
      :key="tab.value"
      type="button"
      class="-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3.5 pt-1 pb-3 text-sm"
      :class="status === tab.value ? 'border-ink font-bold text-ink' : 'border-transparent text-ink-2 hover:text-ink'"
      @click="status = tab.value"
    >
      {{ tab.label }}
      <span
        class="rounded-full px-2 py-0.5 font-display text-[11px] font-semibold"
        :class="tab.value === 'PENDING' ? 'bg-warn-soft text-warn-ink' : 'bg-surface-2 text-ink-2'"
      >{{ tab.count ?? '–' }}</span>
    </button>
  </div>

  <!-- 篩選 -->
  <div class="mt-6 flex flex-wrap gap-2.5">
    <label class="flex h-11 w-full items-center gap-2.5 rounded-xl border border-line bg-surface px-3.5 sm:w-[340px]">
      <Search class="size-4 text-ink-2" />
      <input v-model="keyword" class="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-text-lo" placeholder="搜尋活動名稱" />
    </label>
    <PillSelect v-model="category" label="分類" :options="categoryOptions" />
    <PillSelect v-model="county" label="地區" :options="countyOptions" />
    <PillSelect v-model="source" label="來源" :options="sourceOptions" />
  </div>

  <!-- 表格 -->
  <div class="mt-6 overflow-x-auto rounded-[20px] border border-line bg-surface">
    <table class="w-full min-w-[1000px] text-left text-sm transition-opacity" :class="{ 'opacity-60': loading }">
      <thead class="bg-paper text-xs text-ink-2">
        <tr>
          <th class="px-5 py-4 font-medium">活動</th>
          <th class="px-3 py-4 font-medium">活動日期</th>
          <th class="px-3 py-4 font-medium">地區</th>
          <th class="px-3 py-4 font-medium">來源</th>
          <th class="px-3 py-4 font-medium">狀態</th>
          <th class="px-3 py-4 font-medium">更新時間</th>
          <th class="px-5 py-4 font-medium">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in list" :key="row.id" class="border-t border-line">
          <td class="px-5 py-3">
            <div class="flex items-center gap-3">
              <span class="size-11 shrink-0 rounded-lg bg-cover bg-center" :style="{ backgroundImage: `url(${row.coverUrl})` }" />
              <div class="min-w-0">
                <p class="truncate font-bold text-ink">{{ row.name }}</p>
                <p class="mt-1 text-xs text-ink-2">{{ CATEGORY_LABEL[row.category] }}</p>
              </div>
            </div>
          </td>
          <td class="px-3 py-3 font-display text-ink-2">{{ formatDate(row.eventDate) }}</td>
          <td class="px-3 py-3 text-ink-2">{{ row.county }}</td>
          <td class="px-3 py-3"><SourceTag :source="row.source" /></td>
          <td class="px-3 py-3"><EventStatusBadge :status="row.status" /></td>
          <td class="px-3 py-3 font-display text-ink-2">{{ formatShortDateTime(row.updatedAt) }}</td>
          <td class="px-5 py-3">
            <div class="flex items-center gap-1.5">
              <RouterLink v-if="row.status === 'PENDING'" :to="{ name: 'admin-event-edit', params: { id: row.id } }" class="btn btn-primary h-8 w-[50px] text-xs">審核</RouterLink>
              <button v-else-if="row.status === 'PUBLISHED'" type="button" class="btn btn-outline h-8 w-[50px] text-xs font-semibold" @click="close(row)">下架</button>
              <span v-else class="w-[50px]" />
              <RouterLink
                v-if="row.status === 'PENDING' || row.status === 'PUBLISHED'"
                :to="{ name: 'admin-event-edit', params: { id: row.id } }"
                class="flex size-8 items-center justify-center rounded-lg text-ink-2 hover:bg-paper hover:text-ink"
                title="編輯"
              >
                <Pencil class="size-4" />
              </RouterLink>
              <span v-else class="size-8" />
              <button type="button" class="flex size-8 items-center justify-center rounded-lg text-danger hover:bg-heart-soft" title="刪除" @click="deleting = row">
                <Trash2 class="size-4" />
              </button>
            </div>
          </td>
        </tr>
        <tr v-if="!list.length && !loading">
          <td colspan="7" class="py-16 text-center text-sm text-text-lo">沒有符合條件的活動</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
    <p class="text-[13px] text-ink-2">{{ rangeText }}</p>
    <Pagination v-if="meta && meta.totalPages > 1" v-model="page" :total-pages="meta.totalPages" size="sm" />
  </div>

  <!-- 刪除確認 -->
  <ConfirmModal
    :open="!!deleting"
    title="確定要刪除這個活動嗎？"
    description="刪除後將無法復原，活動資料與爬取紀錄都會一併移除。"
    confirm-label="確認刪除"
    :confirm-icon="Trash2"
    :loading="deleteLoading"
    @close="deleting = null"
    @confirm="confirmDelete"
  >
    <div v-if="deleting" class="mt-5 rounded-xl bg-paper px-4 py-3.5">
      <p class="text-sm font-bold text-ink">{{ deleting.name }}</p>
      <p class="mt-1 text-xs text-ink-2">{{ formatDate(deleting.eventDate) }} · {{ deleting.county }} · {{ STATUS_LABEL[deleting.status] }}</p>
    </div>
  </ConfirmModal>

  <!-- 爬取失敗 -->
  <ConfirmModal
    :open="!!failedJob"
    title="手動爬取失敗"
    :description="`無法連線到「${failedJob?.sourceName}」，這次沒有抓到任何活動，現有資料不受影響。請稍後再試一次。`"
    :icon="CloudOff"
    cancel-label="關閉"
    confirm-label="重新爬取"
    :confirm-icon="RotateCcw"
    variant="primary"
    :loading="crawling"
    @close="failedJob = null"
    @confirm="crawl"
  >
    <div v-if="failedJob" class="mt-5 rounded-xl bg-paper px-4 py-3.5">
      <p class="text-sm font-bold text-ink">原因：{{ failedJob.failureReason }}</p>
      <p class="mt-1 text-xs text-ink-2">{{ formatDotDateTime(failedJob.startedAt) }} · {{ failedJob.operator }} · 手動爬取</p>
    </div>
  </ConfirmModal>
</template>
