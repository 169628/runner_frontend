// axios 的假後端：VITE_USE_MOCK=true 時，所有 API 請求都交給這裡處理，回應格式與 API 規格一致。
import { AxiosError, type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import dayjs from 'dayjs'
import type {
  AdminEventDetail,
  AdminEventPayload,
  AdminEventRow,
  DistanceBucket,
  EventCategory,
  EventDetail,
  EventStatus,
  EventSummary,
  HealthRange,
  Role,
  User,
} from '@/types'
import { daysUntil, isWithinRange, registrationBadge } from '@/utils/timeComparison'
import { isValidHttpsUrl, isValidPassword } from '@/utils/validators'
import { crawlLogs, events, MOCK_NOW, users, type MockUser } from './db'
import { buildHealthAnalysis } from './health'
import { findRoutes } from './routes'

class MockError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields?: Record<string, string>,
  ) {
    super(message)
  }
}

interface Ctx {
  params: string[]
  query: Record<string, string>
  body: Record<string, unknown>
  me: MockUser | null
}

type Handler = (ctx: Ctx) => unknown | Promise<unknown>

const routes: { method: string; pattern: RegExp; handler: Handler; delay?: number }[] = []
const on = (method: string, path: string, handler: Handler, delay?: number) => {
  const pattern = new RegExp(`^${path.replace(/:\w+/g, '([^/]+)')}$`)
  routes.push({ method, pattern, handler, delay })
}

const ok = (data: unknown, meta?: unknown) => ({ success: true, data, ...(meta ? { meta } : {}) })
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// ---------- 共用 ----------

const toPublicUser = ({ password: _p, tempPassword: _t, ...user }: MockUser): User => user

const requireUser = (ctx: Ctx) => {
  if (!ctx.me) throw new MockError(401, 'UNAUTHORIZED', '請先登入')
  return ctx.me
}
const requireAdmin = (ctx: Ctx) => {
  const me = requireUser(ctx)
  if (me.role !== 'ADMIN') throw new MockError(403, 'FORBIDDEN', '權限不足')
  return me
}
const requireGoogle = (ctx: Ctx) => {
  const me = requireUser(ctx)
  if (!me.google.linked) throw new MockError(403, 'GOOGLE_NOT_LINKED', '尚未綁定 Google 帳號')
  return me
}

const findEvent = (id: string) => {
  const event = events.find((e) => e.id === Number(id))
  if (!event) throw new MockError(404, 'NOT_FOUND', '找不到這場賽事')
  return event
}

const paginate = <T>(list: T[], page = 1, pageSize = 8) => ({
  data: list.slice((page - 1) * pageSize, page * pageSize),
  meta: { page, pageSize, total: list.length, totalPages: Math.max(1, Math.ceil(list.length / pageSize)) },
})

const csv = (v?: string) => (v ? v.split(',').filter(Boolean) : [])

const inBucket = (km: number, bucket: DistanceBucket) =>
  ({
    LE_5K: km <= 5,
    K6_10: km > 5 && km <= 10,
    K11_21: km > 10 && km <= 21.1,
    K22_42: km > 21.1 && km <= 42.2,
    ULTRA: km > 42.2,
  })[bucket]

const toSummary = (e: AdminEventDetail): EventSummary => ({
  id: e.id,
  name: e.name,
  category: e.category,
  county: e.county,
  district: e.district,
  eventDate: e.eventDate,
  registrationEnd: e.registrationEnd,
  distancesKm: e.divisions.map((d) => d.distanceKm),
  badge: registrationBadge(e.registrationEnd, new Date(MOCK_NOW)),
  coverUrl: e.coverUrl,
})

const nowIso = () => dayjs(MOCK_NOW).add(dayjs().diff(dayjs().startOf('day'), 'second'), 'second').format()

const validateEvent = (body: Partial<AdminEventPayload>) => {
  const fields: Record<string, string> = {}
  if (!body.name?.trim()) fields.name = '請輸入活動名稱'
  if (!body.category) fields.category = '請選擇分類'
  if (!body.county) fields.county = '請選擇縣市'
  if (!body.district) fields.district = '請選擇鄉鎮區'
  if (!body.eventDate) fields.eventDate = '請選擇活動日期'
  if (!body.registrationUrl || !isValidHttpsUrl(body.registrationUrl))
    fields.registrationUrl = '請輸入以 https:// 開頭的有效網址'
  if (Object.keys(fields).length) throw new MockError(400, 'VALIDATION_ERROR', '欄位格式錯誤', fields)
}

// ---------- A02–A10 認證與會員 ----------

on('POST', '/auth/register', ({ body }) => {
  const { nickname, email, password } = body as Record<string, string>
  if (users.some((u) => u.email === email)) throw new MockError(409, 'EMAIL_TAKEN', '此 Email 已被註冊')
  const user: MockUser = {
    id: Math.max(...users.map((u) => u.id)) + 1,
    nickname,
    email,
    role: 'USER',
    authProvider: 'PASSWORD',
    google: { linked: false, email: null, needsReauth: false },
    mustChangePassword: false,
    createdAt: nowIso(),
    password,
    tempPassword: null,
  }
  users.push(user)
  return ok({ user: toPublicUser(user), token: `mock-${user.id}` })
})

on('POST', '/auth/login', ({ body }) => {
  const { email, password } = body as Record<string, string>
  const user = users.find((u) => u.email === email)
  if (user?.tempPassword && user.tempPassword === password) {
    user.mustChangePassword = true
  } else if (!user || !user.password || user.password !== password) {
    throw new MockError(401, 'INVALID_CREDENTIALS', '帳號或密碼錯誤')
  }
  return ok({ user: toPublicUser(user), token: `mock-${user.id}` })
})

on('POST', '/auth/logout', () => ok(null))

// Google OAuth 在真實環境是瀏覽器 302 導向；mock 直接完成登入 / 綁定並回傳要導去的前端路徑
on(
  'POST',
  '/auth/google/mock',
  (ctx) => {
    if (ctx.body.intent === 'BIND') {
      const me = requireUser(ctx)
      me.google = { linked: true, email: 'chen.run@gmail.com', needsReauth: false }
      return ok({ redirect: '/auth/callback?status=success&redirect=/profile', token: `mock-${me.id}` })
    }
    const user = users.find((u) => u.email === 'yating.c@gmail.com')!
    return ok({ redirect: '/auth/callback?status=success&redirect=/events', token: `mock-${user.id}` })
  },
  600,
)

on('GET', '/me', (ctx) => ok(toPublicUser(requireUser(ctx))))

on('PATCH', '/me', (ctx) => {
  const me = requireUser(ctx)
  const nickname = String(ctx.body.nickname ?? '').trim()
  if (nickname.length < 2 || nickname.length > 20)
    throw new MockError(400, 'VALIDATION_ERROR', '欄位格式錯誤', { nickname: '暱稱需為 2～20 字' })
  me.nickname = nickname
  return ok({ id: me.id, nickname })
})

on('PUT', '/me/password', (ctx) => {
  const me = requireUser(ctx)
  const { currentPassword, newPassword } = ctx.body as Record<string, string>
  if (me.authProvider === 'GOOGLE') throw new MockError(400, 'NO_PASSWORD_ACCOUNT', 'Google 會員沒有密碼')
  const current = me.mustChangePassword ? me.tempPassword : me.password
  if (current !== currentPassword)
    throw new MockError(400, 'WRONG_PASSWORD', '目前密碼不正確', { currentPassword: '目前密碼不正確' })
  if (!isValidPassword(newPassword))
    throw new MockError(400, 'VALIDATION_ERROR', '欄位格式錯誤', { newPassword: '至少 8 碼，需包含英文與數字' })
  if (newPassword === currentPassword)
    throw new MockError(400, 'VALIDATION_ERROR', '欄位格式錯誤', { newPassword: '新密碼不可與目前密碼相同' })
  me.password = newPassword
  me.tempPassword = null
  me.mustChangePassword = false
  return ok({ mustChangePassword: false })
})

on('DELETE', '/me', (ctx) => {
  const me = requireUser(ctx)
  users.splice(users.indexOf(me), 1)
  return ok(null)
})

// ---------- A11–A15 前台 ----------

on('GET', '/events', (ctx) => {
  requireUser(ctx)
  const { keyword = '', county, dateFrom, dateTo } = ctx.query
  const categories = csv(ctx.query.categories) as EventCategory[]
  const distance = csv(ctx.query.distance) as DistanceBucket[]
  const today = MOCK_NOW.slice(0, 10)

  const visible = events.filter((e) => e.status === 'PUBLISHED' && e.registrationEnd >= today)
  const matchesExceptCategory = visible.filter(
    (e) =>
      (!keyword || e.name.includes(keyword) || e.county.includes(keyword) || e.district.includes(keyword)) &&
      (!county || e.county === county) &&
      (!distance.length || e.divisions.some((d) => distance.some((b) => inBucket(d.distanceKm, b)))) &&
      isWithinRange(e.eventDate, dateFrom, dateTo),
  )
  const categoryCounts = { MARATHON: 0, ROAD_RUN: 0, TRAIL: 0, RELAY: 0 }
  matchesExceptCategory.forEach((e) => categoryCounts[e.category]++)

  const list = matchesExceptCategory
    .filter((e) => !categories.length || categories.includes(e.category))
    .sort((a, b) => (ctx.query.sort === '-eventDate' ? -1 : 1) * a.eventDate.localeCompare(b.eventDate))
    .map(toSummary)
  const { data, meta } = paginate(list, Number(ctx.query.page) || 1, Number(ctx.query.pageSize) || 6)
  return ok(data, { ...meta, categoryCounts })
})

on('GET', '/events/:id', (ctx) => {
  requireUser(ctx)
  const e = findEvent(ctx.params[0])
  if (e.status !== 'PUBLISHED') throw new MockError(404, 'NOT_FOUND', '找不到這場賽事')
  const { status: _s, source: _src, sourceName: _sn, submittedAt: _sa, publishedAt: _pa, updatedAt: _u, updatedBy: _ub, ...rest } = e
  const detail: EventDetail = {
    ...rest,
    daysUntilDeadline: daysUntil(e.registrationEnd, new Date(MOCK_NOW)),
    badge: registrationBadge(e.registrationEnd, new Date(MOCK_NOW)),
  }
  return ok(detail)
})

on('GET', '/me/race-recommendation', (ctx) => {
  requireGoogle(ctx)
  return ok({
    distanceBuckets: ['K6_10', 'K11_21'],
    basis: { weeks: 4, avgWeeklyKm: 37.5, longestRunKm: 9.36 },
    message: '近 4 週平均每週跑 37.5 km，適合 10K～半馬賽事',
  })
})

on(
  'GET',
  '/routes/recommendations',
  (ctx) => {
    requireUser(ctx)
    const { county = '臺北市', district = '中山區' } = ctx.query
    return ok({ origin: { county, district }, cached: false, routes: findRoutes(county, district) })
  },
  1800,
)

on('GET', '/me/health-analysis', (ctx) => {
  requireGoogle(ctx)
  return ok(buildHealthAnalysis((ctx.query.range as HealthRange) || '8W'))
})

// ---------- A16–A27 後台 ----------

on('GET', '/admin/overview', (ctx) => {
  requireAdmin(ctx)
  const pending = events.filter((e) => e.status === 'PENDING').sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const published = events.filter((e) => e.status === 'PUBLISHED')
  return ok({
    pendingEvents: { total: pending.length, fromScheduled: pending.filter((e) => e.source === 'SCHEDULED_CRAWL').length },
    publishedEvents: {
      total: published.length,
      addedThisMonth: published.filter((e) => e.publishedAt?.startsWith(MOCK_NOW.slice(0, 7))).length,
    },
    members: { total: users.length, admins: users.filter((u) => u.role === 'ADMIN').length },
    pendingList: pending.map((e) => ({
      id: e.id,
      name: e.name,
      eventDate: e.eventDate,
      county: e.county,
      source: e.source,
      submittedAt: e.submittedAt ?? e.updatedAt,
    })),
    crawlLogs,
  })
})

on('GET', '/admin/events', (ctx) => {
  requireAdmin(ctx)
  const { status, keyword = '', category, county, source } = ctx.query
  const base = events.filter(
    (e) =>
      (!keyword || e.name.includes(keyword)) &&
      (!category || e.category === category) &&
      (!county || e.county === county) &&
      (!source || e.source === source),
  )
  const statusCounts = { ALL: base.length, PENDING: 0, PUBLISHED: 0, REJECTED: 0, CLOSED: 0 }
  base.forEach((e) => statusCounts[e.status]++)

  const rows: AdminEventRow[] = base
    .filter((e) => !status || e.status === status)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map(({ id, name, category, eventDate, county, source, status, updatedAt, coverUrl }) => ({
      id, name, category, eventDate, county, source, status, updatedAt, coverUrl,
    }))
  const { data, meta } = paginate(rows, Number(ctx.query.page) || 1, Number(ctx.query.pageSize) || 8)
  return ok(data, { ...meta, statusCounts })
})

on('GET', '/admin/events/:id', (ctx) => {
  requireAdmin(ctx)
  return ok(findEvent(ctx.params[0]))
})

on('POST', '/admin/events', (ctx) => {
  const me = requireAdmin(ctx)
  const body = ctx.body as unknown as AdminEventPayload
  validateEvent(body)
  const now = nowIso()
  const event: AdminEventDetail = {
    ...body,
    id: Math.max(...events.map((e) => e.id)) + 1,
    coverUrl: body.coverUrl || '/images/cover-meadow.jpg',
    status: 'PUBLISHED',
    source: 'MANUAL',
    sourceName: null,
    submittedAt: null,
    publishedAt: now,
    updatedAt: now,
    updatedBy: me.nickname,
  }
  events.push(event)
  return ok(event)
})

on('PUT', '/admin/events/:id', (ctx) => {
  const me = requireAdmin(ctx)
  const event = findEvent(ctx.params[0])
  validateEvent(ctx.body as Partial<AdminEventPayload>)
  Object.assign(event, ctx.body, { updatedAt: nowIso(), updatedBy: me.nickname })
  return ok(event)
})

const TRANSITIONS: Record<EventStatus, EventStatus[]> = {
  PENDING: ['PUBLISHED', 'REJECTED'],
  PUBLISHED: ['CLOSED'],
  REJECTED: [],
  CLOSED: [],
}

on('PATCH', '/admin/events/:id/status', (ctx) => {
  const me = requireAdmin(ctx)
  const event = findEvent(ctx.params[0])
  const next = ctx.body.status as EventStatus
  if (!TRANSITIONS[event.status].includes(next))
    throw new MockError(409, 'INVALID_STATUS_TRANSITION', '目前狀態不允許此操作')
  event.status = next
  event.updatedAt = nowIso()
  event.updatedBy = me.nickname
  if (next === 'PUBLISHED') event.publishedAt = event.updatedAt
  return ok({ id: event.id, status: event.status, publishedAt: event.publishedAt })
})

on('DELETE', '/admin/events/:id', (ctx) => {
  requireAdmin(ctx)
  events.splice(events.indexOf(findEvent(ctx.params[0])), 1)
  return ok(null)
})

on('POST', '/admin/uploads/event-cover', (ctx) => {
  requireAdmin(ctx)
  return ok({ uploadUrl: 'mock://upload', fileUrl: '', expiresIn: 300 })
})

// 手動爬取：mock 固定回傳失敗，用來展示「爬取失敗」Modal
on(
  'POST',
  '/admin/crawl-jobs',
  (ctx) => {
    const me = requireAdmin(ctx)
    const startedAt = nowIso()
    const job = {
      id: Math.max(...crawlLogs.map((l) => l.id)) + 1,
      trigger: 'MANUAL' as const,
      operator: me.nickname,
      startedAt,
      finishedAt: dayjs(startedAt).add(30, 'second').format(),
      status: 'FAILED' as const,
      fetchedCount: 0,
      submittedCount: 0,
      sourceName: '運動筆記',
      failureReason: '連線逾時（超過 30 秒未回應）',
    }
    crawlLogs.unshift({ ...job, failureReason: '連線逾時，未抓取任何活動' })
    return ok(job)
  },
  1500,
)

on('GET', '/admin/users', (ctx) => {
  const me = requireAdmin(ctx)
  const { keyword = '', role } = ctx.query
  const base = users.filter((u) => !keyword || u.nickname.includes(keyword) || u.email.includes(keyword))
  const roleCounts = { ALL: base.length, USER: 0, ADMIN: 0 }
  base.forEach((u) => roleCounts[u.role]++)
  const rows = base
    .filter((u) => !role || u.role === role)
    .map((u) => ({
      id: u.id,
      nickname: u.nickname,
      email: u.email,
      role: u.role,
      authProvider: u.authProvider,
      createdAt: u.createdAt,
      isSelf: u.id === me.id,
    }))
  const { data, meta } = paginate(rows, Number(ctx.query.page) || 1, Number(ctx.query.pageSize) || 8)
  return ok(data, { ...meta, roleCounts })
})

on('PATCH', '/admin/users/:id/role', (ctx) => {
  const me = requireAdmin(ctx)
  const user = users.find((u) => u.id === Number(ctx.params[0]))
  if (!user) throw new MockError(404, 'NOT_FOUND', '找不到此會員')
  if (user.id === me.id) throw new MockError(403, 'CANNOT_MODIFY_SELF', '不能修改自己的角色')
  const role = ctx.body.role as Role
  if (user.role === 'ADMIN' && role === 'USER' && users.filter((u) => u.role === 'ADMIN').length <= 1)
    throw new MockError(409, 'LAST_ADMIN', '至少需保留 1 位管理員')
  user.role = role
  return ok({ id: user.id, role })
})

on('POST', '/admin/users/:id/temp-password', (ctx) => {
  requireAdmin(ctx)
  const user = users.find((u) => u.id === Number(ctx.params[0]))
  if (!user) throw new MockError(404, 'NOT_FOUND', '找不到此會員')
  if (user.authProvider === 'GOOGLE')
    throw new MockError(400, 'NO_PASSWORD_ACCOUNT', 'Google 會員沒有密碼，無法產生臨時密碼')
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  const part = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  user.tempPassword = `Pcr-${part(4)}-${part(3)}`
  user.mustChangePassword = true
  return ok({ userId: user.id, nickname: user.nickname, tempPassword: user.tempPassword })
})

// ---------- adapter ----------

const currentUser = (config: InternalAxiosRequestConfig) => {
  const auth = String(config.headers?.Authorization ?? '')
  const id = Number(auth.replace('Bearer mock-', ''))
  return users.find((u) => u.id === id) ?? null
}

export const mockAdapter: AxiosAdapter = async (config) => {
  const url = new URL(config.url ?? '', 'http://mock')
  const method = (config.method ?? 'get').toUpperCase()
  const route = routes.find((r) => r.method === method && r.pattern.test(url.pathname))

  const respond = (status: number, data: unknown): AxiosResponse => ({
    data,
    status,
    statusText: String(status),
    headers: {},
    config,
  })

  await sleep(route?.delay ?? 250)

  try {
    if (!route) throw new MockError(404, 'NOT_FOUND', `Mock 尚未實作 ${method} ${url.pathname}`)
    const query: Record<string, string> = {}
    Object.entries(config.params ?? {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query[k] = String(v)
    })
    const body = typeof config.data === 'string' ? JSON.parse(config.data || '{}') : (config.data ?? {})
    const params = url.pathname.match(route.pattern)!.slice(1)
    const result = await route.handler({ params, query, body, me: currentUser(config) })
    // 回傳深拷貝，避免頁面直接改到假資料庫
    return respond(method === 'POST' ? 201 : 200, structuredClone(result))
  } catch (err) {
    if (!(err instanceof MockError)) throw err
    const response = respond(err.status, {
      success: false,
      error: { code: err.code, message: err.message, ...(err.fields ? { fields: err.fields } : {}) },
    })
    throw new AxiosError(err.message, String(err.status), config, null, response)
  }
}
