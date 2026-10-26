import dayjs from 'dayjs'

const WEEKDAY = ['日', '一', '二', '三', '四', '五', '六']

/** 2026.11.16 */
export const formatDate = (value: string | Date) => dayjs(value).format('YYYY.MM.DD')

/** 2026.11.16 (日) */
export const formatDateWithWeekday = (value: string | Date) =>
  `${formatDate(value)} (${WEEKDAY[dayjs(value).day()]})`

/** 2026 年 11 月 16 日（日） */
export const formatDateLong = (value: string | Date) => {
  const d = dayjs(value)
  return `${d.year()} 年 ${d.month() + 1} 月 ${d.date()} 日（${WEEKDAY[d.day()]}）`
}

/** 10/31 */
export const formatMonthDay = (value: string | Date) => dayjs(value).format('MM/DD')

/** 10/09 03:02 */
export const formatShortDateTime = (value: string | Date) => dayjs(value).format('MM/DD HH:mm')

/** 2026-10-12 06:45 */
export const formatDateTime = (value: string | Date) => dayjs(value).format('YYYY-MM-DD HH:mm')

/** 2026.10.09 03:02 */
export const formatDotDateTime = (value: string | Date) => dayjs(value).format('YYYY.MM.DD HH:mm')

/** 375 秒 → 6'15"/km */
export const formatPace = (secPerKm: number | null) => {
  if (secPerKm == null) return '—'
  const min = Math.floor(secPerKm / 60)
  const sec = String(secPerKm % 60).padStart(2, '0')
  return `${min}'${sec}"/km`
}
