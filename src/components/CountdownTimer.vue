<template>
  <div class="countdown-root">
    <div class="countdown-grid">
      <div v-for="(unit, index) in units" :key="unit.label" class="countdown-cell">
        <div class="countdown-number-wrap">
          <span class="countdown-number">
            {{ pad(unit.value) }}
          </span>
        </div>
        <div class="countdown-separator" v-if="index < units.length - 1">
          <span class="countdown-sep-colon">:</span>
        </div>
        <span class="countdown-label">{{ unit.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  targetDate?: string | Date
}>()

const pad = (n: number) => String(n).padStart(2, '0')

const defaultTarget = new Date()
defaultTarget.setDate(defaultTarget.getDate() + 7)
defaultTarget.setHours(0, 0, 0, 0)

const target = computed(() => {
  if (props.targetDate) return new Date(props.targetDate)
  return defaultTarget
})

const remaining = ref({ days: 0, hours: 0, minutes: 0, seconds: 0 })

let tickInterval: ReturnType<typeof setInterval> | null = null

const units = computed(() => [
  { label: 'Days', value: remaining.value.days },
  { label: 'Hours', value: remaining.value.hours },
  { label: 'Mins', value: remaining.value.minutes },
  { label: 'Secs', value: remaining.value.seconds },
])

function update() {
  const diff = Math.max(0, target.value.getTime() - Date.now())
  const totalSec = Math.floor(diff / 1000)
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60
  remaining.value = { days, hours, minutes, seconds }
}

onMounted(() => {
  update()
  tickInterval = setInterval(update, 1000)
})

onUnmounted(() => {
  if (tickInterval) clearInterval(tickInterval)
})
</script>

<style scoped>
.countdown-root {
  --cd-gap: clamp(1rem, 3vw, 2.5rem);
  --cd-num-size: clamp(3.5rem, 10vw, 9rem);
  --cd-dot-size: 3px;
  --cd-gold: #c89b3c;
  --cd-bg: rgba(255, 255, 255, 0.03);
  --cd-border: rgba(255, 255, 255, 0.07);
}

.countdown-grid {
  display: flex;
  align-items: center;
  gap: var(--cd-gap);
}

.countdown-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1;
  min-width: 0;
}

.countdown-number-wrap {
  position: relative;
  height: var(--cd-num-size);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  width: 100%;
}

.countdown-number {
  font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: var(--cd-num-size);
  font-weight: 600;
  letter-spacing: -0.04em;
  line-height: 1;
  color: #ffffff;
  text-shadow: 0 0 80px rgba(200, 155, 60, 0.25);
  display: block;
}

.countdown-separator {
  position: absolute;
  right: calc(var(--cd-gap) * -0.55);
  top: calc(var(--cd-num-size) / 2);
  transform: translate(50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
}

.countdown-sep-colon {
  display: block;
  font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: clamp(1.8rem, 4vw, 3rem);
  font-weight: 500;
  color: rgba(200, 155, 60, 0.85);
  line-height: 1;
}

.countdown-label {
  margin-top: 0.75rem;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.4);
}

@media (max-width: 639px) {
  .countdown-grid {
    gap: 0.5rem;
  }

  .countdown-number {
    font-size: clamp(2.2rem, 9vw, 3.5rem);
  }

  .countdown-label {
    font-size: 0.6rem;
    letter-spacing: 0.14em;
    margin-top: 0.4rem;
  }

  .countdown-separator {
    display: none;
  }
}
</style>
