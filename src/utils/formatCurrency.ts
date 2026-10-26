// 金額格式化（全域註冊為 $formatCurrency）
export function formatCurrency(value: number, prefix = 'NT$ '): string {
  return `${prefix}${new Intl.NumberFormat('zh-TW').format(value)}`
}
