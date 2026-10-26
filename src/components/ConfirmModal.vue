<script setup lang="ts">
import type { Component } from 'vue'
import { TriangleAlert } from 'lucide-vue-next'
import BaseModal from './BaseModal.vue'

withDefaults(
  defineProps<{
    open: boolean
    title: string
    description?: string
    icon?: Component
    confirmLabel?: string
    confirmIcon?: Component
    cancelLabel?: string
    /** danger：紅色確認鈕（刪除）；primary：綠色確認鈕 */
    variant?: 'danger' | 'primary'
    loading?: boolean
  }>(),
  { description: '', icon: () => TriangleAlert, confirmLabel: '確認', confirmIcon: undefined, cancelLabel: '取消', variant: 'danger', loading: false },
)
const emit = defineEmits<{ close: []; confirm: [] }>()
</script>

<template>
  <BaseModal :open="open" @close="emit('close')">
    <div class="flex size-12 items-center justify-center rounded-xl bg-heart-soft text-danger">
      <component :is="icon" class="size-[22px]" />
    </div>
    <h2 class="mt-5 font-heading text-[22px] font-bold text-ink">{{ title }}</h2>
    <p v-if="description" class="mt-2.5 text-sm leading-[1.6] text-text-lo">{{ description }}</p>
    <slot />
    <div class="mt-6 flex justify-end gap-3">
      <button type="button" class="btn btn-outline h-[42px] px-5" @click="emit('close')">{{ cancelLabel }}</button>
      <button
        type="button"
        class="btn h-[42px] px-5"
        :class="variant === 'danger' ? 'btn-danger' : 'btn-primary'"
        :disabled="loading"
        @click="emit('confirm')"
      >
        <component :is="confirmIcon" v-if="confirmIcon" class="size-4" />
        {{ loading ? '處理中…' : confirmLabel }}
      </button>
    </div>
  </BaseModal>
</template>
