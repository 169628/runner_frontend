<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, ExternalLink } from 'lucide-vue-next'
import MapCanvas from '@/components/MapCanvas.vue'
import { useRouteSearchStore } from '@/stores/routeSearch'

const route = useRoute()
const store = useRouteSearchStore()

const data = computed(() => store.findRoute(String(route.params.routeId)))
const origin = computed(() => store.result?.origin)
</script>

<template>
  <div class="mx-auto max-w-[1440px] px-5 pt-5 pb-14 lg:px-20 lg:pt-7 lg:pb-20">
    <RouterLink to="/routes" class="flex items-center gap-2 text-[13px] text-text-lo hover:text-ink">
      <ArrowLeft class="size-4" />推薦結果<template v-if="origin">（{{ origin.district }}）</template>
    </RouterLink>

    <div v-if="!data" class="card mt-6 px-6 py-20 text-center">
      <h1 class="font-heading text-2xl font-bold">這條路線已不在推薦結果中</h1>
      <p class="mt-3 text-sm text-text-lo">路線是即時蒐集的，請回到路線推薦重新搜尋。</p>
      <RouterLink to="/routes" class="btn btn-primary mt-6 h-11 px-6">回到路線推薦</RouterLink>
    </div>

    <template v-else>
      <div class="mt-5 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <h1 class="font-heading text-[30px] font-bold text-ink lg:text-[44px]">{{ data.name }}</h1>
        <dl class="flex lg:divide-x lg:divide-line">
          <div class="flex-1 pr-5 lg:flex-none lg:px-7">
            <dt class="text-xs text-text-lo">距離</dt>
            <dd class="mt-1"><span class="font-display text-[28px] font-medium">{{ data.distanceKm }}</span> <span class="text-[13px] text-text-lo">km</span></dd>
          </div>
          <div class="flex-1 border-l border-line px-5 lg:flex-none lg:px-7">
            <dt class="text-xs text-text-lo">地區</dt>
            <dd class="mt-2"><span class="text-lg font-bold">{{ data.county }}</span> <span class="text-[13px] text-text-lo">{{ data.district }}</span></dd>
          </div>
          <div class="flex-1 border-l border-line pl-5 lg:flex-none lg:pr-0 lg:pl-7">
            <dt class="text-xs text-text-lo">路面</dt>
            <dd class="mt-2"><span class="text-lg font-bold">{{ data.surface[0] }}</span> <span class="text-[13px] text-text-lo">{{ data.surface.slice(1).join('、') }}</span></dd>
          </div>
        </dl>
      </div>

      <div class="mt-8 flex flex-col gap-8 lg:flex-row lg:gap-10">
        <MapCanvas class="h-[320px] lg:h-[640px] lg:w-[780px] lg:shrink-0" :route="data" show-labels />

        <div class="flex min-w-0 flex-1 flex-col">
          <div class="h-[240px] rounded-[20px] bg-cover bg-center" :style="{ backgroundImage: `url(${data.coverUrl})` }" />
          <h2 class="mt-9 font-heading text-[22px] font-bold text-ink">風景介紹</h2>
          <p class="mt-4 text-[15px] leading-[1.9] text-ink-2">{{ data.description }}</p>
          <p class="mt-4 flex items-center gap-1.5 text-[13px] text-text-lo">
            路線資料來源：{{ data.source.name }}
            <a :href="data.source.url" target="_blank" rel="noopener noreferrer" class="ml-1.5 inline-flex items-center gap-1 font-bold text-accent hover:underline">
              查看原始頁面 <ExternalLink class="size-3.5" />
            </a>
          </p>

          <ul class="card mt-6 px-5">
            <li class="flex items-center gap-4 py-5">
              <span class="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">起</span>
              <div>
                <p class="text-xs text-text-lo">起點</p>
                <p class="mt-1 text-[15px] font-bold">{{ data.start.name }} · {{ data.start.note }}</p>
              </div>
            </li>
            <li class="flex items-center gap-4 border-t border-line py-5">
              <span class="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">終</span>
              <div>
                <p class="text-xs text-text-lo">終點</p>
                <p class="mt-1 text-[15px] font-bold">{{ data.loop ? '與起點相同' : `${data.end.name} · ${data.end.note}` }}</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </template>
  </div>
</template>
