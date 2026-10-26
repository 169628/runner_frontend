# Pacer 配色規範

色票定義在 `src/style.css` 的 `@theme`，Tailwind 會自動產生對應 class（例如 `bg-accent`、`text-ink-2`、`border-line`）。
請一律使用 token，不要在元件裡寫死色碼。

## 基礎

| Token | 色碼 | 用途 |
| --- | --- | --- |
| `bg` | `#FBF7F2` | 頁面底色 |
| `surface` | `#FFFFFF` | 卡片、輸入框 |
| `surface-2` | `#F1EBE3` | 次要底色、距離標籤、分頁切換底 |
| `paper` | `#F5EDE6` | 表頭、資訊方塊 |
| `line` | `#E8DFD4` | 邊框、分隔線 |
| `ink` | `#2F2B28` | 主要文字、深色區塊（後台側欄、健康摘要） |
| `ink-2` | `#6F6760` | 次要文字、圖示 |
| `text-lo` | `#6B625B` | 說明文字、placeholder |

## 語意色

| Token | 色碼 | 搭配底色 / 深色字 | 用途 |
| --- | --- | --- | --- |
| `accent` | `#4A6F5C` | `accent-soft` `#E4EDE6` | 主按鈕、連結、報名中、已發布 |
| `warn` | `#B9842F` | `warn-soft` `#F6ECD9` / `warn-ink` `#7A5418` | 即將截止、待審核、減量週 |
| `danger` | `#B5543F` | `heart-soft` `#F7E3DD` | 刪除、錯誤、已棄用、爬取失敗 |
| `heart` | `#D9806B` | `heart-soft` / `heart-ink` `#9C4430` | 心率、連續達標 |
| `sleep` | `#8C9BD6` | `sleep-soft` `#E6E9F7` / `sleep-ink` `#4A5899` | 排程爬取、ADMIN 角色 |

## 字型

| Token | 字型 | 用途 |
| --- | --- | --- |
| `font-heading` | Noto Serif TC | 頁面標題、卡片標題 |
| `font-body` | Noto Sans TC | 內文（body 預設） |
| `font-display` | Outfit | 數字、日期、距離、Logo |
