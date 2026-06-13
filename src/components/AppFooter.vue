<template>
  <footer class="bg-gray-900 text-gray-300 pt-20 pb-10 border-t border-gray-800">
    <div class="container mx-auto px-4 lg:px-8">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-20">
        <!-- Logo & Mission -->
        <div class="space-y-6">
          <NuxtLink to="/" class="flex items-center gap-2 group">
            <AppLogo />
            <span class="text-2xl font-bold tracking-tight text-white">
              Lodge<span class="text-primary">Status</span>
            </span>
          </NuxtLink>
          <p class="text-gray-400 text-base leading-relaxed max-w-xs font-medium">
            Simple, elegant hotel operations software for modern properties.
          </p>
        </div>

        <!-- Quick Links -->
        <div class="lg:pl-8">
          <h4 class="text-white font-bold text-lg mb-8 uppercase tracking-widest flex items-center gap-2">
            Quick Links
            <div class="h-1 w-8 bg-primary rounded-full"></div>
          </h4>
          <ul class="space-y-4 font-medium">
            <li v-for="link in navLinks" :key="link.to">
              <NuxtLink :to="link.to" class="hover:text-primary transition-all hover:pl-2">
                {{ link.label }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Resources -->
        <div>
          <h4 class="text-white font-bold text-lg mb-8 uppercase tracking-widest flex items-center gap-2">
            Hotels
            <div class="h-1 w-8 bg-primary rounded-full"></div>
          </h4>
          <ul class="space-y-4 font-medium text-gray-400">
            <li>
              <NuxtLink to="/search" class="hover:text-white transition-colors">Find a Hotel</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/faq" class="hover:text-white transition-colors">FAQ & Policies</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/contact" class="hover:text-white transition-colors">Support</NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Newsletter -->
        <div class="space-y-6">
          <h4 class="text-white font-bold text-lg mb-8 uppercase tracking-widest flex items-center gap-2">
            Subscribe
            <div class="h-1 w-8 bg-primary rounded-full"></div>
          </h4>
          <p class="text-gray-400 font-medium">
            Get product updates and hospitality tips in your inbox.
          </p>
          <form @submit.prevent="handleSubscribe" class="flex flex-col gap-3">
            <UInput v-model="email" placeholder="Enter your email" type="email"
              class="w-full bg-gray-800/50 border-gray-700/50 h-12" required size="xl" />
            <UButton type="submit" block color="primary" :loading="submitting"
              class="h-12 font-bold shadow-lg shadow-primary/20">Subscribe</UButton>
          </form>
        </div>
      </div>

      <!-- Copyright -->
      <div class="pt-8 border-t border-gray-800/50 flex justify-center items-center text-sm font-medium">
        <p>
          &copy; {{ new Date().getFullYear() }} LodgeStatus. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const navLinks = [
  { label: "Home", to: "/" },
  { label: "Sign In", to: "/sign-in" },
  { label: "Contact", to: "/contact" },
];

const email = ref("");
const submitting = ref(false);
const toast = useToast();

const handleSubscribe = async () => {
  if (!email.value) return;

  submitting.value = true;
  // Stubbed until a newsletter backend is wired up
  try {
    await new Promise((resolve) => setTimeout(resolve, 800));
    toast.add({
      title: "Success",
      description: "Thanks for subscribing!",
      color: "success",
      icon: "i-heroicons-check-circle",
    });
    email.value = "";
  } catch (error: any) {
    toast.add({
      title: "Error",
      description: "Something went wrong. Please try again.",
      color: "error",
      icon: "i-heroicons-exclamation-triangle",
    });
  } finally {
    submitting.value = false;
  }
};
</script>