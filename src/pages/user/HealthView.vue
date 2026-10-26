<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Activity, ArrowRight, Flame, Footprints, Info, Link, Lock, MapPin, Medal, Timer, TrendingUp, Trophy } from 'lucide-vue-next'
import BaseChart from '@/components/BaseChart.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { ApiError, getHealthAnalysis } from '@/api'
import { weeklyMileageBarOption } from '@/chart/weeklyMileageBar'
import { useUserStore } from '@/stores/user'
import { formatDateTime, formatPace, formatShortDateTime } from '@/utils/formatDateTime'
import type { HealthAnalysis, HealthRange } from '@/types'

const store = useUserStore()

const RANGES: { value: HealthRange; label: string }[] = [
  { value: '4W', label: '4 週' },
  { value: '8W', label: '8 週' },
  { value: '12W', label: '12 週' },
  { value: '6M', label: '6 個月' },
  { value: '1Y', label: '1 年' },
]

const range = ref<HealthRange>('8W')
const data = ref<HealthAnalysis | null>(null)
const notLinked = ref(!store.googleLinked)
const loading = ref(false)

watch(
  range,
  async (value) => {
    if (!store.googleLinked) return
    loading.value = true
    try {
      data.value = await getHealthAnalysis(value)
    } catch (err) {
      if (err instanceof ApiError && err.code.startsWith('GOOGLE_')) notLinked.value = true
    } finally {
      loading.value = false
    }
  },
  { immediate: true },
)

const rangeLabel = computed(() => RANGES.find((r) => r.value === range.value)!.label)
const chartOption = computed(() => (data.value ? weeklyMileageBarOption(data.value.weeklyMileage.weeks) : {}))

const kpis = computed(() => {
  const t = data.value?.today
  if (!t) return []
  return [
    { label: '今日累積步數', value: t.steps.toLocaleString(), unit: '步', note: '手機或穿戴裝置計步', icon: Footprints },
    { label: '移動總距離', value: t.distanceKm.toFixed(2), unit: 'km', note: '手機 GPS 或穿戴裝置步長累計', icon: MapPin },
    { label: '活動消耗熱量', value: String(t.caloriesKcal), unit: 'kcal', note: '依體重、步頻與活動強度估算', icon: Flame },
    { label: '活躍時間', value: String(t.activeMinutes), unit: '分鐘', note: '快走、慢跑等高 / 中強度活動', icon: Timer },
  ]
})

const ACHIEVEMENT_STYLE: Record<string, { icon: typeof Trophy; box: string }> = {
  MAX_DAILY_STEPS: { icon: Trophy, box: 'bg-warn-soft text-warn' },
  STREAK_DAYS: { icon: Flame, box: 'bg-heart-soft text-heart' },
  TOTAL_DISTANCE: { icon: Medal, box: 'bg-accent-soft text-accent' },
}

const unboundFeatures = [
  { icon: TrendingUp, box: 'bg-accent-soft text-accent', title: '過去 8 週跑量趨勢', desc: '看出每週跑量變化與減量恢復週' },
  { icon: Footprints, box: 'bg-heart-soft text-heart', title: '今日活動與行動建議', desc: '步數、距離、熱量，以及今天建議跑多少' },
  { icon: Trophy, box: 'bg-warn-soft text-warn', title: '個人成就與訓練紀錄', desc: '里程碑、配速、心率與自覺體感' },
]
</script>

<template>
  <div class="mx-auto max-w-[1440px] px-5 pt-6 pb-14 lg:px-20 lg:pt-14 lg:pb-20">
    <!-- 未綁定 Google -->
    <template v-if="notLinked">
      <p class="text-[13px] font-semibold text-accent">健康分析</p>
      <h1 class="mt-3 font-heading text-[28px] font-bold text-ink lg:mt-4 lg:text-[44px]">綁定 Google，看見你的跑步成長</h1>
      <section class="card mt-8 flex flex-col gap-10 rounded-[28px] p-7 lg:flex-row lg:items-center lg:gap-16 lg:p-14">
        <div class="flex-1">
          <div class="flex size-14 items-center justify-center rounded-2xl bg-accent-soft text-accent"><Link class="size-6" /></div>
          <h2 class="mt-6 font-heading text-[26px] font-bold text-ink lg:text-[30px]">尚未綁定 Google 帳號</h2>
          <p class="mt-5 text-[15px] leading-[1.75] text-ink-2">
            健康分析需要讀取你 Google 帳號中的步數、距離與訓練紀錄。請先到個人基本資料頁完成綁定，綁定後會自動同步並產生分析。
          </p>
          <RouterLink to="/profile" class="btn btn-primary mt-8 h-[50px] px-6 text-[15px]">前往個人基本資料綁定 <ArrowRight class="size-4" /></RouterLink>
        </div>
        <div class="lg:w-[460px]">
          <p class="text-[13px] font-semibold text-ink-2">綁定後你可以看到</p>
          <ul class="mt-3 flex flex-col gap-3">
            <li v-for="f in unboundFeatures" :key="f.title" class="flex items-center gap-4 rounded-2xl bg-paper/70 p-4">
              <span class="flex size-10 shrink-0 items-center justify-center rounded-xl" :class="f.box"><component :is="f.icon" class="size-[18px]" /></span>
              <div>
                <p class="text-[15px] font-bold text-ink">{{ f.title }}</p>
                <p class="mt-0.5 text-[13px] text-text-lo">{{ f.desc }}</p>
              </div>
            </li>
          </ul>
        </div>
      </section>
    </template>

    <div v-else-if="!data" class="flex flex-col gap-6">
      <div class="h-24 w-2/3 animate-pulse rounded-2xl bg-surface-2" />
      <div class="h-[140px] animate-pulse rounded-[28px] bg-surface-2" />
      <div class="h-[160px] animate-pulse rounded-[20px] bg-surface-2" />
    </div>

    <template v-else>
      <!-- 標題列 -->
      <div class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p class="text-[13px] font-semibold text-accent">健康分析</p>
          <h1 class="mt-3 font-heading text-[28px] font-bold text-ink lg:mt-4 lg:text-[44px]">{{ data.headline }}</h1>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <span class="flex h-11 items-center gap-2.5 rounded-full border border-line bg-surface pr-4 pl-1.5 text-[13px] text-ink">
            <span class="flex size-8 items-center justify-center rounded-full bg-accent-soft text-accent"><Activity class="size-3.5" /></span>
            資料來源：Google 帳號
          </span>
          <div class="flex rounded-full bg-surface-2 p-1">
            <button
              v-for="r in RANGES"
              :key="r.value"
              type="button"
              class="h-9 rounded-full px-3 font-display text-[13px] lg:px-4"
              :class="range === r.value ? 'bg-surface font-semibold text-ink shadow-sm' : 'text-ink-2 hover:text-ink'"
              @click="range = r.value"
            >
              {{ r.label }}
            </button>
          </div>
        </div>
      </div>

      <div class="transition-opacity" :class="{ 'opacity-60': loading }">
        <!-- 摘要 -->
        <section class="mt-8 grid gap-6 rounded-[28px] bg-ink px-7 py-7 text-white lg:grid-cols-[1fr_1.15fr_1.4fr] lg:gap-0 lg:px-9">
          <div class="lg:pr-8">
            <p class="text-xs text-white/60">跑者類型</p>
            <p class="mt-2.5 text-2xl font-bold">{{ data.summary.runnerType }}</p>
          </div>
          <div class="lg:border-l lg:border-white/15 lg:px-8">
            <p class="text-xs text-white/60">今日行動建議</p>
            <p class="mt-2.5 text-2xl font-bold text-accent-muted">{{ data.summary.todaySuggestion }}</p>
          </div>
          <div class="lg:border-l lg:border-white/15 lg:pl-8">
            <p class="text-xs text-white/60">資料品質</p>
            <p class="mt-2.5 text-2xl font-bold">近 {{ data.summary.dataQuality.days }} 天 {{ data.summary.dataQuality.validTrainings }} 筆有效訓練</p>
            <p class="mt-2 text-xs text-white/60">{{ data.summary.dataQuality.note }}</p>
          </div>
        </section>

        <!-- 今日活動 -->
        <div class="mt-8 flex items-end justify-between">
          <h2 class="text-lg font-bold text-ink">今日活動</h2>
          <span class="text-xs text-text-lo">{{ formatShortDateTime(data.syncedAt) }} 同步</span>
        </div>
        <div class="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <div v-for="k in kpis" :key="k.label" class="card p-5 lg:p-6">
            <div class="flex items-center justify-between text-[13px] text-ink-2">{{ k.label }}<component :is="k.icon" class="size-[18px] text-ink-2" /></div>
            <p class="mt-5 flex items-baseline gap-1.5">
              <span class="font-display text-[30px] font-medium text-ink lg:text-[38px]">{{ k.value }}</span>
              <span class="text-[13px] text-text-lo">{{ k.unit }}</span>
            </p>
            <p class="mt-3 text-xs text-text-lo">{{ k.note }}</p>
          </div>
        </div>

        <!-- 跑量 + 成就 -->
        <div class="mt-6 grid gap-6 lg:grid-cols-[1fr_420px]">
          <section class="card flex flex-col rounded-3xl p-6 lg:p-7">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h2 class="text-base font-bold text-ink">過去 {{ rangeLabel }}跑量（所有跑步紀錄）</h2>
                <p class="mt-1 text-xs text-text-lo">跑量階梯式上升，搭配週期性減量恢復週</p>
              </div>
              <div class="text-right">
                <p class="text-xs text-text-lo">{{ rangeLabel }}總成長</p>
                <p class="mt-1 font-display text-2xl font-semibold text-accent">{{ data.weeklyMileage.growthPercent >= 0 ? '+' : '' }}{{ data.weeklyMileage.growthPercent }}%</p>
              </div>
            </div>
            <BaseChart class="mt-4 h-[300px] w-full" :option="chartOption" />
            <div class="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-5 text-xs text-ink-2">
              <span class="flex items-center gap-2"><span class="size-2.5 rounded-sm bg-[#A9C4B6]" />常規遞增週</span>
              <span class="flex items-center gap-2"><span class="size-2.5 rounded-sm bg-warn" />減量恢復週（Deload）</span>
              <span class="flex items-center gap-2"><span class="size-2.5 rounded-sm bg-accent" />本週（進行中）</span>
            </div>
          </section>

          <section class="card flex flex-col rounded-3xl p-6 lg:p-7">
            <div class="flex items-center justify-between">
              <h2 class="text-base font-bold text-ink">個人成就與里程碑</h2>
              <StatusBadge :dot="false">已解鎖 {{ data.achievements.unlocked }} / {{ data.achievements.total }}</StatusBadge>
            </div>
            <ul class="mt-5 flex flex-col gap-3">
              <li v-for="a in data.achievements.items" :key="a.key" class="flex items-center gap-4 rounded-2xl bg-paper/70 p-4">
                <span class="flex size-11 shrink-0 items-center justify-center rounded-xl" :class="ACHIEVEMENT_STYLE[a.key]?.box ?? 'bg-accent-soft text-accent'">
                  <component :is="ACHIEVEMENT_STYLE[a.key]?.icon ?? Trophy" class="size-5" />
                </span>
                <div>
                  <p class="text-[13px] text-ink-2">{{ a.title }}</p>
                  <p class="mt-1 text-base font-bold" :class="a.key === 'TOTAL_DISTANCE' ? 'text-accent' : 'text-ink'">{{ a.value }}</p>
                </div>
              </li>
            </ul>
            <p class="mt-auto flex items-center gap-1.5 pt-6 text-xs text-text-lo">
              <Lock class="size-3.5" />還有 {{ data.achievements.total - data.achievements.unlocked }} 項成就待解鎖
            </p>
          </section>
        </div>

        <!-- 訓練紀錄 -->
        <section class="card mt-6 rounded-3xl p-6 lg:p-7">
          <h2 class="text-base font-bold text-ink">訓練紀錄</h2>
          <p class="mt-1 text-xs text-text-lo">近 {{ data.summary.dataQuality.days }} 天 · {{ data.summary.dataQuality.validTrainings }} 筆有效訓練（未達步頻或強度的紀錄不列入）</p>
          <div class="mt-5 overflow-x-auto">
            <table class="w-full min-w-[880px] text-left text-sm">
              <thead class="text-xs text-text-lo">
                <tr class="border-b border-line">
                  <th class="py-3.5 font-medium">訓練名稱</th>
                  <th class="py-3.5 font-medium">日期時間</th>
                  <th class="py-3.5 font-medium">距離</th>
                  <th class="py-3.5 font-medium">時間</th>
                  <th class="py-3.5 font-medium">平均配速</th>
                  <th class="py-3.5 font-medium">平均心率</th>
                  <th class="py-3.5 font-medium">消耗熱量</th>
                  <th class="py-3.5 font-medium">品質</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="t in data.trainings" :key="t.startedAt" class="border-b border-line last:border-0">
                  <td class="py-5 font-bold text-ink">{{ t.name }}</td>
                  <td class="py-5 font-display text-ink-2">{{ formatDateTime(t.startedAt) }}</td>
                  <td class="py-5 font-display text-accent">{{ t.distanceKm }} km</td>
                  <td class="py-5 text-ink">{{ t.durationMin }} 分鐘</td>
                  <td class="py-5 font-display text-ink">{{ formatPace(t.paceSecPerKm) }}</td>
                  <td class="py-5 font-display text-heart-ink">{{ t.avgHeartRate ? `${t.avgHeartRate} bpm` : '—' }}</td>
                  <td class="py-5 font-display text-ink">{{ t.caloriesKcal }} kcal</td>
                  <td class="py-5"><StatusBadge>{{ t.quality === 'VALID' ? '有效訓練' : '已篩除' }}</StatusBadge></td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="mt-4 flex items-start gap-2 rounded-xl bg-paper/70 px-5 py-3.5 text-xs leading-relaxed text-text-lo">
            <Info class="mt-0.5 size-3.5 shrink-0" />
            距離與熱量取自 Google 帳號的活動資料；平均配速與心率需搭配智慧手錶或 GPS 軌跡。上方跑量圖表計入所有跑步距離，此表只列出通過步頻與強度篩選的有效訓練。
          </p>
        </section>
      </div>
    </template>
  </div>
</template>
