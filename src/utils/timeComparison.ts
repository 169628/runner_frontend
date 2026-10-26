import dayjs from 'dayjs'
import type { RegistrationBadge } from '@/types'

/** 距離報名截止還有幾天（當天截止回 0，已過期回負數） */
export function daysUntil(date: string, now: Date | number = Date.now()): number {
  return dayjs(date).startOf('day').diff(dayjs(now).startOf('day'), 'day')
}

/** 截止前 7 天內為「即將截止」 */
export function registrationBadge(registrationEnd: string, now: Date | number = Date.now()): RegistrationBadge {
  return daysUntil(registrationEnd, now) <= 7 ? 'CLOSING_SOON' : 'OPEN'
}

/** date 是否落在 [from, to] 區間內（含頭尾，未給的邊界視為不限） */
export function isWithinRange(date: string, from?: string, to?: string): boolean {
  const d = dayjs(date)
  if (from && d.isBefore(dayjs(from), 'day')) return false
  if (to && d.isAfter(dayjs(to), 'day')) return false
  return true
}
