// A14 路線推薦（後端即時爬取，不落 DB）
import request from './request'
import type { ApiSuccess, RouteQuery, RouteRecommendation } from '@/types'

export const getRouteRecommendations = (query: RouteQuery) =>
  request
    .get<ApiSuccess<RouteRecommendation>>('/routes/recommendations', { params: query })
    .then((res) => res.data.data)
