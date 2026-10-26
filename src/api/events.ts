// A11–A12 前台賽事
import request from './request'
import type { ApiSuccess, EventDetail, EventListMeta, EventListQuery, EventSummary } from '@/types'

export const getEvents = (query: EventListQuery = {}) =>
  request
    .get<ApiSuccess<EventSummary[], EventListMeta>>('/events', {
      params: {
        ...query,
        categories: query.categories?.join(','),
        distance: query.distance?.join(','),
      },
    })
    .then((res) => ({ list: res.data.data, meta: res.data.meta! }))

export const getEvent = (id: number | string) =>
  request.get<ApiSuccess<EventDetail>>(`/events/${id}`).then((res) => res.data.data)
