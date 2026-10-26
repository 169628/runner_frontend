<script setup lang="ts">
defineProps<{ crumbs: { label: string; to?: string }[]; title: string }>()
</script>

<template>
  <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div class="min-w-0">
      <nav class="text-xs text-text-lo">
        <template v-for="(c, i) in crumbs" :key="c.label">
          <RouterLink v-if="c.to" :to="c.to" class="hover:text-ink">{{ c.label }}</RouterLink>
          <span v-else>{{ c.label }}</span>
          <span v-if="i < crumbs.length - 1"> / </span>
        </template>
      </nav>
      <div class="mt-2.5 flex flex-wrap items-center gap-3">
        <h1 class="font-heading text-[30px] font-bold text-ink">{{ title }}</h1>
        <slot name="badge" />
      </div>
    </div>
    <div class="flex shrink-0 gap-3"><slot name="actions" /></div>
  </div>
</template>
