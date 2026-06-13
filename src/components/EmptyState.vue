<template>
  <div class="rounded-xl border border-dashed border-default bg-elevated/50 overflow-hidden">
    <div class="flex items-center justify-between px-6 py-4 border-b border-default sm:px-10">
      <h2 class="text-lg font-semibold text-default sm:text-xl">
        {{ title }}
      </h2>
    </div>
    <div class="flex flex-col items-center justify-center px-6 py-10 text-center sm:px-10 sm:py-14">
      <div
        class="mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:size-20 sm:rounded-2xl"
      >
        <UIcon :name="icon" class="size-8 sm:size-10" />
      </div>
      <p class="mb-6 max-w-xs text-sm text-muted sm:max-w-sm">
        {{ description }}
      </p>
      <UButton
        v-if="actionLabel"
        :label="actionLabel"
        :icon="actionIcon"
        color="primary"
        size="md"
        @click="$emit('action')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string
  description?: string
  icon?: string
  actionLabel?: string
  actionIcon?: string
}

withDefaults(defineProps<Props>(), {
  title: 'Items',
  description: 'Add one to get started.',
  icon: 'i-heroicons-inbox',
  actionLabel: '',
  actionIcon: 'i-heroicons-plus',
})

defineEmits<{
  (e: 'action'): void
}>()
</script>