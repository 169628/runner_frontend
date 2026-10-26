<script setup lang="ts">
import { computed, ref } from 'vue'
import { Minus, Plus } from 'lucide-vue-next'
import type { RunRoute } from '@/types'

/**
 * 地圖區塊。目前以靜態底圖 + SVG 疊出路線（設計稿樣式），
 * 之後接上 Leaflet / Google Maps 時只需替換這個元件內部。
 */
const props = withDefaults(
  defineProps<{
    route?: RunRoute | null
    /** 淡化底圖（蒐集中 / 尚未設定出發地點） */
    dimmed?: boolean
    /** 起終點旁顯示地點名稱 */
    showLabels?: boolean
  }>(),
  { route: null, dimmed: false, showLabels: false },
)

const zoom = ref(1)

/** 經緯度 → 地圖上的百分比座標（x 10–90%、y 30–68%） */
const points = computed(() => {
  const path = props.route?.path ?? []
  if (path.length < 2) return []
  const lats = path.map((p) => p[0])
  const lngs = path.map((p) => p[1])
  const [minLat, maxLat, minLng, maxLng] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)]
  const nx = (lng: number) => 10 + ((lng - minLng) / (maxLng - minLng || 1)) * 80
  const ny = (lat: number) => 68 - ((lat - minLat) / (maxLat - minLat || 1)) * 38
  return path.map(([lat, lng]) => ({ x: nx(lng), y: ny(lat) }))
})

const polyline = computed(() => points.value.map((p) => `${p.x},${p.y}`).join(' '))
const start = computed(() => points.value[0])
const end = computed(() => points.value[points.value.length - 1])
</script>

<template>
  <div class="relative overflow-hidden rounded-[28px] border border-line bg-[#EFEAE0]">
    <div class="absolute inset-0 transition-transform duration-300" :style="{ transform: `scale(${zoom})` }">
      <img src="/images/map.jpg" alt="" class="size-full object-cover transition-opacity" :class="dimmed ? 'opacity-35' : ''" />

      <template v-if="route && points.length && !dimmed">
        <svg class="absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline
            :points="polyline"
            fill="none"
            stroke="#4A6F5C"
            stroke-width="6"
            stroke-linecap="round"
            stroke-linejoin="round"
            vector-effect="non-scaling-stroke"
          />
        </svg>
        <div class="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-2" :style="{ left: `${start.x}%`, top: `${start.y}%` }">
          <span class="flex size-9 items-center justify-center rounded-full border-[3px] border-white bg-accent text-[13px] font-bold text-white shadow-md">起</span>
        </div>
        <span
          v-if="showLabels"
          class="absolute translate-x-7 -translate-y-1/2 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-ink shadow-sm"
          :style="{ left: `${start.x}%`, top: `${start.y}%` }"
        >
          {{ route.start.name }}
        </span>
        <template v-if="!route.loop">
          <div class="absolute -translate-x-1/2 -translate-y-1/2" :style="{ left: `${end.x}%`, top: `${end.y}%` }">
            <span class="flex size-9 items-center justify-center rounded-full border-[3px] border-white bg-ink text-[13px] font-bold text-white shadow-md">終</span>
          </div>
          <span
            v-if="showLabels"
            class="absolute translate-x-7 -translate-y-1/2 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-ink shadow-sm"
            :style="{ left: `${end.x}%`, top: `${end.y}%` }"
          >
            {{ route.end.name }}
          </span>
        </template>
      </template>
    </div>

    <!-- 疊在地圖上的資訊（摘要卡、狀態提示、圖例） -->
    <slot />

    <div class="absolute top-6 right-6 flex flex-col overflow-hidden rounded-xl bg-white shadow-sm" :class="{ 'opacity-50': dimmed }">
      <button type="button" class="flex size-10 items-center justify-center text-ink hover:bg-paper" aria-label="放大" @click="zoom = Math.min(zoom + 0.25, 2)">
        <Plus class="size-4" />
      </button>
      <button type="button" class="flex size-10 items-center justify-center text-ink hover:bg-paper" aria-label="縮小" @click="zoom = Math.max(zoom - 0.25, 1)">
        <Minus class="size-4" />
      </button>
    </div>
    <p class="absolute right-5 bottom-3 text-xs text-ink-2/80">Map data © 第三方地圖服務</p>
  </div>
</template>
