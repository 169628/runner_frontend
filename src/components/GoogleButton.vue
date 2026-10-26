<script setup lang="ts">
import GoogleIcon from './GoogleIcon.vue'

defineProps<{ label: string; loading?: boolean }>()
defineEmits<{ click: [] }>()
</script>

<template>
  <button type="button" class="btn btn-outline h-[52px] w-full text-[15px]" :disabled="loading" @click="$emit('click')">
    <GoogleIcon class="size-[18px] text-[#4285F4]" />
    {{ loading ? '前往 Google…' : label }}
  </button>
</template>
