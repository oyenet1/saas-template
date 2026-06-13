<template>
  <div
    :class="[
      'inline-flex select-none font-mono tabular-nums',
      'px-4 py-2 rounded-md',
      'bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm',
      'border border-gray-200/70 dark:border-gray-700/70',
      'shadow-sm shadow-gray-900/5 dark:shadow-black/20',
      orientation === 'horizontal' ? 'flex-row items-baseline gap-3' : 'flex-col items-center gap-1.5',
    ]"
  >
    <span
      v-if="showDate"
      :class="[
        'font-semibold text-gray-600 dark:text-gray-300 tracking-wide',
        size === 'sm' && 'text-xs',
        size === 'md' && 'text-sm',
        size === 'lg' && 'text-base',
        size === 'xl' && 'text-lg',
      ]"
    >
      {{ formattedDate }}
    </span>

    <div class="flex items-baseline gap-1">
      <span
        class="font-mono font-bold text-gray-900 dark:text-white"
        :class="[
          size === 'sm' && 'text-sm',
          size === 'md' && 'text-base',
          size === 'lg' && 'text-3xl',
          size === 'xl' && 'text-5xl',
        ]"
      >
        {{ formattedTime.hours }}:{{ formattedTime.minutes }}:{{ formattedTime.seconds }}
      </span>
      <span
        class="ml-1 font-mono text-primary font-semibold tracking-wider"
        :class="[
          size === 'sm' && 'text-xs',
          size === 'md' && 'text-sm',
          size === 'lg' && 'text-base',
          size === 'xl' && 'text-lg',
        ]"
      >
        {{ formattedTime.meridiem }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSound } from '@vueuse/sound'
import { useBell } from '~/composables/useBell'

type ClockSize = 'sm' | 'md' | 'lg' | 'xl'
type ClockOrientation = 'horizontal' | 'vertical'
type AlarmMode = 'match' | 'hourly' | 'every-15' | 'every-30' | 'every-minute'

const props = withDefaults(
  defineProps<{
    showDate?: boolean
    size?: ClockSize
    orientation?: ClockOrientation
    /**
     * How to play the alarm sound:
     *  - `'bell'`  : synthesized loud bell via Web Audio API (no file needed)
     *  - `'url'`   : play a custom audio file from `soundSrc`
     *  - `'none'`  : silent
     * @default 'bell'
     */
    alarmType?: 'bell' | 'url' | 'none'
    /**
     * URL to an audio file when `alarmType="url"`.
     */
    soundSrc?: string
    /**
     * When to play the sound:
     *  - `match`         : only when the current time matches `alarmTime` (HH:MM, 12h)
     *  - `hourly`        : at the top of every hour (bell rings N times, where N = hour)
     *  - `every-15`      : every 15 minutes (xx:00, xx:15, xx:30, xx:45)
     *  - `every-30`      : every 30 minutes (xx:00, xx:30)
     *  - `every-minute`  : every minute (on the second `:00`)
     * @default 'match'
     */
    alarmMode?: AlarmMode
    /**
     * Target time for `match` mode. Accepts "HH:MM" in 12-hour format
     * (e.g. "10:30", "06:00") and an optional `meridiem` ("AM" | "PM").
     * @example "10:30 PM"
     */
    alarmTime?: string
    /**
     * Sound volume from 0 to 1.
     * @default 0.8
     */
    volume?: number
  }>(),
  {
    showDate: true,
    size: 'lg',
    orientation: 'horizontal',
    alarmType: 'bell',
    soundSrc: undefined,
    alarmMode: 'match',
    alarmTime: undefined,
    volume: 0.8,
  },
)

const now = ref(new Date())
let timer: ReturnType<typeof setInterval> | null = null
let lastTriggeredKey = ''

const SILENT_WAV = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='
const fileSrc = computed(() => (props.alarmType === 'url' && props.soundSrc) ? props.soundSrc : SILENT_WAV)
const { play: playFile } = useSound(fileSrc, {
  volume: props.volume,
  interrupt: false,
})

const { play: playBell, resume: resumeBell } = useBell()

function fireBell() {
  if (props.alarmType === 'bell') {
    playBell({ volume: props.volume })
  } else if (props.alarmType === 'url' && props.soundSrc) {
    playFile()
  }
}

function parseAlarmTime(value: string | undefined): { hours: number; minutes: number } | null {
  if (!value) return null
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i)
  if (!match) return null
  let hours = Number(match[1])
  const minutes = Number(match[2])
  const meridiem = match[3]?.toLowerCase()
  if (meridiem === 'pm' && hours < 12) hours += 12
  if (meridiem === 'am' && hours === 12) hours = 0
  if (hours > 23 || minutes > 59) return null
  return { hours, minutes }
}

function shouldTrigger(d: Date): string | null {
  if (props.alarmType === 'none') return null
  if (props.alarmType === 'url' && !props.soundSrc) return null

  const h = d.getHours()
  const m = d.getMinutes()
  const s = d.getSeconds()

  switch (props.alarmMode) {
    case 'match': {
      const target = parseAlarmTime(props.alarmTime)
      if (!target) return null
      if (h === target.hours && m === target.minutes && s === 0) {
        return `match-${h}-${m}`
      }
      return null
    }
    case 'hourly':
      return m === 0 && s === 0 ? `hour-${h}` : null
    case 'every-15':
      return m % 15 === 0 && s === 0 ? `q-${h}-${m}` : null
    case 'every-30':
      return m % 30 === 0 && s === 0 ? `h-${h}-${m}` : null
    case 'every-minute':
      return s === 0 ? `min-${h}-${m}` : null
    default:
      return null
  }
}

onMounted(() => {
  // Browsers block audio until the user interacts with the page.
  // We prime the bell's AudioContext on the first user gesture
  // (click, key, touch) so the very first chime still rings out.
  // Without this, every bell.play() called before user interaction
  // schedules oscillators on a suspended context that never starts.
  const resume = () => {
    void resumeBell()
    document.removeEventListener('pointerdown', resume)
    document.removeEventListener('keydown', resume)
  }
  document.addEventListener('pointerdown', resume, { once: true })
  document.addEventListener('keydown', resume, { once: true })

  timer = setInterval(() => {
    const d = new Date()
    now.value = d

    const key = shouldTrigger(d)
    if (key && key !== lastTriggeredKey) {
      lastTriggeredKey = key
      if (props.alarmType === 'bell' && props.alarmMode === 'hourly') {
        // Ring the bell exactly the number of times the 12-hour clock shows.
        // 12:00 (noon/midnight) → 12 rings · 1:00 → 1 ring · 13:00 → 1 ring · 23:00 → 11 rings.
        const h24 = d.getHours()
        const h12 = h24 % 12 || 12
        playBell({ volume: props.volume, repeats: h12, repeatDelay: 900 })
      } else {
        fireBell()
      }
    } else if (!key) {
      // reset the latch so the same minute can fire again the next time around
      lastTriggeredKey = ''
    }
  }, 1000)
})

onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})

const pad = (n: number) => n.toString().padStart(2, '0')

const formattedDate = computed(() => {
  const d = now.value
  const month = d.toLocaleString('en-US', { month: 'short' })
  return `${month} ${pad(d.getDate())}, ${d.getFullYear()}`
})

const formattedTime = computed(() => {
  const d = now.value
  let hours = d.getHours()
  const meridiem = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12 || 12
  return {
    hours: pad(hours),
    minutes: pad(d.getMinutes()),
    seconds: pad(d.getSeconds()),
    meridiem,
  }
})
</script>
