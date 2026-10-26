// 與後端 API 規格（pacer-實作計畫.md §8）對應的型別

export type Role = 'USER' | 'ADMIN'
export type AuthProvider = 'PASSWORD' | 'GOOGLE'
export type EventCategory = 'MARATHON' | 'ROAD_RUN' | 'TRAIL' | 'RELAY'
export type DistanceBucket = 'LE_5K' | 'K6_10' | 'K11_21' | 'K22_42' | 'ULTRA'
export type EventStatus = 'PENDING' | 'PUBLISHED' | 'REJECTED' | 'CLOSED'
export type EventSource = 'MANUAL' | 'MANUAL_CRAWL' | 'SCHEDULED_CRAWL'
export type RegistrationBadge = 'OPEN' | 'CLOSING_SOON'
export type HealthRange = '4W' | '8W' | '12W' | '6M' | '1Y'
export type CrawlStatus = 'SUCCESS' | 'NO_NEW' | 'FAILED'

export interface ApiSuccess<T, M = undefined> {
  success: true
  data: T
  meta?: M
}

export interface ApiErrorBody {
  success: false
  error: { code: string; message: string; fields?: Record<string, string> }
}

export interface PageMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface User {
  id: number
  nickname: string
  email: string
  role: Role
  authProvider: AuthProvider
  google: { linked: boolean; email: string | null; needsReauth: boolean }
  mustChangePassword: boolean
  createdAt: string
}

export interface Division {
  name: string
  distanceKm: number
  startTime: string
  feeNtd: number
}

export interface EventSummary {
  id: number
  name: string
  category: EventCategory
  county: string
  district: string
  eventDate: string
  registrationEnd: string
  distancesKm: number[]
  badge: RegistrationBadge
  coverUrl: string
}

export interface EventDetail extends Omit<EventSummary, 'distancesKm'> {
  venue: string
  organizer: string
  registrationStart: string
  daysUntilDeadline: number
  registrationUrl: string
  description: string
  divisions: Division[]
}

export interface EventListQuery {
  keyword?: string
  categories?: EventCategory[]
  county?: string
  distance?: DistanceBucket[]
  dateFrom?: string
  dateTo?: string
  /** 設計稿有排序下拉選單；API 規格尚未定義，先以 eventDate / -eventDate 表示 */
  sort?: 'eventDate' | '-eventDate'
  page?: number
  pageSize?: number
}

export interface EventListMeta extends PageMeta {
  categoryCounts: Record<EventCategory, number>
}

export interface RaceRecommendation {
  distanceBuckets: DistanceBucket[]
  basis: { weeks: number; avgWeeklyKm: number; longestRunKm: number }
  message: string
}

export interface RoutePoint {
  name: string
  note: string
  lat: number
  lng: number
}

export interface RunRoute {
  id: string
  name: string
  distanceKm: number
  county: string
  district: string
  surface: string[]
  start: RoutePoint
  end: RoutePoint
  loop: boolean
  path: [number, number][]
  description: string
  coverUrl: string
  source: { name: string; url: string }
}

export interface RouteQuery {
  county?: string
  district?: string
  lat?: number
  lng?: number
}

export interface RouteRecommendation {
  origin: { county: string; district: string }
  cached: boolean
  routes: RunRoute[]
}

export interface Training {
  name: string
  startedAt: string
  distanceKm: number
  durationMin: number
  paceSecPerKm: number | null
  avgHeartRate: number | null
  caloriesKcal: number
  quality: 'VALID' | 'FILTERED'
}

export interface HealthAnalysis {
  range: HealthRange
  syncedAt: string
  headline: string
  summary: {
    runnerType: string
    todaySuggestion: string
    dataQuality: { days: number; validTrainings: number; note: string }
  }
  today: { steps: number; distanceKm: number; caloriesKcal: number; activeMinutes: number }
  weeklyMileage: {
    growthPercent: number
    weeks: { week: number; km: number; type: 'NORMAL' | 'DELOAD' | 'CURRENT' }[]
  }
  achievements: {
    unlocked: number
    total: number
    items: { key: string; title: string; value: string; unlocked: boolean }[]
  }
  trainings: Training[]
}

export interface CrawlLog {
  id: number
  startedAt: string
  trigger: 'MANUAL' | 'SCHEDULED'
  operator: string | null
  status: CrawlStatus
  fetchedCount: number
  submittedCount: number
  failureReason: string | null
}

export interface AdminOverview {
  pendingEvents: { total: number; fromScheduled: number }
  publishedEvents: { total: number; addedThisMonth: number }
  members: { total: number; admins: number }
  pendingList: { id: number; name: string; eventDate: string; county: string; source: EventSource; submittedAt: string }[]
  crawlLogs: CrawlLog[]
}

export interface AdminEventRow {
  id: number
  name: string
  category: EventCategory
  eventDate: string
  county: string
  source: EventSource
  status: EventStatus
  updatedAt: string
  coverUrl: string
}

export interface AdminEventQuery {
  status?: EventStatus
  keyword?: string
  category?: EventCategory
  county?: string
  source?: EventSource
  page?: number
  pageSize?: number
}

export interface AdminEventListMeta extends PageMeta {
  statusCounts: Record<EventStatus | 'ALL', number>
}

export interface AdminEventDetail extends Omit<EventDetail, 'daysUntilDeadline' | 'badge'> {
  status: EventStatus
  source: EventSource
  sourceName: string | null
  submittedAt: string | null
  publishedAt: string | null
  updatedAt: string
  updatedBy: string | null
}

export type AdminEventPayload = Pick<
  AdminEventDetail,
  | 'name'
  | 'category'
  | 'county'
  | 'district'
  | 'venue'
  | 'organizer'
  | 'eventDate'
  | 'registrationStart'
  | 'registrationEnd'
  | 'registrationUrl'
  | 'description'
  | 'coverUrl'
  | 'divisions'
>

export interface CrawlJob extends CrawlLog {
  finishedAt: string
  sourceName: string
}

export interface AdminUserRow {
  id: number
  nickname: string
  email: string
  role: Role
  authProvider: AuthProvider
  createdAt: string
  isSelf: boolean
}

export interface AdminUserListMeta extends PageMeta {
  roleCounts: Record<Role | 'ALL', number>
}
