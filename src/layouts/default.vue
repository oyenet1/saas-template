<template>
  <div class="min-h-screen flex flex-col font-sans selection:bg-primary/30 selection:text-primary">
    <AppHeader />

    <main class="flex-grow">
      <slot />
    </main>

    <AppFooter />
  </div>
</template>

<style>
/* Smooth Scroll */
html {
  scroll-behavior: smooth;
}

/* Page Transitions */
.page-enter-active,
.page-leave-active {
  transition: all 0.2s;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>