<script setup lang="ts">
import { logout, me } from '../../lib/auth-client'

const props = defineProps<{
  email?: string | null
  name?: string | null
}>()

const open = ref(false)
const user = ref<{ name?: string | null; email: string } | null>(
  props.name || props.email ? { name: props.name ?? null, email: props.email ?? '' } : null,
)

onMounted(async () => {
  if (!user.value) {
    const session = await me()
    if (session) user.value = session
  }
})

async function handleLogout() {
  const res = await logout()
  if (res.success) {
    window.location.assign('/login')
  }
}

function getInitials(): string {
  if (user.value?.name) {
    return user.value.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  }
  return (user.value?.email?.[0]?.toUpperCase() ?? '?')
}
</script>

<template>
  <div class="relative">
    <button
      type="button"
      class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-muted hover:text-default hover:bg-[var(--surface-muted)] transition-colors"
      @click="open = !open"
      @blur="setTimeout(() => open = false, 150)"
    >
      <span class="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
        {{ getInitials() }}
      </span>
      <span class="hidden sm:inline max-w-[120px] truncate">{{ user?.name ?? user?.email ?? 'Account' }}</span>
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0"><path d="m6 9 6 6 6-6"/></svg>
    </button>

    <div v-if="open" class="absolute right-0 top-full mt-1 w-56 rounded-xl border border-[var(--surface-border)] bg-white dark:bg-[var(--surface-elevated)] shadow-lg overflow-hidden">
      <div class="px-4 py-3 border-b border-[var(--surface-border)]">
        <p class="text-sm font-medium truncate">{{ user?.name ?? 'User' }}</p>
        <p class="text-xs text-muted truncate">{{ user?.email }}</p>
      </div>
      <div class="py-1">
        <a href="/dashboard" class="flex items-center gap-2 px-4 py-2 text-sm text-muted hover:text-default hover:bg-[var(--surface-muted)] transition-colors">
          <span class="i-lucide-user size-4 shrink-0" />
          Dashboard
        </a>
        <a href="/dashboard/profile" class="flex items-center gap-2 px-4 py-2 text-sm text-muted hover:text-default hover:bg-[var(--surface-muted)] transition-colors">
          <span class="i-lucide-user-cog size-4 shrink-0" />
          Profile
        </a>
        <a href="/dashboard/settings" class="flex items-center gap-2 px-4 py-2 text-sm text-muted hover:text-default hover:bg-[var(--surface-muted)] transition-colors">
          <span class="i-lucide-settings size-4 shrink-0" />
          Settings
        </a>
      </div>
      <div class="border-t border-[var(--surface-border)] py-1">
        <button
          type="button"
          class="flex items-center gap-2 w-full px-4 py-2 text-sm text-error hover:bg-[var(--surface-muted)] transition-colors"
          @click="handleLogout"
        >
          <span class="i-lucide-log-out size-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </div>
  </div>
</template>
