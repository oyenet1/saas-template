<script setup lang="ts">
type FilterOption = { label: string; value: string | number }

export type FilterField = {
  type: 'text' | 'select' | 'date'
  name: string
  label: string
  placeholder?: string
  options?: FilterOption[]
}

const props = defineProps<{
  modelValue: Record<string, any>
  fields: readonly any[]
  columns?: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, any>): void
  (e: 'reset'): void
}>()

const cols = computed(() => {
  if (props.columns) return props.columns
  return Math.min(props.fields.length, 4)
})

function update(name: string, value: any) {
  emit('update:modelValue', { ...props.modelValue, [name]: value })
}

function reset() {
  emit('update:modelValue', {})
  emit('reset')
}

function activeCount() {
  return Object.values(props.modelValue || {}).filter(
    (v) => v !== undefined && v !== null && v !== '',
  ).length
}
</script>

<template>
  <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
    <div class="flex items-center justify-between gap-3 flex-wrap">
      <div class="flex items-center gap-2">
        <UIcon name="i-heroicons-funnel" class="size-4 text-muted" />
        <span class="text-sm font-semibold text-gray-900 dark:text-white">Filters</span>
        <UBadge
          v-if="activeCount() > 0"
          color="primary"
          variant="soft"
          size="xs"
        >
          {{ activeCount() }} active
        </UBadge>
      </div>
      <UButton
        size="xs"
        color="neutral"
        variant="ghost"
        icon="i-heroicons-x-mark"
        @click="reset"
      >
        Clear all
      </UButton>
    </div>

    <div
      class="grid gap-3"
      :style="{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }"
    >
      <template v-for="field in fields" :key="field.name">
        <UFormField :label="field.label" :name="field.name" size="sm">
          <UInput
            v-if="field.type === 'text'"
            :model-value="modelValue[field.name] || ''"
            :placeholder="field.placeholder || `Search ${field.label.toLowerCase()}…`"
            icon="i-heroicons-magnifying-glass"
            size="sm"
            @update:model-value="update(field.name, $event)"
          />
          <USelect
            v-else-if="field.type === 'select'"
            :model-value="modelValue[field.name] || undefined"
            :items="field.options"
            :placeholder="field.placeholder || `Any`"
            size="sm"
            @update:model-value="update(field.name, $event)"
          />
          <UInput
            v-else-if="field.type === 'date'"
            type="date"
            :model-value="modelValue[field.name] || ''"
            size="sm"
            @update:model-value="update(field.name, $event)"
          />
        </UFormField>
      </template>
    </div>

    <slot name="actions" />
  </div>
</template>
