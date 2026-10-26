<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ArrowUpDown, ChevronDown, RotateCcw, Search, SearchX, SlidersHorizontal, X } from 'lucide-vue-next'
import EventCard from '@/components/EventCard.vue'
import EventFilters, { type EventFilterState } from '@/components/EventFilters.vue'
import Pagination from '@/components/Pagination.vue'
import { ApiError, getEvents, getRaceRecommendation } from '@/api'
import { CATEGORY_LABEL, DISTANCE_LABEL } from '@/config/constants'
import { useUserStore } from '@/stores/user'
import { swalHandler } from '@/utils/swalHandler'
import type { EventListMeta, EventListQuery, EventSummary } from '@/types'

const PAGE_SIZE = 6
const emptyFilters = (): EventFilterState => ({ categories: [], county: '', distance: [], dateFrom: '', dateTo: '' })

const store = useUserStore()
const keywordInput = ref('')
const keyword = ref('')
const filters = ref<EventFilterState>(emptyFilters())
const sort = ref<NonNullable<EventListQuery['sort']>>('eventDate')
const page = ref(1)

const list = ref<EventSummary[]>([])
const meta = ref<EventListMeta | null>(null)
const loading = ref(true)
const recommending = ref(false)
const sheetOpen = ref(false)

async function load() {
  loading.value = true
  try {
    const result = await getEvents({ keyword: keyword.value, ...filters.value, sort: sort.value, page: page.value, pageSize: PAGE_SIZE })
    list.value = result.list
    meta.value = result.meta
  } finally {
    loading.value = false
  }
}

watch([keyword, filters, sort], () => {
  if (page.value !== 1) page.value = 1
  else load()
}, { deep: true })
watch(page, () => {
  load()
  window.scrollTo({ top: 0, behavior: 'smooth' })
})
load()

const search = () => (keyword.value = keywordInput.value.trim())

function clearAll() {
  filters.value = emptyFilters()
  keywordInput.value = ''
  keyword.value = ''
}

async function recommend() {
  recommending.value = true
  try {
    const result = await getRaceRecommendation()
    if (!result.distanceBuckets.length) return swalHandler.info('訓練資料不足', '近期訓練紀錄太少，暫時無法推薦')
    filters.value = { ...filters.value, distance: result.distanceBuckets }
    swalHandler.success('已依訓練能力套用距離', result.message)
  } catch (err) {
    swalHandler.error(err instanceof ApiError ? err.message : '無法取得訓練資料')
  } finally {
    recommending.value = false
  }
}

const total = computed(() => meta.value?.total ?? 0)

/** 手機版：已套用的篩選條件膠囊 */
const activeChips = computed(() => [
  ...filters.value.categories.map((c) => ({ key: `c-${c}`, label: CATEGORY_LABEL[c], remove: () => (filters.value = { ...filters.value, categories: filters.value.categories.filter((v) => v !== c) }) })),
  ...filters.value.distance.map((d) => ({ key: `d-${d}`, label: DISTANCE_LABEL[d], remove: () => (filters.value = { ...filters.value, distance: filters.value.distance.filter((v) => v !== d) }) })),
  ...(filters.value.county ? [{ key: 'county', label: filters.value.county, remove: () => (filters.value = { ...filters.value, county: '' }) }] : []),
])
const activeCount = computed(
  () => activeChips.value.length + (filters.value.dateFrom ? 1 : 0) + (filters.value.dateTo ? 1 : 0),
)

const emptyMessage = computed(() => {
  const where = filters.value.county ? `在${filters.value.county}舉辦的` : ''
  const what = filters.value.distance.length === 1 ? `${DISTANCE_LABEL[filters.value.distance[0]]}賽事` : '賽事'
  return `目前沒有${where}${what}。試著放寬地區、距離或日期條件，或清除篩選看看所有活動。`
})
</script>

<template>
  <div class="mx-auto max-w-[1440px] px-5 pt-6 pb-10 lg:px-20 lg:pt-14 lg:pb-[72px]">
    <!-- 標題與搜尋 -->
    <div class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p class="text-[13px] font-semibold text-accent">活動探索</p>
        <h1 class="mt-3 font-heading text-[28px] font-bold text-ink lg:mt-4 lg:text-[44px]">找一場想跑的賽事</h1>
      </div>
      <div class="flex items-center gap-3">
        <form class="flex h-12 flex-1 items-center gap-3 rounded-full border border-line bg-surface pr-1.5 pl-5 lg:h-14 lg:w-[520px] lg:flex-none" @submit.prevent="search">
          <Search class="size-[18px] shrink-0 text-ink-2" />
          <input v-model="keywordInput" class="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-text-lo" placeholder="搜尋活動名稱、城市…" />
          <button type="submit" class="btn btn-primary hidden h-10 px-5 lg:inline-flex">搜尋</button>
        </form>
        <button type="button" class="relative flex size-12 shrink-0 items-center justify-center rounded-full bg-ink text-white lg:hidden" aria-label="篩選" @click="sheetOpen = true">
          <SlidersHorizontal class="size-5" />
          <span v-if="activeCount" class="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full border-2 border-bg bg-accent font-display text-[11px] font-semibold">{{ activeCount }}</span>
        </button>
      </div>
    </div>

    <!-- 手機版：已套用條件 -->
    <div v-if="activeChips.length" class="mt-5 flex flex-wrap gap-2 lg:hidden">
      <button v-for="chip in activeChips" :key="chip.key" type="button" class="flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1.5 text-[13px] font-semibold text-accent" @click="chip.remove">
        {{ chip.label }} <X class="size-3.5" />
      </button>
    </div>

    <div class="mt-6 flex gap-10 lg:mt-8">
      <!-- 桌機版篩選欄 -->
      <aside class="hidden w-[260px] shrink-0 lg:block">
        <div class="flex items-center justify-between border-b border-line pb-6">
          <h2 class="text-base font-bold text-ink">篩選</h2>
          <button type="button" class="text-[13px] text-accent hover:underline" @click="clearAll">清除全部</button>
        </div>
        <EventFilters
          v-model="filters"
          :category-counts="meta?.categoryCounts ?? null"
          :google-linked="store.googleLinked"
          :recommending="recommending"
          @recommend="recommend"
        />
      </aside>

      <!-- 結果 -->
      <section class="min-w-0 flex-1">
        <div class="flex items-center justify-between">
          <p class="text-sm text-text-lo">
            <span class="mr-1.5 font-display text-[22px] font-semibold text-ink">{{ total }}</span>場活動符合條件
          </p>
          <label class="relative flex h-9 items-center gap-2 rounded-full border-line pl-3 text-[13px] text-ink lg:h-10 lg:border lg:bg-surface lg:pr-9 lg:pl-4">
            <ArrowUpDown class="size-3.5 text-ink-2" />
            <select v-model="sort" class="appearance-none bg-transparent pr-1 outline-none" aria-label="排序">
              <option value="eventDate">排序：活動日期（近→遠）</option>
              <option value="-eventDate">排序：活動日期（遠→近）</option>
            </select>
            <ChevronDown class="pointer-events-none absolute right-3.5 hidden size-4 text-ink-2 lg:block" />
          </label>
        </div>

        <div v-if="loading && !list.length" class="mt-5 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <div v-for="i in 6" :key="i" class="h-[360px] animate-pulse rounded-[20px] bg-surface-2" />
        </div>

        <div v-else-if="list.length" class="mt-5 grid gap-5 transition-opacity md:grid-cols-2 lg:gap-6 xl:grid-cols-3" :class="{ 'opacity-60': loading }">
          <EventCard v-for="event in list" :key="event.id" :event="event" />
        </div>

        <div v-else class="card mt-5 flex flex-col items-center px-6 py-16 text-center lg:py-[160px]">
          <div class="flex size-14 items-center justify-center rounded-2xl bg-surface-2 text-ink-2">
            <SearchX class="size-6" />
          </div>
          <h2 class="mt-5 font-heading text-[22px] font-bold text-ink">找不到符合條件的活動</h2>
          <p class="mt-3 max-w-[420px] text-sm leading-relaxed text-text-lo">{{ emptyMessage }}</p>
          <button type="button" class="btn btn-primary mt-6 h-11 px-6" @click="clearAll">
            <RotateCcw class="size-4" /> 清除全部篩選
          </button>
        </div>

        <div v-if="meta && meta.totalPages > 1" class="mt-10 flex justify-center lg:mt-14">
          <Pagination v-model="page" :total-pages="meta.totalPages" />
        </div>
      </section>
    </div>

    <!-- 手機版篩選面板 -->
    <Teleport to="body">
      <Transition enter-active-class="transition duration-200" enter-from-class="opacity-0" leave-active-class="transition duration-150" leave-to-class="opacity-0">
        <div v-if="sheetOpen" class="fixed inset-0 z-50 flex items-end bg-[#2F2B28]/45 lg:hidden" @click.self="sheetOpen = false">
          <div class="max-h-[88vh] w-full overflow-y-auto rounded-t-[28px] bg-bg px-5 pt-3 pb-6">
            <div class="mx-auto h-1 w-10 rounded-full bg-line" />
            <div class="mt-4 mb-5 flex items-center justify-between">
              <h2 class="font-heading text-[22px] font-bold">篩選</h2>
              <div class="flex items-center gap-4">
                <button type="button" class="text-sm font-semibold text-accent" @click="clearAll">清除全部</button>
                <button type="button" aria-label="關閉" @click="sheetOpen = false"><X class="size-5" /></button>
              </div>
            </div>
            <EventFilters
              v-model="filters"
              compact
              :category-counts="meta?.categoryCounts ?? null"
              :google-linked="store.googleLinked"
              :recommending="recommending"
              @recommend="recommend"
            />
            <button type="button" class="btn btn-primary mt-2 h-[52px] w-full text-base" @click="sheetOpen = false">
              顯示 {{ total }} 場活動
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
