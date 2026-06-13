<script setup lang="ts">
import { Image } from '@unpic/vue'
import { transform } from 'unpic/providers/cloudflare_images'

/**
 * R2Img — Cloudflare Images + R2-aware image component.
 *
 * Auto-detects Cloudflare Images URLs (`imagedelivery.net`) and applies
 * the requested transformations. For any other URL it falls back to a
 * plain <img>, so the component is safe to use with arbitrary sources.
 *
 * Usage:
 *   <R2Img src="https://imagedelivery.net/abc/def/public" width="400" />
 *
 *   <R2Img
 *     :src="hotel.hero"
 *     width="1200"
 *     height="600"
 *     fit="cover"
 *     gravity="auto"
 *     quality="80"
 *     format="webp"
 *     placeholder="blur"
 *   />
 *
 *   <R2Img src="..." variant="thumbnail" />
 */

defineOptions({
  inheritAttrs: false,
})

/** Cloudflare Images named variants (set up in the Cloudflare dashboard). */
type CloudflareVariant = 'public' | 'thumbnail' | 'avatar' | 'hero' | 'card' | 'banner' | string

/** Cloudflare Images transformations. Full list: https://developers.cloudflare.com/images/transformations/ */
export interface R2ImgOperations {
  /** Width in pixels (1–2000) */
  width?: number
  /** Height in pixels (1–2000) */
  height?: number
  /** Resize fit mode */
  fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad'
  /** Where to crop from when using cover/crop */
  gravity?: 'auto' | 'side' | 'top' | 'bottom' | 'left' | 'right'
  /** JPEG/WebP/AVIF quality (1–100) */
  quality?: number
  /** Output format (auto picks AVIF/WebP based on Accept header) */
  format?: 'auto' | 'webp' | 'avif' | 'jpeg' | 'png' | 'json'
  /** Device pixel ratio (1–3) */
  dpr?: number
  /** Sharpen strength (0–10) */
  sharpen?: number
  /** Gaussian blur radius (1–250) */
  blur?: number
  /** Rotation in degrees (0/90/180/270) */
  rotate?: 0 | 90 | 180 | 270
  /** Background colour for pad mode (CSS colour) */
  background?: string
  /** Whether to keep EXIF metadata */
  metadata?: 'keep' | 'copyright' | 'none'
  /** Any extra Cloudflare-specific operations (e.g. anim, draw, etc.) */
  [key: string]: string | number | undefined
}

const props = withDefaults(defineProps<{
  src: string
  alt?: string
  width?: number | string
  height?: number | string
  /** Numeric aspect ratio (e.g. 16/9 = 1.78, 1/1 = 1) */
  aspectRatio?: number
  /** Layout mode from @unpic/vue */
  layout?: 'constrained' | 'fullWidth' | 'fixed'
  /** Loading strategy */
  loading?: 'lazy' | 'eager'
  /** Background colour while loading */
  background?: string
  /** Cloudflare Images operations (width, fit, quality, format, …) */
  operations?: R2ImgOperations
  /** Cloudflare Images named variant — overrides `operations` if set */
  variant?: CloudflareVariant
  /**
   * Placeholder while the image loads.
   *  - 'blur'   → tiny blurred Cloudflare variant (quality=10, width=20)
   *  - 'empty'  → solid neutral background
   *  - string   → custom placeholder URL
   */
  placeholder?: 'blur' | 'empty' | string
  /** Sizes attribute for responsive images (e.g. "(max-width: 768px) 100vw, 50vw") */
  sizes?: string
  /** Object-fit for the inner <img> (default: cover) */
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
}>(), {
  alt: '',
  layout: 'constrained',
  loading: 'lazy',
  width: undefined,
  height: undefined,
  aspectRatio: undefined,
  background: undefined,
  operations: undefined,
  variant: undefined,
  placeholder: undefined,
  sizes: undefined,
  objectFit: 'cover',
})

/* ── Detection helpers ──────────────────────────────────────────────── */

const isCloudflareImage = (url: string): boolean => {
  if (!url) return false
  try {
    return /(^|\.)imagedelivery\.net$/i.test(new URL(url, 'https://x').hostname)
  } catch {
    return false
  }
}

const isAbsoluteUrl = (url: string): boolean => /^https?:\/\//i.test(url)

/* ── Operations merging ─────────────────────────────────────────────── */

const mergedOperations = computed<R2ImgOperations | undefined>(() => {
  // If a named variant is given, use it directly (Cloudflare knows the rest)
  if (props.variant) return { variant: props.variant } as any
  if (!props.operations) return undefined
  // Strip undefined values to keep URLs clean
  return Object.fromEntries(
    Object.entries(props.operations).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  ) as R2ImgOperations
})

/* ── Cloudflare transformer ─────────────────────────────────────────── */

const transformer = computed(() => {
  if (!props.src || !isAbsoluteUrl(props.src)) return undefined
  if (!isCloudflareImage(props.src)) return undefined

  return (url: string, operations?: Record<string, unknown>) => {
    const ops = { ...(operations || {}) }
    // If a variant is requested, pass it through; otherwise let Cloudflare
    // pick the 'public' variant when no width/height is given.
    if (props.variant) {
      ops.variant = props.variant
    } else if (!ops.width && !ops.height) {
      ops.variant = ops.variant || 'public'
    }
    return transform(url, ops as any)
  }
})

/* ── Placeholder generation ─────────────────────────────────────────── */

const placeholderSrc = computed<string | undefined>(() => {
  if (!props.placeholder) return undefined
  if (props.placeholder === 'empty') return undefined
  if (props.placeholder !== 'blur') return props.placeholder

  // 'blur' → request a tiny blurred Cloudflare variant
  if (!props.src || !isAbsoluteUrl(props.src) || !isCloudflareImage(props.src)) {
    return undefined
  }
  return transform(props.src, { width: 20, quality: 10, blur: 50, fit: 'scale-down' } as any)
})

const finalSrc = computed(() => {
  if (!props.src || !isAbsoluteUrl(props.src)) return props.src
  return props.src
})

/* ── Numeric coercion (template bindings must be number | undefined) ── */

const numWidth = computed<number | undefined>(() => {
  if (props.width == null || props.width === '') return undefined
  const n = typeof props.width === 'string' ? Number(props.width) : props.width
  return Number.isFinite(n) ? n : undefined
})

const numHeight = computed<number | undefined>(() => {
  if (props.height == null || props.height === '') return undefined
  const n = typeof props.height === 'string' ? Number(props.height) : props.height
  return Number.isFinite(n) ? n : undefined
})
</script>

<template>
  <div
    v-if="placeholderSrc && loading !== 'eager'"
    :class="['relative overflow-hidden', $attrs.class]"
  >
    <img
      :src="placeholderSrc"
      :alt="alt"
      aria-hidden="true"
      class="absolute inset-0 w-full h-full scale-110 blur-2xl"
      :style="{ objectFit }"
    />
    <Image
      :src="finalSrc"
      :alt="alt"
      :width="numWidth"
      :height="numHeight"
      :aspect-ratio="aspectRatio"
      :layout="layout"
      :background="background"
      :transformer="transformer"
      :operations="mergedOperations as any"
      :sizes="sizes"
      class="relative w-full h-full"
      :style="{ objectFit }"
      v-bind="$attrs"
    />
  </div>
  <Image
    v-else
    :src="finalSrc"
    :alt="alt"
    :width="numWidth"
    :height="numHeight"
    :aspect-ratio="aspectRatio"
    :layout="layout"
    :background="background || (placeholder === 'empty' ? '#f1f5f9' : undefined)"
    :transformer="transformer"
    :operations="mergedOperations as any"
    :sizes="sizes"
    :style="{ objectFit }"
    v-bind="$attrs"
  />
</template>
