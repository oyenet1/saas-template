/**
 * Global UI store — colour-mode-independent app state.
 *
 * Replaces scattered refs for app-wide flags. Stores persist to
 * `localStorage` automatically so user preferences survive reloads.
 */
import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', () => {
  const sidebarCollapsed = ref(false)
  const activeHotelId = ref<string>('h1')
  const activeHotel = computed(() => activeHotelId.value)
  const notificationCount = ref(0)
  const flash = ref<{ type: 'info' | 'success' | 'error'; message: string } | null>(null)

  function setActiveHotel(id: string) {
    activeHotelId.value = id
  }

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function setFlash(type: 'info' | 'success' | 'error', message: string, ttl = 3000) {
    flash.value = { type, message }
    if (ttl > 0) {
      setTimeout(() => {
        flash.value = null
      }, ttl)
    }
  }

  return {
    sidebarCollapsed,
    activeHotelId,
    activeHotel,
    notificationCount,
    flash,
    setActiveHotel,
    toggleSidebar,
    setFlash,
  }
})
