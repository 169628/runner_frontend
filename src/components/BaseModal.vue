<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'

const props = withDefaults(defineProps<{ open: boolean; width?: string }>(), { width: 'max-w-[440px]' })
const emit = defineEmits<{ close: [] }>()

const onKey = (e: KeyboardEvent) => e.key === 'Escape' && emit('close')

watch(
  () => props.open,
  (open) => {
    document.body.style.overflow = open ? 'hidden' : ''
    if (open) window.addEventListener('keydown', onKey)
    else window.removeEventListener('keydown', onKey)
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  window.removeEventListener('keydown', onKey)
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150"
      enter-from-class="opacity-0"
      leave-active-class="transition duration-100"
      leave-to-class="opacity-0"
    >
      <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-[#2F2B28]/45 p-4" @click.self="emit('close')">
        <div
          role="dialog"
          aria-modal="true"
          class="w-full rounded-3xl bg-surface p-8 shadow-[0_24px_48px_-16px_rgba(47,43,40,0.35)]"
          :class="width"
        >
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
