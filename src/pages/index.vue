<template>
  <div class="launch-page">
    <!-- Ambient background -->
    <div class="launch-ambient" aria-hidden="true">
      <div class="launch-orb launch-orb--gold" />
      <div class="launch-orb launch-orb--blue" />
      <div class="launch-orb launch-orb--subtle" />
      <div class="launch-grid-overlay" />
    </div>

    <div v-if="mounted" class="launch-page-inner">
    <!-- Eyebrow -->
    <div class="launch-eyebrow">
      <span class="launch-eyebrow-line" />
      <span class="launch-eyebrow-text">Launching Sunday, June 21 at 12:00 PM</span>
      <span class="launch-eyebrow-line" />
    </div>

    <!-- Headline -->
    <h1 class="launch-headline">
      <span class="launch-headline-word">Sl Apartments</span>
      <br />
      <span class="launch-headline-word launch-headline-word--accent">is almost here</span>
    </h1>

    <!-- Subheadline -->
    <p class="launch-subhead">
      A refined new stay experience is on the way.
      <br class="hidden sm:block" />
      Doors open on June 21 by noon.
    </p>

    <!-- Countdown -->
    <div class="launch-countdown-wrapper">
      <CountdownTimer :target-date="launchDate" />
    </div>

    <!-- Trust strip -->
    <div class="launch-trust">
      <div class="launch-trust-item">
        <span class="launch-trust-value">June 21</span>
        <span class="launch-trust-label">Launch Day</span>
      </div>
      <div class="launch-trust-divider" />
      <div class="launch-trust-item">
        <span class="launch-trust-value">12:00 PM</span>
        <span class="launch-trust-label">Opening Time</span>
      </div>
      <div class="launch-trust-divider" />
      <div class="launch-trust-item">
        <span class="launch-trust-value">Lagos</span>
        <span class="launch-trust-label">Timezone</span>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'launch',
})

const launchDate = new Date(Date.UTC(2026, 6, 28, 0, 0, 0)).toISOString()
const mounted = ref(false)

onMounted(() => {
  mounted.value = true
})
</script>

<style scoped>
.launch-page {
  position: relative;
  min-height: 100dvh;
  background: #08090c;
  color: #f4f7fb;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, Inter, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  padding: 2rem 1.5rem;
}

/* ─── Ambient Background ─────────────────────── */

.launch-ambient {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.launch-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.12;
}

.launch-orb--gold {
  width: 700px;
  height: 700px;
  background: radial-gradient(circle at center, #c89b3c 0%, transparent 70%);
  top: -200px;
  left: 50%;
  transform: translateX(-50%);
  animation: orb-float 14s ease-in-out infinite;
}

.launch-orb--blue {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle at center, #4f79a8 0%, transparent 70%);
  bottom: -150px;
  right: -100px;
  animation: orb-float 18s ease-in-out infinite reverse;
}

.launch-orb--subtle {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle at center, #1e293b 0%, transparent 70%);
  top: 50%;
  left: -100px;
  animation: orb-float 20s ease-in-out infinite;
}

.launch-grid-overlay {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.018) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.018) 1px, transparent 1px);
  background-size: 64px 64px;
  mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%);
}

@keyframes orb-float {
  0%   { transform: translate(0, 0) scale(1); }
  33%  { transform: translate(30px, -20px) scale(1.05); }
  66%  { transform: translate(-20px, 15px) scale(0.95); }
  100% { transform: translate(0, 0) scale(1); }
}

/* ─── Content ──────────────────────────────── */

.launch-content {
  position: relative;
  z-index: 10;
  max-width: 56rem;
  width: 100%;
  margin: 0 auto;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2.5rem;
  animation: fade-up 800ms var(--ease-out-expo, cubic-bezier(0.19, 1, 0.22, 1)) both;
}

/* ─── Eyebrow ──────────────────────────────── */

.launch-eyebrow {
  display: flex;
  align-items: center;
  gap: 1rem;
  animation: fade-up 800ms var(--ease-out-expo, cubic-bezier(0.19, 1, 0.22, 1)) both;
  animation-delay: 100ms;
}

.launch-eyebrow-line {
  display: block;
  width: 2.5rem;
  height: 1px;
  background: linear-gradient(90deg, transparent, #c89b3c);
}

.launch-eyebrow-line:last-child {
  background: linear-gradient(90deg, #c89b3c, transparent);
}

.launch-eyebrow-text {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #c89b3c;
}

/* ─── Headline ─────────────────────────────── */

.launch-headline {
  font-size: clamp(2.8rem, 7vw, 5.5rem);
  font-weight: 600;
  line-height: 1.05;
  letter-spacing: -0.03em;
  color: #f4f7fb;
  animation: fade-up 800ms var(--ease-out-expo, cubic-bezier(0.19, 1, 0.22, 1)) both;
  animation-delay: 200ms;
}

.launch-headline-word {
  display: block;
}

.launch-headline-word--accent {
  background: linear-gradient(135deg, #c89b3c 0%, #e8c97a 50%, #c89b3c 100%);
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shimmer-text 6s linear infinite;
}

@keyframes shimmer-text {
  0%   { background-position: 100% center; }
  100% { background-position: -100% center; }
}

/* ─── Subheadline ──────────────────────────── */

.launch-subhead {
  font-size: clamp(1rem, 2vw, 1.2rem);
  line-height: 1.7;
  color: rgba(244, 247, 251, 0.5);
  max-width: 32rem;
  font-weight: 400;
  animation: fade-up 800ms var(--ease-out-expo, cubic-bezier(0.19, 1, 0.22, 1)) both;
  animation-delay: 300ms;
}

/* ─── Countdown ────────────────────────────── */

.launch-countdown-wrapper {
  margin: 1rem 0 2rem;
  animation: fade-up 800ms var(--ease-out-expo, cubic-bezier(0.19, 1, 0.22, 1)) both;
  animation-delay: 400ms;
  width: 100%;
}

/* ─── Trust Strip ──────────────────────────── */

.launch-trust {
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-top: 1.5rem;
  animation: fade-up 800ms var(--ease-out-expo, cubic-bezier(0.19, 1, 0.22, 1)) both;
  animation-delay: 600ms;
}

.launch-trust-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.launch-trust-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #f4f7fb;
  letter-spacing: -0.02em;
}

.launch-trust-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: rgba(244, 247, 251, 0.35);
  font-weight: 500;
}

.launch-trust-divider {
  width: 1px;
  height: 2rem;
  background: rgba(255, 255, 255, 0.1);
}

/* ─── Keyframes ────────────────────────────── */

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translate3d(0, 16px, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

/* ─── Mobile ───────────────────────────────── */

@media (max-width: 639px) {
  .launch-content {
    gap: 1.75rem;
  }

  .launch-trust {
    gap: 1rem;
  }

  .launch-trust-value {
    font-size: 0.95rem;
  }

  .launch-trust-label {
    font-size: 0.65rem;
  }

  .launch-trust-divider {
    display: none;
  }
}

@media (min-width: 640px) and (max-width: 1023px) {
  .launch-countdown-wrapper {
    max-width: 36rem;
  }
}
</style>
