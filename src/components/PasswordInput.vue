<script setup lang="ts">
import { ref } from 'vue'
import { Eye, EyeOff, Lock } from 'lucide-vue-next'

defineProps<{ placeholder?: string; error?: boolean; autocomplete?: string }>()
const model = defineModel<string>({ default: '' })
const visible = ref(false)
</script>

<template>
  <label class="input-box" :class="{ 'is-error': error }">
    <Lock class="size-[18px] shrink-0 text-ink-2" />
    <input
      v-model="model"
      :type="visible ? 'text' : 'password'"
      :placeholder="placeholder ?? '••••••••'"
      :autocomplete="autocomplete ?? 'current-password'"
      class="tracking-wide"
    />
    <button
      type="button"
      class="shrink-0 text-ink-2 hover:text-ink"
      :aria-label="visible ? '隱藏密碼' : '顯示密碼'"
      @click="visible = !visible"
    >
      <Eye v-if="visible" class="size-[18px]" />
      <EyeOff v-else class="size-[18px]" />
    </button>
  </label>
</template>
