type AnimatePreset =
  | 'fade'
  | 'fade-up'
  | 'fade-down'
  | 'fade-left'
  | 'fade-right'
  | 'zoom-in'
  | 'zoom-out'
  | 'flip-up'
  | 'slide-up'
  | 'slide-down'
  | 'scale'

interface AnimateOptions {
  preset?: AnimatePreset
  duration?: number
  delay?: number
  easing?: string
  threshold?: number
  once?: boolean
}

const presetMap: Record<AnimatePreset, Keyframe[]> = {
  'fade': [
    { opacity: 0 },
    { opacity: 1 },
  ],
  'fade-up': [
    { opacity: 0, transform: 'translate3d(0, 16px, 0)' },
    { opacity: 1, transform: 'translate3d(0, 0, 0)' },
  ],
  'fade-down': [
    { opacity: 0, transform: 'translate3d(0, -16px, 0)' },
    { opacity: 1, transform: 'translate3d(0, 0, 0)' },
  ],
  'fade-left': [
    { opacity: 0, transform: 'translate3d(-16px, 0, 0)' },
    { opacity: 1, transform: 'translate3d(0, 0, 0)' },
  ],
  'fade-right': [
    { opacity: 0, transform: 'translate3d(16px, 0, 0)' },
    { opacity: 1, transform: 'translate3d(0, 0, 0)' },
  ],
  'zoom-in': [
    { opacity: 0, transform: 'scale3d(0.92, 0.92, 1)' },
    { opacity: 1, transform: 'scale3d(1, 1, 1)' },
  ],
  'zoom-out': [
    { opacity: 0, transform: 'scale3d(1.08, 1.08, 1)' },
    { opacity: 1, transform: 'scale3d(1, 1, 1)' },
  ],
  'flip-up': [
    { opacity: 0, transform: 'perspective(800px) rotateX(20deg)' },
    { opacity: 1, transform: 'perspective(800px) rotateX(0)' },
  ],
  'slide-up': [
    { transform: 'translate3d(0, 100%, 0)' },
    { transform: 'translate3d(0, 0, 0)' },
  ],
  'slide-down': [
    { transform: 'translate3d(0, -100%, 0)' },
    { transform: 'translate3d(0, 0, 0)' },
  ],
  'scale': [
    { opacity: 0, transform: 'scale3d(0.85, 0.85, 1)' },
    { opacity: 1, transform: 'scale3d(1, 1, 1)' },
  ],
}

const defaultEasing = 'cubic-bezier(0.16, 1, 0.3, 1)'

export function useAnimate() {
  function play(
    el: Element | Element[] | null,
    options: AnimateOptions = {},
  ): Animation[] {
    if (!el) return []
    if (typeof window === 'undefined') return []
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return []

    const {
      preset = 'fade-up',
      duration = 500,
      delay = 0,
      easing = defaultEasing,
    } = options

    const elements = Array.isArray(el) ? el : [el]
    return elements.map((target) => {
      const frames = presetMap[preset] ?? presetMap['fade-up']
      const animation = (target as HTMLElement).animate(frames, {
        duration,
        delay,
        easing,
        fill: 'forwards',
      })
      return animation
    })
  }

  function reveal(
    el: Element | Element[] | null,
    options: AnimateOptions = {},
  ): void {
    if (!el) return
    if (typeof window === 'undefined') return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

    const {
      preset = 'fade-up',
      duration = 600,
      delay = 0,
      easing = defaultEasing,
      threshold = 0.15,
      once = true,
    } = options

    const elements = Array.isArray(el) ? el : [el]

    if (!('IntersectionObserver' in window)) {
      play(elements, { preset, duration, delay, easing })
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement
            play(target, { preset, duration, delay, easing })
            if (once) observer.unobserve(target)
          } else if (!once) {
            ;(entry.target as HTMLElement).animate(
              presetMap[preset].slice().reverse(),
              { duration: 300, easing, fill: 'forwards' },
            )
          }
        })
      },
      { threshold, rootMargin: '0px 0px -10% 0px' },
    )

    elements.forEach((target) => {
      ;(target as HTMLElement).style.opacity = '0'
      observer.observe(target)
    })
  }

  function enter(el: Element, done: () => void, preset: AnimatePreset = 'fade-up') {
    const anim = play(el, { preset, duration: 300 })
    if (anim[0]) {
      anim[0].onfinish = done
      anim[0].oncancel = done
    } else {
      done()
    }
  }

  function leave(el: Element, done: () => void, preset: AnimatePreset = 'fade-up') {
    const frames = presetMap[preset] ?? presetMap['fade-up']
    const reversed = frames.slice().reverse()
    const anim = (el as HTMLElement).animate(reversed, {
      duration: 200,
      easing: defaultEasing,
      fill: 'forwards',
    })
    if (anim) {
      anim.onfinish = done
      anim.oncancel = done
    } else {
      done()
    }
  }

  return { play, reveal, enter, leave }
}
