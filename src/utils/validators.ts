// 前端表單驗證規則（與後端 API 規格一致）
export const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

/** ≥ 8 碼，需含英文與數字 */
export const isValidPassword = (v: string) => v.length >= 8 && /[A-Za-z]/.test(v) && /\d/.test(v)

export const isValidHttpsUrl = (v: string) => /^https:\/\/[^\s.]+\.[^\s]+$/.test(v)

export const PASSWORD_RULE_HINT = '至少 8 碼，需包含英文與數字'
