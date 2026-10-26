<script setup lang="ts">
import LayoutFooter from '@/layouts/LayoutFooter.vue'
import LayoutHeader from '@/layouts/LayoutHeader.vue'
import LayoutTabBar from '@/layouts/LayoutTabBar.vue'
</script>

<template>
  <div class="flex min-h-screen flex-col bg-bg pb-24 md:pb-0">
    <LayoutHeader />
    <main class="flex-1">
      <RouterView />
    </main>
    <LayoutFooter v-if="!$route.meta.hideFooter" class="hidden md:block" />
    <LayoutTabBar />
  </div>
</template>
