import { createRouter, createWebHistory } from 'vue-router'
import { setUnauthorizedHandler } from '@/api/request'
import { useUserStore } from '@/stores/user'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: (_to, _from, saved) => saved ?? { top: 0 },
  routes: [
    { path: '/', redirect: '/events' },

    // 不需登入
    { path: '/login', name: 'login', component: () => import('@/pages/public/auth/LoginView.vue'), meta: { guestOnly: true, title: '登入' } },
    { path: '/signup', name: 'signup', component: () => import('@/pages/public/auth/SignupView.vue'), meta: { guestOnly: true, title: '註冊' } },
    { path: '/auth/callback', name: 'auth-callback', component: () => import('@/pages/public/auth/AuthCallback.vue') },

    // 登入後：臨時密碼登入要先改密碼
    {
      path: '/change-password',
      name: 'force-change-password',
      component: () => import('@/pages/public/auth/ForceChangePassword.vue'),
      meta: { requiredRole: 'USER', title: '設定新密碼' },
    },

    // 前台（meta.requiredRole: USER）
    {
      path: '/',
      component: () => import('@/pages/user/UserLayout.vue'),
      meta: { requiredRole: 'USER' },
      children: [
        { path: 'events', name: 'events', component: () => import('@/pages/user/EventsView.vue'), meta: { title: '活動探索' } },
        { path: 'events/:id', name: 'event-detail', component: () => import('@/pages/user/EventDetail.vue'), meta: { title: '活動詳情' } },
        { path: 'routes', name: 'routes', component: () => import('@/pages/user/RoutesView.vue'), meta: { title: '路線推薦', hideFooter: true } },
        { path: 'routes/:routeId', name: 'route-detail', component: () => import('@/pages/user/RouteDetail.vue'), meta: { title: '路線詳情' } },
        { path: 'health', name: 'health', component: () => import('@/pages/user/HealthView.vue'), meta: { title: '健康分析' } },
        { path: 'profile', name: 'profile', component: () => import('@/pages/user/ProfileView.vue'), meta: { title: '個人基本資料' } },
      ],
    },

    // 管理後台（meta.requiredRole: ADMIN）
    {
      path: '/admin',
      component: () => import('@/pages/admin/AdminLayout.vue'),
      meta: { requiredRole: 'ADMIN' },
      redirect: { name: 'admin-dashboard' },
      children: [
        { path: 'dashboard', name: 'admin-dashboard', component: () => import('@/pages/admin/DashboardView.vue'), meta: { title: '總覽' } },
        { path: 'events', name: 'admin-events', component: () => import('@/pages/admin/EventsView.vue'), meta: { title: '活動管理' } },
        { path: 'events/new', name: 'admin-event-new', component: () => import('@/pages/admin/EventEditor.vue'), meta: { title: '新增活動' } },
        { path: 'events/:id/edit', name: 'admin-event-edit', component: () => import('@/pages/admin/EventEditor.vue'), meta: { title: '編輯活動' } },
        { path: 'members', name: 'admin-members', component: () => import('@/pages/admin/MembersView.vue'), meta: { title: '會員與角色' } },
        { path: 'password', name: 'admin-password', component: () => import('@/pages/admin/PasswordView.vue'), meta: { title: '修改密碼' } },
      ],
    },

    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/pages/public/NotFound.vue') },
  ],
})

// 權限守衛：巡邏 meta.requiredRole（父路由的 meta 會合併到子路由）
router.beforeEach(async (to) => {
  const store = useUserStore()
  const user = await store.ensureChecked()
  const requiredRole = to.matched.map((r) => r.meta.requiredRole).find(Boolean)

  if (!user) {
    return requiredRole ? { name: 'login', query: { redirect: to.fullPath } } : true
  }
  if (user.mustChangePassword && to.name !== 'force-change-password') {
    return { name: 'force-change-password' }
  }
  if (!user.mustChangePassword && to.name === 'force-change-password') {
    return homeOf(user.role)
  }
  if (to.meta.guestOnly) return homeOf(user.role)
  if (requiredRole === 'ADMIN' && user.role !== 'ADMIN') return { name: 'events' }
  return true
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title}｜Pacer` : 'Pacer'
})

export function homeOf(role: string) {
  return role === 'ADMIN' ? { name: 'admin-dashboard' } : { name: 'events' }
}

setUnauthorizedHandler(() => {
  useUserStore().clear()
  const current = router.currentRoute.value
  if (current.name !== 'login') router.push({ name: 'login', query: { redirect: current.fullPath } })
})

export default router
