<script setup lang="ts">
import { Activity } from 'lucide-vue-next'

withDefaults(defineProps<{ size?: 'md' | 'sm'; dark?: boolean }>(), { size: 'md', dark: false })
</script>

<template>
  <span class="inline-flex items-center gap-2.5">
    <span class="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent">
      <Activity class="size-[18px] text-white" :stroke-width="2" />
    </span>
    <span
      class="font-display font-medium tracking-[2px]"
      :class="[size === 'md' ? 'text-[26px]' : 'text-[22px]', dark ? 'text-white' : 'text-ink']"
    >
      PACER
    </span>
  </span>
</template>
