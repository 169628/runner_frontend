// 健康分析假資料（取自設計稿與 Google Health 原型）
import type { HealthAnalysis, HealthRange } from '@/types'
import { MOCK_NOW } from './db'

const WEEKS_BY_RANGE: Record<HealthRange, number> = { '4W': 4, '8W': 8, '12W': 12, '6M': 26, '1Y': 52 }
const RANGE_TEXT: Record<HealthRange, string> = { '4W': '4 週', '8W': '8 週', '12W': '12 週', '6M': '6 個月', '1Y': '1 年' }

/** 設計稿的 8 週跑量：第 4、7 週為減量週，第 8 週為本週 */
const BASE_8W = [22, 28, 32, 25, 36, 40, 30, 44]

function buildWeeks(count: number) {
  const kms: number[] = []
  if (count <= 8) {
    kms.push(...BASE_8W.slice(8 - count))
  } else {
    // 往前補資料：每 3～4 週一個減量週，跑量由 14 km 漸增
    const extra = count - 8
    for (let i = 0; i < extra; i++) {
      const base = 14 + Math.round((i / extra) * 10)
      kms.push(i % 4 === 3 ? base - 5 : base + (i % 4) * 2)
    }
    kms.push(...BASE_8W)
  }
  return kms.map((km, i) => {
    const isLast = i === kms.length - 1
    const prev = kms[i - 1] ?? km
    return { week: i + 1, km, type: isLast ? 'CURRENT' : km < prev ? 'DELOAD' : 'NORMAL' } as const
  })
}

export function buildHealthAnalysis(range: HealthRange): HealthAnalysis {
  const weeks = buildWeeks(WEEKS_BY_RANGE[range])
  const first = weeks[0].km
  const last = weeks[weeks.length - 1].km
  const growthPercent = Math.round(((last - first) / first) * 100)
  const totalKm = weeks.reduce((sum, w) => sum + w.km, 0)

  return {
    range,
    syncedAt: MOCK_NOW,
    headline:
      growthPercent >= 100
        ? `這 ${RANGE_TEXT[range]}，你的週跑量翻了一倍`
        : `這 ${RANGE_TEXT[range]}，你的週跑量成長了 ${growthPercent}%`,
    summary: {
      runnerType: '規律慢跑者',
      todaySuggestion: '輕鬆跑 6 km',
      dataQuality: { days: 10, validTrainings: 3, note: '已套用步頻與運動強度篩選' },
    },
    today: { steps: 8850, distanceKm: 6.2, caloriesKcal: 310, activeMinutes: 55 },
    weeklyMileage: { growthPercent, weeks },
    achievements: {
      unlocked: 3,
      total: 5,
      items: [
        { key: 'MAX_DAILY_STEPS', title: '單日最高步數', value: '14,200 步', unlocked: true },
        { key: 'STREAK_DAYS', title: '運動達標連續天數', value: '連續 6 天達標', unlocked: true },
        {
          key: 'TOTAL_DISTANCE',
          title: '累積距離換算',
          value: `${RANGE_TEXT[range]}累積 ${totalKm} km，相當於 ${Math.floor(totalKm / 42.195)} 場全馬！`,
          unlocked: true,
        },
      ],
    },
    trainings: [
      { name: '週三有氧節奏跑', startedAt: '2026-10-12T06:45:00+08:00', distanceKm: 7.2, durationMin: 45, paceSecPerKm: 375, avgHeartRate: 146, caloriesKcal: 420, quality: 'VALID' },
      { name: '傍晚河濱輕鬆跑', startedAt: '2026-10-10T18:20:00+08:00', distanceKm: 6.12, durationMin: 38, paceSecPerKm: 373, avgHeartRate: 124, caloriesKcal: 185, quality: 'VALID' },
      { name: '週末耐力有氧堆疊', startedAt: '2026-10-07T07:00:00+08:00', distanceKm: 9.36, durationMin: 52, paceSecPerKm: 333, avgHeartRate: 138, caloriesKcal: 340, quality: 'VALID' },
    ],
  }
}
