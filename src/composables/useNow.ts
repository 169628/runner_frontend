import { onBeforeUnmount, onMounted, ref } from 'vue'

/** 響應式「現在時間」，每 interval 毫秒更新一次 */
export function useNow(interval = 60_000) {
  const now = ref(new Date())
  let timer: ReturnType<typeof setInterval> | undefined

  onMounted(() => {
    timer = setInterval(() => (now.value = new Date()), interval)
  })
  onBeforeUnmount(() => clearInterval(timer))

  return now
}
