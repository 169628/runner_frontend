// 路線推薦假資料：後端會即時爬取外部來源，這裡依地區產生固定結果
import type { RunRoute } from '@/types'

const img = (name: string) => `/images/${name}.jpg`

const ZHONGSHAN_ROUTES: RunRoute[] = [
  {
    id: 'r_8f3a1c',
    name: '大佳河濱—美堤河濱',
    distanceKm: 5.2,
    county: '臺北市',
    district: '中山區',
    surface: ['柏油', '自行車道'],
    start: { name: '大佳河濱公園', note: '濱江街入口', lat: 25.0726, lng: 121.535 },
    end: { name: '美堤河濱公園', note: '美堤停車場旁', lat: 25.0786, lng: 121.556 },
    loop: false,
    path: [
      [25.0726, 121.535],
      [25.0741, 121.5395],
      [25.0752, 121.5448],
      [25.0768, 121.5505],
      [25.0786, 121.556],
    ],
    description:
      '沿著基隆河右岸一路向東，左手邊是寬闊的河面與對岸的大直天際線。傍晚時分夕陽落在河面上，是台北最受歡迎的跑步風景之一。全程平坦、無紅綠燈，路面為柏油自行車道。',
    coverUrl: img('cover-meadow'),
    source: { name: '運動筆記', url: 'https://running.biji.co' },
  },
  {
    id: 'r_2b7d90',
    name: '花博公園環線',
    distanceKm: 4.8,
    county: '臺北市',
    district: '中山區',
    surface: ['柏油', '公園步道'],
    start: { name: '圓山', note: '花博公園圓山園區', lat: 25.0712, lng: 121.5202 },
    end: { name: '圓山', note: '起終點同處', lat: 25.0712, lng: 121.5202 },
    loop: true,
    path: [
      [25.0712, 121.5202],
      [25.0731, 121.5241],
      [25.0702, 121.5287],
      [25.0684, 121.5236],
      [25.0712, 121.5202],
    ],
    description: '繞行花博公園圓山、美術、新生三個園區，沿途綠蔭多，假日人潮較多建議清晨前往。',
    coverUrl: img('cover-cliffs'),
    source: { name: '健行筆記', url: 'https://hiking.biji.co' },
  },
  {
    id: 'r_5c41e7',
    name: '林安泰古厝綠廊',
    distanceKm: 5.5,
    county: '臺北市',
    district: '中山區',
    surface: ['人行道', '公園步道'],
    start: { name: '濱江街', note: '林安泰古厝民俗文物館', lat: 25.0715, lng: 121.5305 },
    end: { name: '濱江街', note: '起終點同處', lat: 25.0715, lng: 121.5305 },
    loop: true,
    path: [
      [25.0715, 121.5305],
      [25.0742, 121.5342],
      [25.0721, 121.5398],
      [25.069, 121.5351],
      [25.0715, 121.5305],
    ],
    description: '從林安泰古厝出發，串連新生公園與濱江街綠廊，路面平整、補水點多。',
    coverUrl: img('hero-trail'),
    source: { name: '臺北市政府開放資料', url: 'https://data.taipei' },
  },
  {
    id: 'r_9e06b2',
    name: '基隆河左岸自行車道',
    distanceKm: 5.9,
    county: '臺北市',
    district: '中山區',
    surface: ['柏油', '自行車道'],
    start: { name: '大直橋', note: '大直橋下', lat: 25.0794, lng: 121.5458 },
    end: { name: '麥帥一橋', note: '麥帥一橋下', lat: 25.0611, lng: 121.5712 },
    loop: false,
    path: [
      [25.0794, 121.5458],
      [25.0752, 121.5536],
      [25.0688, 121.5619],
      [25.0611, 121.5712],
    ],
    description: '沿基隆河左岸往東南方向，視野開闊，可遠眺松山機場跑道。',
    coverUrl: img('cover-mist'),
    source: { name: '運動筆記', url: 'https://running.biji.co' },
  },
]

/** 找不到路線的地區（展示「找不到路線」狀態用） */
const NO_ROUTE_COUNTIES = ['澎湖縣']

export function findRoutes(county: string, district: string): RunRoute[] {
  if (NO_ROUTE_COUNTIES.includes(county)) return []
  if (county === '臺北市' && district === '中山區') return ZHONGSHAN_ROUTES

  // 其他地區：用同一組路線外型與照片，改掉名稱與地區
  const names = [`${district}河濱步道`, `${district}運動公園環線`, `${district}綠園道`]
  return ZHONGSHAN_ROUTES.slice(0, 3).map((r, i) => ({
    ...r,
    id: `r_${county}${district}${i}`,
    name: names[i],
    county,
    district,
    start: { ...r.start, name: i === 0 ? `${district}河濱公園` : `${district}運動公園` },
    end: { ...r.end, name: r.loop ? `${district}運動公園` : `${district}河濱公園東側` },
    distanceKm: Number((r.distanceKm - 0.4 + i * 0.6).toFixed(1)),
    description: `位於${county}${district}的熱門跑步路線，路面平整、沿途有補水點，適合日常慢跑。`,
  }))
}
