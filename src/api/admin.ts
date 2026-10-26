// A16–A27 管理後台
import request from './request'
import type {
  AdminEventDetail,
  AdminEventListMeta,
  AdminEventPayload,
  AdminEventQuery,
  AdminEventRow,
  AdminOverview,
  AdminUserListMeta,
  AdminUserRow,
  ApiSuccess,
  CrawlJob,
  EventStatus,
  Role,
} from '@/types'

export const getOverview = () => request.get<ApiSuccess<AdminOverview>>('/admin/overview').then((res) => res.data.data)

export const getAdminEvents = (params: AdminEventQuery = {}) =>
  request
    .get<ApiSuccess<AdminEventRow[], AdminEventListMeta>>('/admin/events', { params })
    .then((res) => ({ list: res.data.data, meta: res.data.meta! }))

export const getAdminEvent = (id: number | string) =>
  request.get<ApiSuccess<AdminEventDetail>>(`/admin/events/${id}`).then((res) => res.data.data)

export const createEvent = (body: AdminEventPayload) =>
  request.post<ApiSuccess<AdminEventDetail>>('/admin/events', body).then((res) => res.data.data)

export const updateEvent = (id: number | string, body: AdminEventPayload) =>
  request.put<ApiSuccess<AdminEventDetail>>(`/admin/events/${id}`, body).then((res) => res.data.data)

export const updateEventStatus = (id: number | string, status: Exclude<EventStatus, 'PENDING'>) =>
  request.patch(`/admin/events/${id}/status`, { status }).then((res) => res.data.data)

export const deleteEvent = (id: number | string) => request.delete(`/admin/events/${id}`)

export const getCoverUploadUrl = (file: File) =>
  request
    .post<ApiSuccess<{ uploadUrl: string; fileUrl: string; expiresIn: number }>>('/admin/uploads/event-cover', {
      fileName: file.name,
      contentType: file.type,
      fileSize: file.size,
    })
    .then((res) => res.data.data)

export const triggerCrawl = () => request.post<ApiSuccess<CrawlJob>>('/admin/crawl-jobs').then((res) => res.data.data)

export const getUsers = (params: { keyword?: string; role?: Role; page?: number; pageSize?: number } = {}) =>
  request
    .get<ApiSuccess<AdminUserRow[], AdminUserListMeta>>('/admin/users', { params })
    .then((res) => ({ list: res.data.data, meta: res.data.meta! }))

export const updateUserRole = (id: number, role: Role) =>
  request.patch(`/admin/users/${id}/role`, { role }).then((res) => res.data.data)

export const createTempPassword = (id: number) =>
  request
    .post<ApiSuccess<{ userId: number; nickname: string; tempPassword: string }>>(`/admin/users/${id}/temp-password`)
    .then((res) => res.data.data)
