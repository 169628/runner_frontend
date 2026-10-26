<script setup lang="ts">
import { computed } from 'vue'
import { Activity, ArrowRight, Calendar, Check, Lock, MapPin } from 'lucide-vue-next'
import GoogleIcon from './GoogleIcon.vue'
import SelectBox from './SelectBox.vue'
import { CATEGORY_LABEL, COUNTIES, DISTANCE_LABEL } from '@/config/constants'
import type { DistanceBucket, EventCategory } from '@/types'

export interface EventFilterState {
  categories: EventCategory[]
  county: string
  distance: DistanceBucket[]
  dateFrom: string
  dateTo: string
}

const props = defineProps<{
  categoryCounts: Record<EventCategory, number> | null
  googleLinked: boolean
  recommending?: boolean
  /** 手機版篩選面板：分類改用膠囊按鈕 */
  compact?: boolean
}>()
const emit = defineEmits<{ recommend: [] }>()
const filters = defineModel<EventFilterState>({ required: true })

const categories = Object.entries(CATEGORY_LABEL) as [EventCategory, string][]
const distances = Object.entries(DISTANCE_LABEL) as [DistanceBucket, string][]
const countyOptions = computed(() => COUNTIES.map((c) => ({ value: c, label: c })))

const toggle = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value])
const toggleCategory = (c: EventCategory) => (filters.value = { ...filters.value, categories: toggle(filters.value.categories, c) })
const toggleDistance = (d: DistanceBucket) => (filters.value = { ...filters.value, distance: toggle(filters.value.distance, d) })
const set = <K extends keyof EventFilterState>(key: K, value: EventFilterState[K]) =>
  (filters.value = { ...filters.value, [key]: value })

const count = (c: EventCategory) => props.categoryCounts?.[c] ?? 0
</script>

<template>
  <div class="flex flex-col">
    <section class="py-6" :class="compact ? 'pt-0' : 'border-b border-line'">
      <h3 class="mb-3 text-[13px] font-bold text-ink">活動分類</h3>
      <div v-if="compact" class="flex flex-wrap gap-2">
        <button
          v-for="[value, label] in categories"
          :key="value"
          type="button"
          class="rounded-full border px-3.5 py-2 text-sm"
          :class="filters.categories.includes(value) ? 'border-accent/50 bg-accent-soft font-semibold text-accent' : 'border-line bg-surface text-ink'"
          @click="toggleCategory(value)"
        >
          {{ label }} {{ count(value) }}
        </button>
      </div>
      <ul v-else class="flex flex-col gap-3">
        <li v-for="[value, label] in categories" :key="value">
          <label class="flex cursor-pointer items-center gap-2.5 text-sm text-ink">
            <input type="checkbox" class="peer sr-only" :checked="filters.categories.includes(value)" @change="toggleCategory(value)" />
            <span
              class="flex size-[18px] items-center justify-center rounded-[5px] border peer-focus-visible:ring-2 peer-focus-visible:ring-accent/40"
              :class="filters.categories.includes(value) ? 'border-accent bg-accent text-white' : 'border-line bg-surface'"
            >
              <Check v-if="filters.categories.includes(value)" class="size-3" :stroke-width="3" />
            </span>
            <span class="flex-1">{{ label }}</span>
            <span class="font-display text-xs text-text-lo">{{ count(value) }}</span>
          </label>
        </li>
      </ul>
    </section>

    <section class="py-6" :class="compact ? 'pt-0' : 'border-b border-line'">
      <h3 class="mb-3 text-[13px] font-bold text-ink">地區</h3>
      <SelectBox
        :model-value="filters.county"
        :options="countyOptions"
        placeholder="全部縣市"
        :icon="MapPin"
        @update:model-value="set('county', $event)"
      />
    </section>

    <section class="py-6" :class="compact ? 'pt-0' : 'border-b border-line'">
      <h3 class="mb-3 text-[13px] font-bold text-ink">距離</h3>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="[value, label] in distances"
          :key="value"
          type="button"
          class="rounded-full border px-3.5 py-2 text-[13px]"
          :class="filters.distance.includes(value) ? 'border-accent/50 bg-accent-soft font-bold text-accent' : 'border-line bg-surface text-ink-2'"
          @click="toggleDistance(value)"
        >
          {{ label }}
        </button>
      </div>
    </section>

    <section class="py-6" :class="compact ? 'pt-0' : 'border-b border-line'">
      <h3 class="mb-3 text-[13px] font-bold text-ink">活動日期</h3>
      <div class="flex gap-2" :class="compact ? 'flex-row items-center' : 'flex-col'">
        <label class="input-box">
          <Calendar class="size-4 shrink-0 text-ink-2" />
          <input type="date" :value="filters.dateFrom" :max="filters.dateTo || undefined" @input="set('dateFrom', ($event.target as HTMLInputElement).value)" />
        </label>
        <span v-if="compact" class="text-text-lo">–</span>
        <label class="input-box">
          <Calendar class="size-4 shrink-0 text-ink-2" />
          <input type="date" :value="filters.dateTo" :min="filters.dateFrom || undefined" @input="set('dateTo', ($event.target as HTMLInputElement).value)" />
        </label>
      </div>
    </section>

    <section class="py-6" :class="{ 'pt-0': compact }">
      <h3 class="mb-3 text-[13px] font-bold text-ink">依訓練能力</h3>
      <template v-if="googleLinked">
        <button type="button" class="btn btn-dark h-12 w-full rounded-xl" :disabled="recommending" @click="emit('recommend')">
          <Activity class="size-[18px]" />
          {{ recommending ? '分析訓練紀錄中…' : '依訓練能力找賽事' }}
        </button>
        <p class="mt-3 flex items-center gap-1.5 text-xs text-text-lo">
          <GoogleIcon class="size-3.5" />依 Google 帳號近期訓練紀錄推薦
        </p>
      </template>
      <template v-else>
        <button type="button" class="btn h-12 w-full cursor-not-allowed rounded-xl bg-surface-2 text-ink-2" disabled>
          <Lock class="size-[18px]" /> 依訓練能力找賽事
        </button>
        <div class="mt-3 rounded-xl bg-warn-soft p-3.5 text-xs leading-relaxed text-warn-ink">
          <p>尚未綁定 Google 帳號，暫時無法取得你的訓練數據。</p>
          <RouterLink to="/profile" class="mt-2 inline-flex items-center gap-1 font-bold text-accent hover:underline">
            前往個人基本資料綁定 <ArrowRight class="size-3.5" />
          </RouterLink>
        </div>
      </template>
    </section>
  </div>
</template>
