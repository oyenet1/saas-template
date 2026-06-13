/**
 * Synthesized bell chime using the Web Audio API.
 * Plays a rich, layered bell tone with multiple harmonics and a long natural decay.
 * No external audio files required.
 *
 * Supports single play() calls and continuous start()/stop() looping for
 * persistent notification alerts (e.g. booking notifications that ring until
 * the user dismisses the toast).
 */

interface BellOptions {
  /** Volume 0..1 (the gain is amplified internally for "loud" feel) */
  volume?: number
  /** Number of times to ring (e.g. 3 = triple chime for top of the hour) */
  repeats?: number
  /** Delay between repeats in ms */
  repeatDelay?: number
}

let audioCtx: AudioContext | null = null
let continuousTimer: ReturnType<typeof setInterval> | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (audioCtx) return audioCtx
  const Ctor = window.AudioContext || (window as any).webkitAudioContext
  if (!Ctor) return null
  audioCtx = new Ctor()
  return audioCtx
}

function ringBell(ctx: AudioContext, when: number, volume: number) {
  const partials = [
    { freq: 880,    gain: 0.9, decay: 4.0 },
    { freq: 1320,   gain: 0.6, decay: 2.5 },
    { freq: 1760,   gain: 0.45, decay: 1.6 },
    { freq: 2640,   gain: 0.30, decay: 1.0 },
    { freq: 3520,   gain: 0.22, decay: 0.7 },
    { freq: 4400,   gain: 0.15, decay: 0.5 },
  ]

  const master = ctx.createGain()
  master.gain.value = 0
  master.gain.setValueAtTime(0, when)
  master.gain.linearRampToValueAtTime(volume, when + 0.005)
  master.gain.exponentialRampToValueAtTime(0.0001, when + 5.0)
  master.connect(ctx.destination)

  const comp = ctx.createDynamicsCompressor()
  comp.threshold.value = -12
  comp.knee.value = 8
  comp.ratio.value = 4
  comp.attack.value = 0.003
  comp.release.value = 0.25
  comp.connect(master)

  for (const p of partials) {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = p.freq

    const g = ctx.createGain()
    g.gain.value = 0
    g.gain.setValueAtTime(0, when)
    g.gain.linearRampToValueAtTime(p.gain, when + 0.003)
    g.gain.exponentialRampToValueAtTime(0.0001, when + p.decay)

    osc.connect(g)
    g.connect(comp)
    osc.start(when)
    osc.stop(when + p.decay + 0.1)
  }

  const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate)
  const data = noiseBuf.getChannelData(0)
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
  }
  const noise = ctx.createBufferSource()
  noise.buffer = noiseBuf
  const noiseGain = ctx.createGain()
  noiseGain.gain.setValueAtTime(0.35 * volume, when)
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, when + 0.08)
  noise.connect(noiseGain)
  noiseGain.connect(master)
  noise.start(when)
  noise.stop(when + 0.1)
}

export function useBell() {
  function play(options: BellOptions = {}) {
    const ctx = getCtx()
    if (!ctx) return
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }

    const volume = options.volume ?? 1.0
    const repeats = Math.max(1, options.repeats ?? 1)
    const repeatDelay = options.repeatDelay ?? 600

    const now = ctx.currentTime
    for (let i = 0; i < repeats; i++) {
      ringBell(ctx, now + i * (repeatDelay / 1000), volume)
    }
  }

  function startContinuous(options: BellOptions = {}) {
    stopContinuous()
    const ctx = getCtx()
    if (!ctx) return
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }

    const volume = options.volume ?? 1.0
    const repeatDelay = options.repeatDelay ?? 2000

    function ring() {
      if (!audioCtx) return
      ringBell(audioCtx, audioCtx.currentTime, volume)
    }

    ring()
    continuousTimer = setInterval(ring, repeatDelay)
  }

  function stopContinuous() {
    if (continuousTimer) {
      clearInterval(continuousTimer)
      continuousTimer = null
    }
  }

  /**
   * Resume the underlying AudioContext if it was suspended by the
   * browser's autoplay policy. Browsers start AudioContext in
   * the 'suspended' state until the user has interacted with the
   * page — so any bell that fires before the first click/keypress
   * is silent. Call this from a one-shot user-gesture handler
   * (pointerdown / keydown) to prime the context for future plays.
   */
  async function resume() {
    const ctx = getCtx()
    if (!ctx) return
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume()
      } catch {
        // ignore — the next play() will retry
      }
    }
  }

  return { play, startContinuous, stopContinuous, resume }
}
