<script setup lang="ts">
import StatusBadge, { type BadgeTone } from './StatusBadge.vue'
import { STATUS_LABEL } from '@/config/constants'
import type { EventStatus } from '@/types'

defineProps<{ status: EventStatus }>()

const TONE: Record<EventStatus, BadgeTone> = {
  PENDING: 'warn',
  PUBLISHED: 'accent',
  REJECTED: 'danger',
  CLOSED: 'muted',
}
</script>

<template>
  <StatusBadge :tone="TONE[status]">{{ STATUS_LABEL[status] }}</StatusBadge>
</template>
