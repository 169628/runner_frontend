<script setup lang="ts">
export type BadgeTone = 'accent' | 'warn' | 'danger' | 'muted' | 'sleep'

withDefaults(defineProps<{ tone?: BadgeTone; dot?: boolean }>(), { tone: 'accent', dot: true })

const TONES: Record<BadgeTone, { box: string; dot: string }> = {
  accent: { box: 'bg-accent-soft text-accent', dot: 'bg-accent' },
  warn: { box: 'bg-warn-soft text-warn-ink', dot: 'bg-warn' },
  danger: { box: 'bg-heart-soft text-danger', dot: 'bg-danger' },
  muted: { box: 'bg-surface-2 text-ink-2', dot: 'bg-ink-2' },
  sleep: { box: 'bg-sleep-soft text-sleep-ink', dot: 'bg-sleep-ink' },
}
</script>

<template>
  <span
    class="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap"
    :class="TONES[tone].box"
  >
    <span v-if="dot" class="size-1.5 rounded-full" :class="TONES[tone].dot" />
    <slot />
  </span>
</template>
