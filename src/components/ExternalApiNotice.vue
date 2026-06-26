<script setup lang="ts">
import { API_BASE_URL, EXTERNAL_API_NOTE } from '../lib/api-config'
</script>

<template>
  <UAlert color="neutral" variant="subtle" icon="i-lucide-plug-zap" class="mb-6">
    <template #title>External API</template>
    <template #description>
      <p class="text-sm text-muted">{{ EXTERNAL_API_NOTE }}</p>
      <p class="text-xs text-muted mt-1.5">
        Endpoint:
        <code class="text-default font-mono">{{ API_BASE_URL }}</code>
        <span class="hidden sm:inline">
          — local dev: set <code class="font-mono">PUBLIC_API_BASE_URL=http://localhost:3000</code> in <code class="font-mono">astro/.env</code>.
        </span>
      </p>
    </template>
  </UAlert>
</template>
