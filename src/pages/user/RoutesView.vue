<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, ChevronDown, CircleAlert, LoaderCircle, LocateFixed, LocateOff, MapPin, MapPinned, RotateCcw, RouteOff, Search } from 'lucide-vue-next'
import MapCanvas from '@/components/MapCanvas.vue'
import RouteCard from '@/components/RouteCard.vue'
import { ApiError, getRouteRecommendations } from '@/api'
import { COUNTY_DISTRICTS } from '@/config/constants'
import { useRouteSearchStore } from '@/stores/routeSearch'
import { swalHandler } from '@/utils/swalHandler'
import type { RouteQuery } from '@/types'

const router = useRouter()
const searchStore = useRouteSearchStore()

const GEO = '__geo__'
const origin = ref(searchStore.result ? `${searchStore.result.origin.county}|${searchStore.result.origin.district}` : '')
const coords = ref<{ lat: number; lng: number } | null>(null)
const locating = ref(false)
const geoDenied = ref(false)
const loading = ref(false)
const activeId = ref(searchStore.result?.routes[0]?.id ?? '')

const result = computed(() => searchStore.result)
const activeRoute = computed(() => result.value?.routes.find((r) => r.id === activeId.value) ?? result.value?.routes[0] ?? null)
const originLabel = computed(() => {
  if (origin.value === GEO) return '目前位置'
  const [county, district] = origin.value.split('|')
  return county ? `${county}${district}` : ''
})
const resultLabel = computed(() => (result.value ? `${result.value.origin.county}${result.value.origin.district}` : ''))

function useCurrentLocation() {
  if (!navigator.geolocation) {
    geoDenied.value = true
    return
  }
  locating.value = true
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      coords.value = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      origin.value = GEO
      geoDenied.value = false
      locating.value = false
    },
    () => {
      geoDenied.value = true
      if (origin.value === GEO) origin.value = ''
      locating.value = false
    },
    { timeout: 10_000 },
  )
}

async function search() {
  if (!origin.value) return
  const [county, district] = origin.value.split('|')
  const query: RouteQuery = origin.value === GEO ? { ...coords.value! } : { county, district }
  loading.value = true
  searchStore.result = null
  try {
    searchStore.result = await getRouteRecommendations(query)
    activeId.value = searchStore.result.routes[0]?.id ?? ''
  } catch (err) {
    swalHandler.error(err instanceof ApiError ? err.message : '路線蒐集失敗，請稍後再試')
  } finally {
    loading.value = false
  }
}

const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches
function onCardClick(id: string) {
  if (isDesktop()) activeId.value = id
  else router.push({ name: 'route-detail', params: { routeId: id } })
}
</script>

<template>
  <div class="mx-auto flex max-w-[1440px] flex-col gap-6 px-5 pt-6 pb-10 lg:flex-row lg:gap-8 lg:px-20 lg:pt-10 lg:pb-[72px]">
    <!-- 左欄 -->
    <section class="contents lg:flex lg:w-[560px] lg:shrink-0 lg:flex-col">
      <div class="order-1">
        <p class="text-[13px] font-semibold text-accent">路線推薦</p>
        <h1 class="mt-3 font-heading text-[28px] font-bold text-ink lg:mt-4 lg:text-[44px]">今天想去哪裡跑？</h1>

        <div class="card mt-6 rounded-3xl p-5 lg:mt-8 lg:p-6">
          <label class="field-label">出發地點</label>
          <div class="flex gap-2.5">
            <label class="input-box relative h-12 flex-1 bg-paper/60">
              <MapPin class="size-[18px] shrink-0 text-ink-2" />
              <select v-model="origin" class="appearance-none pr-6" :class="{ 'text-text-lo': !origin }" @change="geoDenied = false">
                <option value="" disabled>選擇縣市與行政區</option>
                <option v-if="coords" :value="GEO">目前位置</option>
                <optgroup v-for="(districts, county) in COUNTY_DISTRICTS" :key="county" :label="county">
                  <option v-for="d in districts" :key="d" :value="`${county}|${d}`">{{ county }} · {{ d }}</option>
                </optgroup>
              </select>
              <ChevronDown class="pointer-events-none absolute right-4 size-4 text-ink-2" />
            </label>
            <button
              type="button"
              class="flex h-12 shrink-0 items-center gap-2 rounded-xl border px-3.5 text-sm"
              :class="geoDenied ? 'border-danger bg-heart-soft text-danger' : 'border-line bg-surface text-ink hover:bg-paper'"
              :disabled="locating"
              @click="useCurrentLocation"
            >
              <LoaderCircle v-if="locating" class="size-[18px] animate-spin" />
              <LocateOff v-else-if="geoDenied" class="size-[18px]" />
              <LocateFixed v-else class="size-[18px]" />
              <span class="hidden sm:inline">目前位置</span>
            </button>
          </div>
          <p v-if="geoDenied" class="field-error"><CircleAlert class="size-3.5 shrink-0" />無法取得目前位置，請在瀏覽器設定中允許定位，或手動選擇出發地點。</p>

          <button type="button" class="btn btn-primary mt-5 h-[50px] w-full text-base" :disabled="!origin || loading" @click="search">
            <LoaderCircle v-if="loading" class="size-[18px] animate-spin" />
            <Search v-else class="size-[18px]" />
            {{ loading ? '正在蒐集路線…' : '搜尋附近路線' }}
          </button>
          <p class="mt-4 hidden text-xs text-text-lo lg:block">選好出發地點後，系統會即時從網路蒐集附近 3–4 條跑步路線，約需數秒。</p>
        </div>
      </div>

      <!-- 結果 / 狀態 -->
      <div class="order-3 lg:mt-7">
        <template v-if="loading">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-bold text-ink">正在蒐集附近路線…</h2>
            <span class="text-xs text-text-lo">約需數秒</span>
          </div>
          <div class="mt-4 flex flex-col gap-3">
            <div v-for="i in 3" :key="i" class="flex items-center gap-4 rounded-[20px] border border-line bg-surface p-3.5" :style="{ opacity: 1 - (i - 1) * 0.3 }">
              <div class="size-[92px] animate-pulse rounded-xl bg-surface-2" />
              <div class="flex flex-1 flex-col gap-2.5">
                <div class="h-3 w-3/5 animate-pulse rounded-full bg-surface-2" />
                <div class="h-3 w-4/5 animate-pulse rounded-full bg-surface-2" />
                <div class="h-3 w-2/5 animate-pulse rounded-full bg-surface-2" />
              </div>
              <div class="h-7 w-16 animate-pulse rounded-lg bg-surface-2" />
            </div>
          </div>
        </template>

        <template v-else-if="result && result.routes.length">
          <div class="flex flex-col gap-1 lg:flex-row lg:items-center lg:justify-between">
            <h2 class="text-base font-bold text-ink">為你找到 {{ result.routes.length }} 條路線</h2>
            <span class="text-xs text-text-lo">即時蒐集 · {{ resultLabel }}附近</span>
          </div>
          <div class="mt-4 flex flex-col gap-3">
            <button v-for="r in result.routes" :key="r.id" type="button" class="text-left" @click="onCardClick(r.id)">
              <RouteCard :route="r" :active="r.id === activeRoute?.id" />
            </button>
          </div>
        </template>

        <div v-else-if="result" class="card flex flex-col items-center rounded-3xl px-8 py-8 text-center">
          <div class="flex size-12 items-center justify-center rounded-xl bg-surface-2 text-ink-2"><RouteOff class="size-[22px]" /></div>
          <h2 class="mt-4 text-[17px] font-bold text-ink">附近暫時找不到合適的路線</h2>
          <p class="mt-2.5 text-sm leading-relaxed text-text-lo">這次沒有在{{ resultLabel }}附近蒐集到跑步路線，可以換個出發地點，或稍後再試一次。</p>
          <button type="button" class="btn btn-outline mt-5 h-10 px-5" @click="search"><RotateCcw class="size-4" />重新搜尋</button>
        </div>

        <div v-else class="card flex flex-col items-center rounded-3xl px-8 py-8 text-center">
          <div class="flex size-12 items-center justify-center rounded-xl bg-accent-soft text-accent"><MapPinned class="size-[22px]" /></div>
          <h2 class="mt-4 text-[17px] font-bold text-ink">{{ origin ? '準備好就開始搜尋' : '先選擇出發地點' }}</h2>
          <p class="mt-2.5 text-sm text-text-lo">
            {{ origin ? `按下「搜尋附近路線」，蒐集${originLabel}附近的跑步路線。` : '選好縣市與行政區後，就能搜尋附近的跑步路線。' }}
          </p>
        </div>
      </div>
    </section>

    <!-- 地圖 -->
    <MapCanvas
      class="order-2 h-[288px] lg:sticky lg:top-[116px] lg:h-[930px] lg:flex-1"
      :route="loading ? null : activeRoute"
      :dimmed="loading || !result?.routes.length"
    >
      <div
        v-if="activeRoute && !loading"
        class="absolute top-6 left-6 hidden w-[340px] rounded-[20px] bg-white p-5 shadow-[0_8px_24px_-12px_rgba(47,43,40,0.25)] lg:block"
      >
        <h3 class="font-heading text-lg font-bold text-ink">{{ activeRoute.name }}</h3>
        <dl class="mt-3 flex gap-5">
          <div><dt class="text-xs text-text-lo">距離</dt><dd class="mt-1 text-sm font-bold">{{ activeRoute.distanceKm }} km</dd></div>
          <div><dt class="text-xs text-text-lo">地區</dt><dd class="mt-1 text-sm font-bold">{{ activeRoute.district }}</dd></div>
        </dl>
        <RouterLink :to="{ name: 'route-detail', params: { routeId: activeRoute.id } }" class="mt-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-accent hover:underline">
          查看路線詳情 <ArrowRight class="size-3.5" />
        </RouterLink>
      </div>

      <div v-if="activeRoute && !loading" class="absolute bottom-10 left-6 hidden items-center gap-4 rounded-full bg-white px-4 py-2 text-xs font-semibold lg:flex">
        <span class="flex items-center gap-1.5"><span class="size-2.5 rounded-full bg-accent" />起點</span>
        <span class="flex items-center gap-1.5"><span class="size-2.5 rounded-full bg-ink" />終點</span>
      </div>

      <div v-if="loading || (!result && !activeRoute)" class="absolute inset-0 hidden items-center justify-center lg:flex">
        <span class="flex items-center gap-2.5 rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink shadow-[0_8px_24px_-12px_rgba(47,43,40,0.3)]">
          <template v-if="loading"><LoaderCircle class="size-4 animate-spin text-accent" />正在搜尋{{ originLabel }}附近的跑步路線</template>
          <template v-else><LocateOff class="size-4" />{{ origin ? '尚未搜尋路線' : '尚未設定出發地點' }}</template>
        </span>
      </div>
    </MapCanvas>
  </div>
</template>
