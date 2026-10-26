<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { echarts } from '@/chart'

const props = defineProps<{ option: Record<string, unknown> }>()

const el = ref<HTMLDivElement>()
const chart = shallowRef<echarts.ECharts>()
let observer: ResizeObserver | undefined

onMounted(() => {
  chart.value = echarts.init(el.value!)
  chart.value.setOption(props.option)
  observer = new ResizeObserver(() => chart.value?.resize())
  observer.observe(el.value!)
})

watch(() => props.option, (option) => chart.value?.setOption(option, true))

onBeforeUnmount(() => {
  observer?.disconnect()
  chart.value?.dispose()
})
</script>

<template>
  <div ref="el" />
</template>
