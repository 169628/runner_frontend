<script setup lang="ts">
import { SearchX } from 'lucide-vue-next'
import LayoutHeader from '@/layouts/LayoutHeader.vue'
</script>

<template>
  <div class="min-h-screen bg-bg">
    <LayoutHeader />
    <main class="mx-auto flex max-w-[480px] flex-col items-center px-5 py-32 text-center">
      <div class="flex size-14 items-center justify-center rounded-2xl bg-surface-2 text-ink-2">
        <SearchX class="size-6" />
      </div>
      <h1 class="mt-5 font-heading text-2xl font-bold">找不到這個頁面</h1>
      <p class="mt-3 text-sm text-text-lo">網址可能有誤，或頁面已被移除。</p>
      <RouterLink to="/" class="btn btn-primary mt-8 h-[46px] px-7">回到首頁</RouterLink>
    </main>
  </div>
</template>
