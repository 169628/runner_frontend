<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{ totalPages: number; size?: 'md' | 'sm' }>(), { size: 'md' })
const page = defineModel<number>({ required: true })

/** 1 2 3 … 8：頭、尾、目前頁前後各一頁 */
const items = computed(() => {
  const total = props.totalPages
  const pages = new Set([1, 2, 3, page.value - 1, page.value, page.value + 1, total])
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const result: (number | '…')[] = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push('…')
    result.push(p)
  })
  return result
})

const go = (p: number) => {
  if (p >= 1 && p <= props.totalPages) page.value = p
}
const box = computed(() =>
  props.size === 'md' ? 'size-10 rounded-full text-sm' : 'h-8 min-w-8 px-2 rounded-lg text-[13px]',
)
</script>

<template>
  <nav class="flex items-center gap-2" aria-label="分頁">
    <button type="button" :class="box" class="border border-line bg-surface text-ink-2 disabled:opacity-40" :disabled="page === 1" @click="go(page - 1)">‹</button>
    <template v-for="(item, i) in items" :key="i">
      <span v-if="item === '…'" class="w-6 text-center text-sm text-text-lo">…</span>
      <button
        v-else
        type="button"
        :class="[box, item === page ? 'bg-ink font-semibold text-white' : 'border border-line bg-surface text-ink']"
        class="font-display"
        @click="go(item)"
      >
        {{ item }}
      </button>
    </template>
    <button type="button" :class="box" class="border border-line bg-surface text-ink-2 disabled:opacity-40" :disabled="page === totalPages" @click="go(page + 1)">›</button>
  </nav>
</template>
