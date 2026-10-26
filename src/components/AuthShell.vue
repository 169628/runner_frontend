<script setup lang="ts">
import LayoutHeader from '@/layouts/LayoutHeader.vue'
</script>

<template>
  <div class="flex min-h-screen flex-col bg-bg">
    <LayoutHeader />
    <main class="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-8 px-5 py-6 lg:flex-row lg:items-stretch lg:gap-16 lg:px-20 lg:py-10">
      <div
        class="relative flex h-[180px] shrink-0 flex-col justify-end overflow-hidden rounded-[20px] bg-cover bg-center p-5 lg:h-auto lg:min-h-[852px] lg:flex-1 lg:rounded-[28px] lg:p-10"
        style="background-image: url('/images/hero-trail.jpg')"
      >
        <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <p class="relative mb-3 hidden font-display text-xs tracking-[2px] text-white/85 lg:block">PACER · RUN FIND REPEAT</p>
        <p class="relative font-heading text-xl leading-snug font-bold text-white lg:text-[34px]">
          找到下一場賽事，<br />也找到適合今天的路線。
        </p>
      </div>
      <section class="flex w-full flex-col justify-center lg:w-[440px] lg:shrink-0">
        <slot />
      </section>
    </main>
  </div>
</template>
