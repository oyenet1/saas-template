<script setup lang="ts">
const props = defineProps<{
  confirm: ReturnType<typeof useConfirm>
}>()
</script>

<template>
  <UModal v-model:open="confirm.open.value">
    <template #content>
      <div class="p-6 max-w-sm w-full text-center">
        <div class="mx-auto w-12 h-12 rounded-full bg-error/10 flex items-center justify-center mb-4">
          <UIcon name="i-lucide-alert-triangle" class="w-6 h-6 text-error" />
        </div>
        <h3 class="text-lg font-semibold">{{ confirm.title.value }}</h3>
        <p v-if="confirm.description.value" class="text-sm text-muted mt-2">{{ confirm.description.value }}</p>
        <div class="flex gap-2 pt-5 justify-center">
          <UButton size="xl" color="error" label="Delete" @click="confirm.onConfirm()" />
          <UButton size="xl" color="neutral" variant="outline" label="Cancel" @click="confirm.onCancel()" />
        </div>
      </div>
    </template>
  </UModal>
</template>
