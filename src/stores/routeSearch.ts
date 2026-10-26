import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { RouteRecommendation } from '@/types'

const STORAGE_KEY = 'pacer_route_result'

/**
 * 路線推薦的最近一次結果。後端不落 DB、沒有單筆 API，
 * 所以路線詳情頁從這裡拿資料；存在 sessionStorage，重新整理也不會遺失。
 */
export const useRouteSearchStore = defineStore('routeSearch', () => {
  const saved = sessionStorage.getItem(STORAGE_KEY)
  const result = ref<RouteRecommendation | null>(saved ? JSON.parse(saved) : null)

  watch(result, (value) => sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value)))

  const findRoute = (id: string) => result.value?.routes.find((r) => r.id === id) ?? null

  return { result, findRoute }
})
