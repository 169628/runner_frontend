// 健康分析：過去 N 週跑量長條圖
import type { HealthAnalysis } from '@/types'

type Week = HealthAnalysis['weeklyMileage']['weeks'][number]

const COLORS = {
  NORMAL: '#A9C4B6',
  DELOAD: '#B9842F',
  CURRENT: '#4A6F5C',
  ink: '#2F2B28',
  inkSoft: '#6F6760',
  warnInk: '#7A5418',
  line: '#E8DFD4',
}

const TYPE_LABEL = { NORMAL: '常規週', DELOAD: '減量週', CURRENT: '常規週' }

export function weeklyMileageBarOption(weeks: Week[]) {
  const dense = weeks.length > 12

  return {
    animationDuration: 600,
    grid: { left: 0, right: 0, top: dense ? 16 : 32, bottom: dense ? 28 : 56 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(232,223,212,0.35)' } },
      formatter: (params: { dataIndex: number }[]) => {
        const w = weeks[params[0].dataIndex]
        return `第 ${w.week} 週・${w.type === 'DELOAD' ? '減量週' : w.type === 'CURRENT' ? '本週' : '常規週'}<br/><b>${w.km} km</b>`
      },
    },
    xAxis: {
      type: 'category',
      data: weeks.map((w) => w.week),
      axisTick: { show: false },
      axisLine: { lineStyle: { color: COLORS.line } },
      axisLabel: {
        interval: dense ? 'auto' : 0,
        margin: 14,
        lineHeight: 24,
        formatter: (_: string, i: number) => {
          const w = weeks[i]
          if (dense) return `{week|${w.week}}`
          return `{week|第 ${w.week} 週}\n{${w.type === 'DELOAD' ? 'deload' : 'type'}|${TYPE_LABEL[w.type]}}`
        },
        rich: {
          week: { fontSize: 12, color: COLORS.ink, fontFamily: 'Noto Sans TC' },
          type: { fontSize: 12, color: COLORS.inkSoft, fontFamily: 'Noto Sans TC' },
          deload: { fontSize: 12, color: COLORS.DELOAD, fontWeight: 600, fontFamily: 'Noto Sans TC' },
        },
      },
    },
    yAxis: { type: 'value', show: false },
    series: [
      {
        type: 'bar',
        barCategoryGap: dense ? '30%' : '14%',
        data: weeks.map((w) => ({
          value: w.km,
          itemStyle: { color: COLORS[w.type], borderRadius: dense ? [3, 3, 0, 0] : [6, 6, 0, 0] },
          label: { color: w.type === 'DELOAD' ? COLORS.warnInk : COLORS.ink },
        })),
        label: {
          show: !dense,
          position: 'top',
          distance: 8,
          formatter: '{c} km',
          fontFamily: 'Outfit',
          fontSize: 13,
          fontWeight: 500,
        },
      },
    ],
  }
}
