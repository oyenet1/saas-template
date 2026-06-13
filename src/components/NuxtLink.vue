<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<{
  to?: RouteLocationRaw
  href?: string
  replace?: boolean
}>(), {
  to: undefined,
  href: undefined,
  replace: false,
})
</script>

<template>
  <RouterLink
    v-if="props.to"
    :to="props.to"
    :replace="props.replace"
    v-bind="$attrs"
  >
    <slot />
  </RouterLink>

  <a
    v-else
    :href="props.href"
    v-bind="$attrs"
  >
    <slot />
  </a>
</template>
