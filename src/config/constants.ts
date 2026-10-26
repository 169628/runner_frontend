import type { DistanceBucket, EventCategory, EventSource, EventStatus } from '@/types'

export const CATEGORY_LABEL: Record<EventCategory, string> = {
  MARATHON: '馬拉松',
  ROAD_RUN: '路跑',
  TRAIL: '越野跑',
  RELAY: '接力賽',
}

export const DISTANCE_LABEL: Record<DistanceBucket, string> = {
  LE_5K: '5K 以下',
  K6_10: '6–10K',
  K11_21: '11–21K',
  K22_42: '22–42K',
  ULTRA: '超馬',
}

export const STATUS_LABEL: Record<EventStatus, string> = {
  PENDING: '待審核',
  PUBLISHED: '已發布',
  REJECTED: '已棄用',
  CLOSED: '已下架',
}

export const SOURCE_LABEL: Record<EventSource, string> = {
  MANUAL: '手動新增',
  MANUAL_CRAWL: '手動爬取',
  SCHEDULED_CRAWL: '排程爬取',
}

/** 縣市 → 鄉鎮區（只列出設計稿與假資料用得到的，串接後端後改由 API 提供） */
export const COUNTY_DISTRICTS: Record<string, string[]> = {
  臺北市: ['中山區', '大同區', '信義區', '士林區', '北投區', '內湖區'],
  新北市: ['板橋區', '新店區', '淡水區', '三重區'],
  桃園市: ['桃園區', '中壢區', '大溪區'],
  新竹市: ['東區', '北區', '香山區'],
  臺中市: ['西屯區', '后里區', '北屯區'],
  嘉義縣: ['阿里山鄉', '民雄鄉'],
  南投縣: ['魚池鄉', '埔里鎮', '集集鎮'],
  臺南市: ['中西區', '安平區', '東區'],
  高雄市: ['鹽埕區', '鼓山區', '前鎮區'],
  屏東縣: ['恆春鎮', '屏東市'],
  宜蘭縣: ['冬山鄉', '宜蘭市', '礁溪鄉'],
  花蓮縣: ['秀林鄉', '花蓮市', '吉安鄉'],
  臺東縣: ['臺東市', '池上鄉'],
  澎湖縣: ['馬公市', '西嶼鄉'],
}

export const COUNTIES = Object.keys(COUNTY_DISTRICTS)
