<script setup lang="ts">
import type { NavigationMenuItem, DropdownMenuItem } from "@nuxt/ui";
import type { AssociatedHotel } from '~/stores/auth'
import { useProfileSocket } from '~/composables/useProfileSocket'

const route = useRoute();
const notificationsStore = useNotificationsStore()
const socket = useSocket()

// Reactive mobile detection based on actual screen width (more reliable than UA sniffing)
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)
function updateWidth() {
  windowWidth.value = window.innerWidth
}
const notificationListener = useNotificationListener()
const bookingAlert = useBookingAlert()
const bell = useBell()

function dismissBookingAlert() {
  bell.stopContinuous()
  bookingAlert.dismiss()
}
// Real-time profile invalidation: server pushes `profile:invalidated`
// whenever a hotel's plan / subscription / invoice / status changes
// (payment verified, cron deactivation, renewal invoice created, etc.)
// so the dashboard's plan badge refreshes without a page reload.
const profileSocket = useProfileSocket()
// Personalised `welcome` toast — the server emits a `welcome` event
// from inside its `handshake` handler with the user's first + last
// name and the 👋 icon at the end of the message. We surface that
// as a transient success toast so the user sees realtime is live.
const welcomeListener = useWelcomeListener()
onMounted(() => {
  updateWidth()
  window.addEventListener('resize', updateWidth, { passive: true })
  // Wire every listener BEFORE dialing the socket so the first
  // `connect` / `welcome` event can't sneak in between
  // connect() and setup() and get missed.
  notificationListener.setup()
  welcomeListener.setup()
  profileSocket.start()
  // Now dial. Authenticated dashboard surface = connect allowed.
  socket.connect()
  void notificationsStore.fetchUnreadCount()
})
onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', updateWidth)
  }
  notificationListener.teardown()
  welcomeListener.teardown()
  profileSocket.stop()
  // Drop the realtime connection on leave so unauthenticated
  // pages (sign-in, forgot-password, etc.) never carry a live
  // socket.
  socket.disconnect()
})
onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', updateWidth)
  }
  notificationListener.teardown()
  profileSocket.stop()
  welcomeListener.teardown()
})
onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', updateWidth)
  }
  notificationListener.teardown()
  eventBridge.teardown(eventBridgeUnsub ?? undefined)
  profileSocket.stop()
  // Drop the realtime connection on leave so unauthenticated
  // pages (sign-in, forgot-password, etc.) never carry a live
  // socket.
  socket.disconnect()
})
const isMobile = computed(() => windowWidth.value < 1024)

// Real user data from the auth store
const auth = useAuthStore();
const userName = computed(() => auth.fullName || auth.user?.email || '');
const userEmail = computed(() => auth.user?.email || '');
const userRole = computed(() => auth.user?.currentRole || auth.user?.designation || '');
const userAvatar = computed(() => auth.user?.avatar ?? undefined);
const currentPlanName = computed(() => auth.currentPlan?.name || 'No active plan')
const currentPlanLabel = computed(() => `Package: ${currentPlanName.value}`)

// ── Hotel switcher (header dropdown) ───────────────────────────────────
const fallbackHotel: AssociatedHotel = {
  id: 'none',
  name: 'No active property',
  code: 'N/A',
  logo: null,
  email: null,
  phone: null,
  address: null,
  subdomain: null,
  website: null,
  primaryColor: '#0F766E',
  secondaryColor: null,
  primaryCurrency: null,
  secondaryCurrency: null,
  status: null,
  isCurrent: false,
  location: null,
  latitude: null,
  longitude: null,
  city: null,
  state: null,
  country: null,
  plan: null,
  subscription: null,
  pricing: null,
  discountTiers: null,
}

const hotels = computed<AssociatedHotel[]>(() => auth.associatedHotels)
const selectedHotelId = ref<string | null>(null)
const activeHotel = computed(() => {
  const selectedId = selectedHotelId.value
  if (selectedId) {
    const selected = hotels.value.find(hotel => hotel.id === selectedId)
    if (selected) return selected
  }

  return auth.currentHotel ?? hotels.value[0] ?? fallbackHotel
})

function selectHotel(id: string) {
  selectedHotelId.value = id
}

const hotelSwitcherItems = computed<DropdownMenuItem[][]>(() => [
  hotels.value.map((h) => ({
    label: truncate(h.name, 32),
    description: hotelMeta(h),
    avatar: {
      text: hotelInitials(h.name),
      color: 'primary',
      size: 'sm',
      ui: {
        root: 'rounded-lg font-bold text-white shrink-0',
        fallback: h.id === activeHotel.value.id
          ? 'bg-primary'
          : 'bg-elevated text-default',
      },
    } as any,
    type: h.id === activeHotel.value.id ? ('checkbox' as const) : undefined,
    checked: h.id === activeHotel.value.id,
    onSelect: () => selectHotel(h.id),
  })),
  [
    {
      label: 'Add new hotel',
      icon: 'i-heroicons-plus-circle',
      color: 'primary',
      onSelect: () => navigateTo('/admin/property/hotels/new'),
    },
  ],
])

const headerSwitcherItems = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: userName.value || 'Signed in',
      description: `${userRole.value || 'User'} · ${currentPlanLabel.value}`,
      type: 'label',
    } as any,
  ],
  hotels.value.map((h) => ({
    label: truncate(h.name, 32),
    description: hotelMeta(h),
    avatar: {
      text: hotelInitials(h.name),
      color: 'primary',
      size: 'sm',
      ui: {
        root: 'rounded-lg font-bold text-white shrink-0',
        fallback: h.id === activeHotel.value.id
          ? 'bg-primary'
          : 'bg-elevated text-default',
      },
    } as any,
    type: h.id === activeHotel.value.id ? ('checkbox' as const) : undefined,
    checked: h.id === activeHotel.value.id,
    onSelect: () => selectHotel(h.id),
  })),
  [
    {
      label: 'Manage properties',
      icon: 'i-heroicons-building-office-2',
      onSelect: () => navigateTo('/admin/property/hotels'),
    },
    {
      label: 'Add new property',
      icon: 'i-heroicons-plus-circle',
      color: 'primary',
      onSelect: () => navigateTo('/admin/property/hotels/new'),
    },
  ],
  [
    {
      label: 'Profile',
      icon: 'i-heroicons-user-circle',
      to: '/admin/settings/profile',
    },
    {
      label: 'Settings',
      icon: 'i-heroicons-cog-6-tooth',
      to: '/admin/settings',
    },
    {
      label: 'Sign out',
      icon: 'i-heroicons-arrow-right-on-rectangle',
      color: 'error',
      onSelect: async () => {
        try {
          const res = await auth.logout()
          const msg = res?.message ?? res?.data?.message ?? 'Signed out'
          toast.add({ title: msg, icon: 'i-heroicons-check-circle', color: 'success' })
        } catch (e: any) {
          const msg = e?.data?.message ?? e?.data?.error?.message ?? "We couldn't sign you out. Please try again."
          toast.add({ title: msg, icon: 'i-heroicons-exclamation-triangle', color: 'error' })
        } finally {
          await navigateTo('/sign-in', { replace: true })
        }
      },
    },
  ],
])

const userMenuItems = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: userName.value || 'Signed in',
      description: userRole.value || 'User',
      avatar: {
        src: userAvatar.value,
        alt: userName.value,
      },
      type: 'label',
    } as any,
    {
      label: activeHotel.value.name || 'No active property',
      description: currentPlanLabel.value,
      type: 'label',
    } as any,
  ],
  [
    {
      label: 'Profile',
      icon: 'i-heroicons-user-circle',
      to: '/admin/settings/profile',
    },
    {
      label: 'Settings',
      icon: 'i-heroicons-cog-6-tooth',
      to: '/admin/settings',
    },
  ],
  [
    {
      label: 'Sign out',
      icon: 'i-heroicons-arrow-right-on-rectangle',
      color: 'error',
      onSelect: async () => {
        try {
          const res = await auth.logout()
          const msg = res?.message ?? res?.data?.message ?? 'Signed out'
          toast.add({ title: msg, icon: 'i-heroicons-check-circle', color: 'success' })
        } catch (e: any) {
          const msg = e?.data?.message ?? e?.data?.error?.message ?? "We couldn't sign you out. Please try again."
          toast.add({ title: msg, icon: 'i-heroicons-exclamation-triangle', color: 'error' })
        } finally {
          await navigateTo('/sign-in', { replace: true })
        }
      },
    },
  ],
])

const toast = useToast()

function hotelInitials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function hotelMeta(hotel: AssociatedHotel) {
  const parts = [hotel.code]
  if (hotel.city?.name) {
    parts.push(hotel.city.name)
  }
  if (hotel.plan?.name) {
    parts.push(hotel.plan.name)
  }
  return parts.filter(Boolean).join(' · ')
}

// Truncate hotel name for the dropdown label; the description (code · city)
// stays intact underneath.
function truncate(value: string, max = 32) {
  if (!value) return ''
  return value.length > max ? value.slice(0, max - 1) + '…' : value
}

// ── Mobile bottom nav items ───────────────────────────────────────────
const mobileNavItems = computed(() =>
  getAdminMobileNavigation(route.path, {
    isSuperAdmin: auth.isSuperAdmin,
    isCustomerCare: auth.isCustomerCare,
  }),
)

// ── Notifications ─────────────────────────────────────────────────────
const notificationsOpen = ref(false);
const notificationFilter = ref<'all' | 'unread'>('all');
const unreadCount = computed(() => notificationsStore.unreadCount)

const filteredNotifications = computed(() => {
  if (notificationFilter.value === 'unread') {
    return notificationsStore.items.filter(n => !n.isRead);
  }
  return notificationsStore.items;
});

watch(notificationsOpen, (open) => {
  if (!open) return
  void notificationsStore.fetchInbox()
  void notificationsStore.fetchUnreadCount()
})

function notificationDotClass(severity: string | null) {
  switch (severity) {
    case 'success':
      return 'bg-success'
    case 'warning':
      return 'bg-warning'
    case 'error':
      return 'bg-error'
    default:
      return 'bg-primary'
  }
}

function formatNotificationTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Just now'

  const diffMs = date.getTime() - Date.now()
  const diffMinutes = Math.round(diffMs / 60000)
  const absMinutes = Math.abs(diffMinutes)

  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

  if (absMinutes < 1) return 'Just now'
  if (absMinutes < 60) return formatter.format(diffMinutes, 'minute')

  const diffHours = Math.round(diffMinutes / 60)
  if (Math.abs(diffHours) < 24) return formatter.format(diffHours, 'hour')

  const diffDays = Math.round(diffHours / 24)
  if (Math.abs(diffDays) < 7) return formatter.format(diffDays, 'day')

  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

async function markAsRead(id: string) {
  await notificationsStore.markAsRead(id)
}

async function deleteNotification(id: string) {
  await notificationsStore.deleteNotification(id)
}

async function markAllAsRead() {
  await notificationsStore.markAllAsRead()
}

// ── Sidebar navigation items ──────────────────────────────────────────
const navItems = computed<NavigationMenuItem[][]>(() =>
  getAdminSidebarNavigation(route.path, {
    isSuperAdmin: auth.isSuperAdmin,
    isCustomerCare: auth.isCustomerCare,
  }),
);
</script>

<template>
    <UAlert
      v-if="bookingAlert.alertState.visible"
      :color="bookingAlert.alertState.data?.paymentStatus === 'paid' ? 'success' : 'warning'"
      variant="soft"
      icon="i-heroicons-bell-alert"
      :title="bookingAlert.alertState.data?.title"
      :description="bookingAlert.alertState.data?.body"
      class="fixed top-4 right-4 z-[9999] max-w-sm shadow-xl border border-default"
      :actions="[{
        label: 'View',
        color: 'primary',
        variant: 'solid',
        onClick: () => {
          const url = bookingAlert.alertState.data?.actionUrl
          if (url) navigateTo(url)
          dismissBookingAlert()
        },
      }, {
        label: 'Dismiss',
        color: 'neutral',
        variant: 'ghost',
        onClick: () => dismissBookingAlert(),
      }]"
    />
  <UDashboardGroup unit="%" storage="cookie" storage-key="lodgestatus-dashboard">
    <!-- ── Sidebar (desktop only) ──────────────────────────────────── -->
    <UDashboardSidebar v-if="!isMobile" collapsible resizable :ui="{
      root: 'transition-[width] duration-500 ease-out data-[state=collapsed]:duration-1000',
      header: 'transition-[padding] duration-300 ease-out',
      body: 'transition-[padding] duration-300 ease-out',
      footer: 'transition-[padding] duration-300 ease-out border-t border-default',
    }">
      <template #header="{ collapsed }">
        <UDropdownMenu :items="headerSwitcherItems" :content="{
          align: 'start',
          side: 'bottom',
          sideOffset: 8,
          collisionPadding: 8,
        }" :ui="{
          content: 'w-72 max-h-96 overflow-y-auto',
          label: 'text-sm',
          item: 'text-sm',
        }">
          <button type="button" :class="[
            'group w-full flex items-center gap-2.5 rounded-md px-3 py-1.5 text-left',
            'hover:bg-elevated/60 transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            collapsed ? 'justify-center' : 'justify-start',
          ]" :aria-label="`Switch property — current: ${activeHotel.name}`">
            <div class="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-white font-bold text-lg">
              {{ hotelInitials(activeHotel.name || 'LS') }}
            </div>
            <div v-if="!collapsed" class="leading-tight min-w-0 flex-1">
              <p class="font-semibold text-base truncate">{{ activeHotel.name }}</p>
              <p class="text-[11px] text-muted truncate">{{ hotelMeta(activeHotel) || 'Hotel Operations' }}</p>
            </div>
            <UIcon v-if="!collapsed" name="i-heroicons-chevron-up-down" class="size-4.5 text-muted shrink-0" />
          </button>
        </UDropdownMenu>
      </template>

      <template #default="{ collapsed }">
        <div class="flex flex-col gap-2">
          <div v-for="(group, gi) in navItems" :key="gi" class="space-y-1.5">
            <UNavigationMenu :items="group" orientation="vertical" :collapsed="collapsed" :ui="{
              root: 'gap-1.5',
              link: [
                'px-3 py-2.5 text-sm gap-3 items-center',
                'hover:text-primary hover:before:bg-primary/10',
                'dark:hover:text-primary dark:hover:before:bg-primary/15',
                'data-[active=true]:text-primary data-[active=true]:font-semibold data-[active=true]:before:bg-primary/10',
                'dark:data-[active=true]:before:bg-primary/15',
                'transition-colors before:transition-colors',
                collapsed ? 'justify-center px-1.5' : 'justify-start',
              ],
              linkLeadingIcon: 'size-5.5 shrink-0 hover:text-primary data-[active=true]:text-primary',
              linkLabel: collapsed ? 'hidden' : 'text-sm data-[active=true]:font-semibold',
              linkTrailing: 'ml-auto',
              childList: 'mt-0 gap-y-0',
              childItem: 'py-0',
              childLink: 'px-3 py-0 text-[13px] gap-1.5 items-center hover:text-primary hover:before:bg-primary/10 dark:hover:before:bg-primary/15 data-[active=true]:text-primary data-[active=true]:font-semibold data-[active=true]:before:bg-primary/10 dark:data-[active=true]:before:bg-primary/15 transition-colors before:transition-colors',
              childLinkIcon: 'size-3.5 shrink-0 hover:text-primary data-[active=true]:text-primary',
              list: 'gap-2',
            }" />
            <div v-if="gi < navItems.length - 1" class="mx-3 mt-2 h-px bg-default/20" />
          </div>
        </div>
      </template>

      <template #footer="{ collapsed }">
        <UDropdownMenu :items="userMenuItems" :content="{
          align: 'start',
          side: 'top',
          sideOffset: 8,
          collisionPadding: 8,
        }" :ui="{
          content: 'w-72 max-h-80 overflow-y-auto',
          label: 'text-sm',
          item: 'text-sm',
        }">
          <button type="button" :class="[
            'group w-full flex items-center gap-2.5 rounded-md px-2 py-1.5 text-left',
            'hover:bg-elevated/60 transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            collapsed ? 'justify-center' : 'justify-start',
          ]" :aria-label="`Account menu for ${userName || 'current user'}`">
            <UAvatar :src="userAvatar" :alt="userName || 'User profile'" :text="auth.initials || 'U'" size="lg"
              class="shrink-0 text-white font-bold ring-2 ring-primary/15"
              :style="{ backgroundColor: activeHotel.primaryColor || '#0F766E' }" />

            <div v-if="!collapsed" class="min-w-0 flex-1 leading-tight">
              <p class="truncate text-sm font-semibold">{{ userName || 'Signed in user' }}</p>
              <p class="truncate text-[13px] text-muted font-medium">
                {{ userRole || 'User' }}
              </p>
            </div>

            <UIcon v-if="!collapsed" name="i-heroicons-chevron-up-down" class="size-4.5 text-muted shrink-0" />
          </button>
        </UDropdownMenu>
      </template>
    </UDashboardSidebar>

    <!-- ── Main panel ───────────────────────────────────────────────── -->
    <UDashboardPanel :ui="{ root: 'transition-[width] duration-500 ease-out data-[state=collapsed]:duration-1000' }">
      <template #header>
        <UDashboardNavbar :toggle="!isMobile">
          <template #leading>
            <UDashboardSidebarCollapse v-if="!isMobile" icon="i-heroicons-bars-3" />

            <!-- Mobile hotel switcher (replaces sidebar header on small screens) -->
            <UDropdownMenu v-if="isMobile" :items="headerSwitcherItems" :content="{
              align: 'start',
              side: 'bottom',
              sideOffset: 8,
              collisionPadding: 8,
            }" :ui="{
              content: 'w-80 max-h-96 overflow-y-auto',
              label: 'text-sm',
              item: 'text-sm',
            }">
              <button type="button"
                class="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-elevated/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                :aria-label="`Switch property — current: ${activeHotel.name}`">
                <UAvatar :alt="activeHotel.name" :text="hotelInitials(activeHotel.name)" size="md"
                  class="shrink-0 text-white font-bold"
                  :style="{ backgroundColor: activeHotel.primaryColor || '#0F766E' }" />
                <div class="flex flex-col items-start text-left min-w-0 leading-tight max-w-[140px]">
                  <span class="text-sm font-semibold truncate w-full text-left">
                    {{ activeHotel.name }}
                  </span>
                  <span class="text-[10px] text-muted truncate w-full text-left">
                    {{ activeHotel.code }}<span v-if="activeHotel.city"> · {{ activeHotel.city }}</span>
                  </span>
                </div>
                <UIcon name="i-heroicons-chevron-up-down" class="size-4.5 text-muted shrink-0" />
              </button>
            </UDropdownMenu>
          </template>

          <template #right>
            <!-- Digital clock (desktop only) -->
            <div class="hidden lg:flex items-center pr-2 border-r border-default mr-2">
              <DigitalClock size="sm" alarm-type="bell" alarm-mode="hourly" :volume="1" />
            </div>

            <!-- Color mode toggle -->
            <ColorModeButton />

            <!-- Notification bell with slideover -->
            <USlideover v-model:open="notificationsOpen" title="Notifications" :ui="{
              content: 'w-full sm:max-w-[420px]',
            }">
              <UButton icon="i-heroicons-bell" color="neutral" variant="ghost" size="md" aria-label="Notifications"
                class="relative">
                <UBadge color="error" size="xs"
                  class="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] p-0 flex items-center justify-center text-[10px]">
                  {{ unreadCount }}</UBadge>
              </UButton>

              <template #body>
                <!-- Header: filter tabs + mark all as read -->
                <div class="flex items-center justify-between px-4 py-3 border-b border-default">
                  <div class="flex items-center gap-1">
                    <UButton :color="notificationFilter === 'all' ? 'primary' : 'neutral'"
                      :variant="notificationFilter === 'all' ? 'soft' : 'ghost'" size="xs"
                      @click="notificationFilter = 'all'">
                      All
                    </UButton>
                    <UButton :color="notificationFilter === 'unread' ? 'primary' : 'neutral'"
                      :variant="notificationFilter === 'unread' ? 'soft' : 'ghost'" size="xs"
                      @click="notificationFilter = 'unread'">
                      Unread ({{ unreadCount }})
                    </UButton>
                  </div>
                  <UButton v-if="unreadCount > 0" icon="i-heroicons-check" size="xs" color="neutral" variant="ghost"
                    @click="markAllAsRead">
                    Mark all as read
                  </UButton>
                </div>

                <!-- Notification list -->
                <div class="flex flex-col divide-y divide-default">
                  <div v-if="notificationsStore.loading && filteredNotifications.length === 0"
                    class="flex flex-col gap-3 px-4 py-4">
                    <div v-for="placeholder in 3" :key="placeholder" class="rounded-xl border border-default/60 p-3">
                      <div class="h-4 w-2/3 rounded bg-elevated mb-2" />
                      <div class="h-3 w-full rounded bg-elevated/80 mb-2" />
                      <div class="h-3 w-24 rounded bg-elevated/70" />
                    </div>
                  </div>

                  <div v-for="n in filteredNotifications" :key="n.id"
                    class="group flex items-start gap-3 px-4 py-3 hover:bg-elevated transition-colors"
                    :class="{ 'opacity-60': n.isRead }">
                    <div class="size-2 rounded-full mt-1.5 shrink-0" :class="notificationDotClass(n.severity)" />
                    <div class="min-w-0 flex-1">
                      <p class="text-sm font-medium">{{ n.title }}</p>
                      <p class="text-xs text-muted mt-0.5">{{ n.body || 'No extra details provided.' }}</p>
                      <p class="text-[11px] text-muted mt-1">{{ formatNotificationTime(n.createdAt) }}</p>
                    </div>

                    <!-- Three-dot menu -->
                    <UDropdownMenu :items="[
                      [
                        {
                          label: 'Mark as read',
                          icon: 'i-heroicons-check-circle',
                          disabled: n.isRead,
                          onSelect: () => markAsRead(n.id),
                        },
                        {
                          label: 'Delete',
                          icon: 'i-heroicons-trash',
                          color: 'error',
                          onSelect: () => deleteNotification(n.id),
                        },
                      ],
                    ]" :content="{ align: 'end', side: 'bottom', sideOffset: 4 }">
                      <UButton icon="i-heroicons-ellipsis-horizontal" color="neutral" variant="ghost" size="xs"
                        class="shrink-0 opacity-0 group-hover:opacity-100" @click.stop />
                    </UDropdownMenu>
                  </div>

                  <!-- Empty state -->
                  <div v-if="!notificationsStore.loading && filteredNotifications.length === 0"
                    class="flex flex-col items-center justify-center py-12 text-muted">
                    <UIcon name="i-heroicons-bell-slash" class="size-10 mb-3" />
                    <p class="text-sm">No {{ notificationFilter === 'unread' ? 'unread ' : '' }}notifications</p>
                  </div>
                </div>
              </template>
            </USlideover>

            <!-- User dropdown removed — user info + sign out are now in the hotel switcher -->
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <div :class="[isMobile ? 'p-4 pb-24' : 'p-6']">
          <slot />
        </div>
      </template>
    </UDashboardPanel>

    <!-- ── Mobile bottom nav ────────────────────────────────────────── -->
    <nav v-if="isMobile"
      class="fixed bottom-0 inset-x-0 z-50 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-t border-default shadow-lg shadow-gray-900/5 dark:shadow-black/30">
      <ul class="grid grid-cols-4">
        <li v-for="item in mobileNavItems" :key="item.to">
          <NuxtLink :to="item.to"
            class="group flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors" :class="item.active
              ? 'text-primary'
              : 'text-muted hover:text-default'">
            <span class="flex items-center justify-center size-12 rounded-2xl transition-all" :class="item.active
              ? 'bg-primary/10'
              : 'group-hover:bg-elevated/60'">
              <UIcon :name="item.icon" class="size-7" />
            </span>
            <span class="text-[11px] font-medium leading-none mt-0.5" :class="item.active ? 'font-semibold' : ''">
              {{ item.label }}
            </span>
          </NuxtLink>
        </li>
      </ul>
    </nav>
  </UDashboardGroup>
</template>
