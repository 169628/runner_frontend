<script setup lang="ts" generic="T extends string">
import { ChevronDown } from 'lucide-vue-next'

// 後台篩選用的小型下拉：「分類：全部」
defineProps<{ label: string; options: { value: T; label: string }[] }>()
const model = defineModel<T | ''>({ default: '' })
</script>

<template>
  <label class="relative flex h-11 shrink-0 items-center rounded-xl border border-line bg-surface pr-9 pl-3.5 text-sm text-ink">
    <span class="pointer-events-none whitespace-nowrap">{{ label }}：{{ options.find((o) => o.value === model)?.label ?? '全部' }}</span>
    <select v-model="model" class="absolute inset-0 cursor-pointer opacity-0" :aria-label="label">
      <option value="">全部</option>
      <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
    </select>
    <ChevronDown class="pointer-events-none absolute right-3 size-4 text-ink-2" />
  </label>
</template>
