<script setup lang="ts" generic="T extends string">
import type { Component } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

withDefaults(
  defineProps<{
    options: { value: T; label: string }[]
    placeholder?: string
    icon?: Component
    error?: boolean
    disabled?: boolean
    size?: 'md' | 'sm'
  }>(),
  { placeholder: '', icon: undefined, error: false, disabled: false, size: 'md' },
)
const model = defineModel<T | ''>({ default: '' })
</script>

<template>
  <label
    class="input-box relative"
    :class="[{ 'is-error': error, 'opacity-60': disabled }, size === 'sm' ? 'h-[42px] px-3.5 text-sm' : '']"
  >
    <component :is="icon" v-if="icon" class="size-[18px] shrink-0 text-ink-2" />
    <select v-model="model" :disabled="disabled" class="appearance-none pr-6" :class="{ 'text-text-lo': !model }">
      <option v-if="placeholder" value="">{{ placeholder }}</option>
      <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
    </select>
    <ChevronDown class="pointer-events-none absolute right-4 size-4 text-ink-2" />
  </label>
</template>
