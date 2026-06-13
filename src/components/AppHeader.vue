<template>
  <header
    class="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md"
  >
    <div class="container mx-auto px-4 lg:px-8">
      <div class="flex h-20 items-center justify-between">
        <NuxtLink to="/" class="flex items-center gap-2 group shrink-0">
          <AppLogo />
          <span
            class="text-xl font-bold tracking-tight text-gray-900 group-hover:text-primary transition-colors"
          >
            My<span class="text-primary">Room</span>Status
          </span>
        </NuxtLink>

        <!-- Desktop Navigation & Action -->
        <div class="hidden md:flex items-center gap-10">
          <nav class="flex items-center gap-8">
            <NuxtLink
              v-for="link in navLinks"
              :key="link.to"
              :to="link.to"
              class="text-sm font-bold text-gray-600 hover:text-primary transition-colors relative"
              active-class="text-primary after:absolute after:bottom-[-2px] after:left-0 after:w-full after:h-0.5 after:bg-primary"
            >
              {{ link.label }}
            </NuxtLink>
          </nav>

          <UButton
            to="/sign-in"
            color="primary"
            size="lg"
            class="px-8 rounded-full font-bold shadow-md hover:shadow-lg transition-all"
          >
            Sign In
          </UButton>
        </div>

        <!-- Mobile Menu Trigger -->
        <UButton
          icon="i-heroicons-bars-3-bottom-right"
          variant="ghost"
          color="neutral"
          class="md:hidden"
          @click="isMobileMenuOpen = true"
        />
      </div>
    </div>

    <!-- Mobile Menu Overlay -->
    <USlideover v-model:open="isMobileMenuOpen">
      <template #content>
        <div class="p-6 h-full flex flex-col">
          <div class="flex items-center justify-between mb-8">
            <span class="text-xl font-bold tracking-tight text-gray-900">
              Menu
            </span>
            <UButton
              icon="i-heroicons-x-mark"
              variant="ghost"
              color="neutral"
              @click="isMobileMenuOpen = false"
            />
          </div>

          <nav class="flex flex-col gap-6 flex-1">
            <NuxtLink
              v-for="link in navLinks"
              :key="link.to"
              :to="link.to"
              class="text-lg font-semibold text-gray-700 hover:text-primary transition-colors"
              active-class="text-primary"
              @click="isMobileMenuOpen = false"
            >
              {{ link.label }}
            </NuxtLink>
          </nav>

          <UButton
            to="/sign-in"
            color="primary"
            size="xl"
            block
            class="mt-auto font-bold rounded-xl"
            @click="isMobileMenuOpen = false"
          >
            Sign In
          </UButton>
        </div>
      </template>
    </USlideover>
  </header>
</template>

<script setup lang="ts">
const isMobileMenuOpen = ref(false);

const navLinks = [
  { label: "Hotels", to: "/search" },
  { label: "About", to: "/about" },
  { label: "FAQ", to: "/faq" },
  { label: "Contact", to: "/contact" },
];
</script>
