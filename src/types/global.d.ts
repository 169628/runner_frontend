import type { formatCurrency } from '@/utils/formatCurrency'
import type { SwalHandler } from '@/utils/swalHandler'
import type { Role } from './index'
import 'vue-router'

declare module 'vue' {
  interface ComponentCustomProperties {
    $formatCurrency: typeof formatCurrency
    $swal: SwalHandler
  }
}

declare module 'vue-router' {
  interface RouteMeta {
    /** USER：登入即可；ADMIN：限管理員 */
    requiredRole?: Role
    /** 已登入者不該看到的頁面（登入 / 註冊） */
    guestOnly?: boolean
    title?: string
    /** 不顯示頁尾（路線推薦：地圖延伸到頁面底部） */
    hideFooter?: boolean
  }
}

export {}
