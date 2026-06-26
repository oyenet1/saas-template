import { ref, readonly } from 'vue'
import { useApiFetch } from './useApiFetch'

export interface Banner {
  id?: number
  title: string
  slug?: string
  subtitle?: string
  imageUrl?: string
  ctaText?: string
  ctaUrl?: string
  position?: 'home' | 'properties' | 'sidebar' | 'popup'
  sortOrder: number
  isActive: boolean
}

export interface Slide {
  image: string
  alt: string
}

const FALLBACK_SLIDES: Slide[] = [
  { image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80', alt: 'Luxury villa with ocean view' },
  { image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80', alt: 'Modern luxury living room' },
  { image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80', alt: 'Elegant mansion entrance' },
  { image: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb144?w=1920&q=80', alt: 'Luxury estate with pool' },
  { image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1920&q=80', alt: 'Minimalist luxury interior' },
  { image: 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=1920&q=80', alt: 'Grand stairway with chandelier' },
  { image: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1920&q=80', alt: 'Modern kitchen with ocean views' },
  { image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1920&q=80', alt: 'Luxury bedroom suite' },
]

export function useBanners() {
  const { loading, error, get } = useApiFetch()
  const banners = ref<Banner[]>([])
  const slides = ref<Slide[]>(FALLBACK_SLIDES)

  async function fetchAll(position = 'home') {
    const data = await get<{ banners: any[] }>(
      `/api/v1/content/banners?position=${position}&isActive=true`,
      async () => ({ banners: [] }),
    )
    if (data.banners?.length) {
      banners.value = data.banners.map(toBanner).filter((b: Banner) => b.isActive)
      slides.value = banners.value
        .filter((b: Banner) => b.imageUrl)
        .map((b: Banner) => ({ image: b.imageUrl!, alt: b.title }))
      if (!slides.value.length) slides.value = FALLBACK_SLIDES
    } else {
      slides.value = FALLBACK_SLIDES
    }
  }

  function toBanner(api: any): Banner {
    return {
      id: api.id,
      title: api.title || '',
      slug: api.slug,
      subtitle: api.subtitle,
      imageUrl: api.imageUrl,
      ctaText: api.ctaText,
      ctaUrl: api.ctaUrl,
      position: api.position || 'home',
      sortOrder: api.sortOrder ?? 0,
      isActive: api.isActive ?? true,
    }
  }

  return {
    banners: readonly(banners),
    slides: readonly(slides),
    loading,
    error,
    fetchAll,
  }
}
