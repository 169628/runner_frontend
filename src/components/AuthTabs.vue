<script setup lang="ts">
defineProps<{ active: 'login' | 'signup' }>()
</script>

<template>
  <div class="grid grid-cols-2 rounded-full bg-surface-2 p-1">
    <RouterLink
      v-for="tab in [{ key: 'login', label: '登入' }, { key: 'signup', label: '註冊' }] as const"
      :key="tab.key"
      :to="{ name: tab.key, query: $route.query }"
      class="flex h-[42px] items-center justify-center rounded-full text-[15px] transition-colors"
      :class="active === tab.key ? 'bg-accent font-bold text-white' : 'text-ink-2 hover:text-ink'"
      replace
    >
      {{ tab.label }}
    </RouterLink>
  </div>
</template>
