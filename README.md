# Pacer Frontend

Pacer 的前端（Vue 3.5 + Vite 7 + TypeScript + Pinia 3 + Tailwind CSS 4），畫面依設計稿 `../design`（pen.dev `pacer.pen` 匯出）實作。

## 開始

```bash
npm install
cp .env.example .env   # 第一次才需要
npm run dev            # http://localhost:5173
```

| 指令 | 說明 |
| --- | --- |
| `npm run dev` | 開發模式 |
| `npm run build` | 型別檢查 + 打包到 `dist/` |
| `npm run preview` | 預覽打包結果 |
| `npm run type-check` | 只跑 vue-tsc |
| `npm run lint` | ESLint（js / ts / vue / css / json / md） |

## Mock 模式

目前還沒有後端，`.env` 預設 `VITE_USE_MOCK=true`：所有 API 請求由 `src/mock/adapter.ts`（axios adapter）回應，
格式與 `pacer-實作計畫.md` §8 的 API 規格一致。假資料在記憶體中，重新整理頁面就會還原。

測試帳號（登入頁下方也有一鍵帶入）：

| 帳號 | 密碼 | 情境 |
| --- | --- | --- |
| `runner@pacer.tw` | `pacer1234` | 一般會員，未綁定 Google |
| `admin@pacer.tw` | `pacer1234` | 管理員，登入後進後台 |
| `bohan.h@yahoo.com.tw` | `Pcr-7K2q-9Xm` | 臨時密碼登入 → 強制修改密碼 |
| 「使用 Google 帳號登入」 | — | Google 會員（張雅婷），已綁定 |

可以操作的狀態：

- 個人基本資料按「綁定 Google 帳號」→ 健康分析、依訓練能力找賽事解鎖
- 路線推薦選「澎湖縣」→ 找不到路線；按「目前位置」並拒絕定位 → 定位權限被拒
- 活動列表篩選到沒有結果 → 空狀態
- 後台「手動爬取」→ 固定回傳失敗，展示爬取失敗 Modal

串接後端時把 `VITE_USE_MOCK` 改成 `false`、設定 `VITE_API_BASE_URL` 即可，頁面程式不用改。

## 路由

| 路徑 | 頁面 | 權限 |
| --- | --- | --- |
| `/login`、`/signup` | 登入 / 註冊 | 未登入 |
| `/auth/callback` | Google OAuth 回呼 | — |
| `/change-password` | 臨時密碼強制修改 | 登入 |
| `/events`、`/events/:id` | 活動探索 / 活動詳情 | USER |
| `/routes`、`/routes/:routeId` | 路線推薦 / 路線詳情 | USER |
| `/health` | 健康分析 | USER |
| `/profile` | 個人基本資料 | USER |
| `/admin/dashboard` | 後台總覽 | ADMIN |
| `/admin/events`、`/admin/events/new`、`/admin/events/:id/edit` | 活動管理 / 新增 / 編輯與審核 | ADMIN |
| `/admin/members` | 會員與角色 | ADMIN |
| `/admin/password` | 修改密碼 | ADMIN |

`meta.requiredRole: 'USER'` 代表登入即可（ADMIN 也能看前台），`'ADMIN'` 限管理員。守衛在 `src/router/index.ts`。

## 資料夾

```text
src/
├── main.ts            # createApp + Pinia + Router，註冊 $formatCurrency / $swal
├── router/            # 路由表與權限守衛
├── config/            # routeTable（不帶 token 的 API）、列舉文字與縣市清單
├── api/               # axios 實例與各模組 API（auth / users / events / routes / admin）
├── mock/              # mock adapter 與假資料
├── stores/            # user（currentUser）、routeSearch（最近一次路線推薦結果）
├── layouts/           # 頁首、頁尾、手機版底部 Tab Bar
├── pages/             # public（登入相關、404）、user（前台）、admin（後台）
├── components/        # 共用元件（卡片、Modal、表單、地圖、圖表）
├── composables/       # useNow
├── chart/             # ECharts 按需引入與圖表 option
├── utils/             # cookie、日期 / 金額格式化、驗證、SweetAlert2 封裝
└── types/             # API 型別
```

## 注意事項

- 地圖目前是靜態底圖 + SVG 路線（`components/MapCanvas.vue`），之後換成 Leaflet / Google Maps 只需改這個元件。
- 活動列表的排序參數 `sort` 在 API 規格中尚未定義，前端先以 `eventDate` / `-eventDate` 傳送。
- API 規格寫的是後端設定 httpOnly cookie；`api/request.ts` 依 `ROUTE_TABLE` 帶 Bearer token 的機制保留給 mock 與非 httpOnly 的情況，httpOnly 時讀不到 token 就不會帶，靠 `withCredentials` 送 cookie。
- 配色規範見 [COLOR_GUIDE.md](COLOR_GUIDE.md)。

## Docker

```bash
docker build --build-arg VITE_API_BASE_URL=https://api.example.com/api/v1 -t pacer-frontend .
docker run -p 8080:80 pacer-frontend
```
