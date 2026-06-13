<template>
  <div class="h-screen flex bg-white dark:bg-gray-950">
    <!-- LEFT: brand + pitch (desktop half) -->
    <div class="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary">
      <div class="absolute inset-0 bg-gradient-to-br from-primary to-teal-800" />
      <div class="absolute inset-0 opacity-10"
        style="background-image: radial-gradient(circle at 2px 2px, white 1px, transparent 0); background-size: 32px 32px;"
      />
      <div class="relative z-10 flex flex-col justify-between h-full p-16 xl:p-24 2xl:p-32 text-white">
        <div>
          <div class="flex items-center gap-3 mb-14">
            <div class="size-10 rounded-lg bg-white/20 grid place-items-center font-bold text-lg">M</div>
            <span class="font-bold text-2xl tracking-tight">LodgeStatus</span>
          </div>
          <h2 class="text-3xl lg:text-4xl xl:text-5xl font-bold leading-[1.1] mb-6 max-w-md">
            The easiest way to run your hotel
          </h2>
          <p class="text-white/80 text-lg leading-relaxed mb-12 max-w-sm xl:max-w-md">
            Front-desk, bookings, rooms, payments, reports, and housekeeping — unified in one calm, fast interface.
          </p>
          <div class="space-y-4">
            <div v-for="item in perks" :key="item" class="flex items-center gap-3">
              <div class="size-6 rounded-full border border-white/30 bg-white/10 grid place-items-center shrink-0">
                <UIcon name="i-heroicons-check" class="size-3.5" />
              </div>
              <span class="text-sm text-white/90 font-medium">{{ item }}</span>
            </div>
          </div>
        </div>
        <div class="text-xs text-white/50">© {{ new Date().getFullYear() }} LodgeStatus</div>
      </div>
    </div>

    <!-- RIGHT: auth form (half desktop, full mobile) -->
    <div class="relative w-full lg:w-1/2 flex flex-col bg-white dark:bg-gray-950 overflow-hidden">
      <div class="absolute right-6 top-6 z-20 sm:right-8 sm:top-8">
        <ClientOnly>
          <UColorModeButton
            color="neutral"
            variant="ghost"
          />
          <template #fallback>
            <div class="size-9" />
          </template>
        </ClientOnly>
      </div>

      <div
        class="flex-1 flex justify-center items-center min-h-0"
        :class="isRegistrationPage ? 'px-6 py-8 sm:px-10 lg:px-12 xl:px-16' : 'px-6 py-8 sm:px-16'"
      >
        <div
          class="h-full w-full flex flex-col justify-center"
          :class="isRegistrationPage ? 'max-w-md sm:max-w-lg xl:max-w-xl' : 'max-w-md'"
        >
          <!-- mobile brand header -->
          <div class="lg:hidden flex items-center gap-2 mb-8 shrink-0">
            <div class="size-8 rounded-lg bg-primary text-white grid place-items-center font-bold">M</div>
            <span class="font-bold text-lg">LodgeStatus</span>
          </div>

          <div
            class="relative w-full overflow-y-auto bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xl shadow-gray-900/5 dark:shadow-black/20 max-h-full"
            :style="isRegistrationPage ? 'max-height: 86%;' : undefined"
            :class="isRegistrationPage ? 'p-8 sm:p-10 xl:p-12' : 'p-8 sm:p-10'"
          >
            <slot />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const isRegistrationPage = computed(() => route.path === '/sign-up')

const perks = [
  'Real-time room availability calendar',
  'Never miss an order or booking with in-app notification alarms',
  'One-click check-in / check-out',
  'Integrated POS & invoicing',
  'Automated housekeeping schedules',
  'Revenue analytics & nightly reports'
]
</script>
