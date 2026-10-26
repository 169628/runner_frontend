<script setup lang="ts">
import { SOURCE_LABEL } from '@/config/constants'
import type { EventSource } from '@/types'

defineProps<{ source: EventSource }>()
</script>

<template>
  <span
    class="inline-flex shrink-0 rounded-md px-2 py-1 text-xs font-semibold whitespace-nowrap"
    :class="source === 'SCHEDULED_CRAWL' ? 'bg-sleep-soft text-sleep-ink' : 'bg-surface-2 text-ink-2'"
  >
    {{ SOURCE_LABEL[source] }}
  </span>
</template>
