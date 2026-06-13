<!-- FloatInput.vue ── Floating label wrapper for NON-AUTH forms.
     Works with UInput by placing a sibling <label> after it so
     Tailwind peer- utilities target the underlying input element.
-->
<template>
  <UFormGroup :name="name" :required="required" class="group">
    <div class="relative">
      <UInput
        :id="id"
        :model-value="modelValue"
        @update:model-value="$emit('update:modelValue', $event)"
        :type="type"
        placeholder=" "
        :size="size ?? 'xl'"
        :autocomplete="autocomplete"
        :disabled="disabled"
        :required="required"
        class="peer w-full"
        v-bind="uiAttrs"
      >
        <template v-if="$slots.leading" #leading>
          <slot name="leading" />
        </template>
        <template v-if="$slots.trailing" #trailing>
          <slot name="trailing" />
        </template>
      </UInput>

      <!-- Floating label sits ABOVE the input, animating on focus / fill -->
      <label
        :for="id"
        class="absolute left-12 top-1/2 -translate-y-1/2 text-sm text-gray-400 transition-all duration-200 pointer-events-none cursor-text
          peer-focus:top-0 peer-focus:-translate-y-full peer-focus:!text-xs peer-focus:text-primary
          peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-full peer-[:not(:placeholder-shown)]:!text-xs peer-[:not(:placeholder-shown)]:text-gray-500"
      >
        {{ label }}
      </label>
    </div>
  </UFormGroup>
</template>

<script setup lang="ts">
import { useId } from 'vue'

interface Props {
  name         : string
  label        : string
  modelValue  ?: string
  type        ?: string
  size        ?: 'sm' | 'md' | 'lg' | 'xl'
  autocomplete?: string
  required    ?: boolean
  disabled    ?: boolean
  uiAttrs     ?: Record<string, any>
}

withDefaults(defineProps<Props>(), {
  type    : 'text',
  size    : 'xl',
  required: false,
  disabled: false,
})

defineEmits<{
  (e: 'update:modelValue', value: string | undefined): void
}>()

const id = useId()
</script>
