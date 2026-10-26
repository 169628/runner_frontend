/**
 * 「哪些 API 不需要帶 token」的對照表。
 * 字串為完全比對（不含 baseURL），正則用於帶參數的路徑。
 */
export const ROUTE_TABLE: { public: (string | RegExp)[] } = {
  public: ['/health', '/auth/register', '/auth/login', /^\/auth\/google(\/callback)?$/],
}

export function isPublicApi(url = ''): boolean {
  const path = url.split('?')[0]
  return ROUTE_TABLE.public.some((rule) => (typeof rule === 'string' ? rule === path : rule.test(path)))
}
