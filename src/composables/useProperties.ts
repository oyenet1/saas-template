import { ref, computed, readonly } from 'vue'
import { useApiFetch } from './useApiFetch'

export interface Property {
  slug: string
  title: string
  type: string
  status: 'sale' | 'rent'
  price: number
  bedrooms: number
  bathrooms: number
  area: number
  location: string
  city: string
  description: string
  features: string[]
  images: string[]
  video?: string
  featured: boolean
}

const IMAGE_POOL = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200',
  'https://images.unsplash.com/photo-1600566753086-00f18f6b0058?w=1200',
]

const FEATURED_SLUGS = ['sunset-villa-malibu', 'manhattan-sky-penthouse', 'tuscan-hills-estate', 'dubai-palm-jumeirah-villa']

const FEATURE_MAP: Record<string, string[]> = {
  'sunset-villa-malibu': ['Infinity Pool', 'Ocean View', 'Smart Home', 'Private Beach Access'],
  'manhattan-sky-penthouse': ['Private Elevator', 'Rooftop Terrace', 'Concierge', 'Fitness Center'],
  'tuscan-hills-estate': ['Vineyard', 'Wine Cellar', 'Guest House', 'Gated Entry'],
  'sydney-harbour-residence': ['Waterfront', 'Boat Dock', 'Indoor Pool', 'Smart Home'],
  'parisian-marais-loft': ['Courtyard Garden', 'Exposed Stone Walls', 'Concierge'],
  'aspen-mountain-lodge': ['Ski-in/Ski-out', 'Hot Tub', 'Home Theater', 'Fire Pit'],
  'tokyo-minato-ward-tower': ['Mount Fuji View', 'Concierge', 'Rooftop Garden'],
  'dubai-palm-jumeirah-villa': ['Private Beach', 'Infinity Pool', 'Home Theater', 'Helipad'],
  'lake-como-waterfront': ['Private Dock', 'Boat House', 'Lake Views', 'Gated'],
  'london-mayfair-townhouse': ['Garden Square', 'Wine Cellar', 'Gym', 'Period Features'],
}

function imageUrlsFromApi(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (typeof item === 'string') return item
      if (item && typeof item === 'object' && 'url' in item && typeof item.url === 'string') return item.url
      return null
    })
    .filter((url): url is string => !!url)
}

function featureNamesFromApi(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (typeof item === 'string') return item
      if (item && typeof item === 'object' && 'name' in item && typeof item.name === 'string') return item.name
      return null
    })
    .filter((name): name is string => !!name)
}

function firstVideoUrlFromApi(api: any): string | undefined {
  if (typeof api.videoUrl === 'string' && api.videoUrl) return api.videoUrl
  if (typeof api.video === 'string' && api.video) return api.video
  if (Array.isArray(api.videos)) {
    const first = api.videos.find((item: unknown) => item && typeof item === 'object' && typeof (item as { url?: unknown }).url === 'string') as
      | { url: string }
      | undefined
    return first?.url
  }
  return undefined
}

function toProperty(api: any): Property {
  const slug = api.slug || ''
  const imageUrls = imageUrlsFromApi(api.images)
  const featureNames = featureNamesFromApi(api.features)
  return {
    slug,
    title: api.title || '',
    type: api.propertyType || api.type || 'house',
    status: api.purpose === 'rent' ? 'rent' : 'sale',
    price: Number(api.price) || 0,
    bedrooms: api.bedrooms || 0,
    bathrooms: api.bathrooms || 0,
    area: Number(api.area) || 0,
    location: api.address || api.location || '',
    city: api.city || '',
    description: api.description || '',
    features: featureNames.length ? featureNames : FEATURE_MAP[slug] || ['Modern Finishes', 'Natural Light'],
    images: imageUrls.length ? imageUrls : IMAGE_POOL,
    video: firstVideoUrlFromApi(api),
    featured: FEATURED_SLUGS.includes(slug) || !!api.featured,
  }
}

let mockCache: Property[] | null = null

async function loadMock(): Promise<Property[]> {
  if (mockCache) return mockCache
  const { properties } = await import('../data/properties')
  mockCache = properties
  return properties
}

export function useProperties() {
  const { loading, error, get } = useApiFetch()
  const properties = ref<Property[]>([])
  const current = ref<Property | null>(null)

  const featured = computed(() => properties.value.filter((p) => p.featured))
  const cities = computed(() => [...new Set(properties.value.map((p) => p.city))].sort())
  const types = computed(() => [...new Set(properties.value.map((p) => p.type))].sort())

  async function fetchAll() {
    const mock = await loadMock()
    const data = await get<{ properties: any[] }>(
      '/api/v1/properties',
      async () => ({ properties: mock }),
    )
    properties.value = (data.properties || []).map(toProperty)
  }

  async function fetchBySlug(slug: string) {
    const mock = await loadMock()
    const mockItem = mock.find((p) => p.slug === slug)
    const data = await get<{ property: any }>(
      `/api/v1/properties/by-slug/${slug}`,
      async () => ({ property: mockItem ?? null }),
    )
    current.value = data.property ? toProperty(data.property) : null
    return current.value
  }

  async function fetchById(id: number) {
    const mock = await loadMock()
    const mockItem = mock[id] || null
    const data = await get<{ property: any }>(
      `/api/v1/properties/${id}`,
      async () => ({ property: mockItem }),
    )
    current.value = data.property ? toProperty(data.property) : null
    return current.value
  }

  function search(query: string): Property[] {
    const q = query.toLowerCase()
    return properties.value.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q),
    )
  }

  function filter(props: Property[], filters: {
    type?: string; status?: string; minPrice?: number; maxPrice?: number; minBedrooms?: number; city?: string
  }): Property[] {
    return props.filter((p) => {
      if (filters.type && p.type !== filters.type) return false
      if (filters.status && p.status !== filters.status) return false
      if (filters.minPrice && p.price < filters.minPrice) return false
      if (filters.maxPrice && p.price > filters.maxPrice) return false
      if (filters.minBedrooms && p.bedrooms < filters.minBedrooms) return false
      if (filters.city && p.city.toLowerCase() !== filters.city.toLowerCase()) return false
      return true
    })
  }

  return {
    properties: readonly(properties),
    current: readonly(current),
    featured,
    cities,
    types,
    loading,
    error,
    fetchAll,
    fetchBySlug,
    fetchById,
    search,
    filter,
  }
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: '₦',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AED: 'د.إ',
  AUD: 'A$',
  CAD: 'C$',
}

export function formatPrice(
  price: number,
  status: 'sale' | 'rent',
  currency: string = 'NGN',
): string {
  const code = (currency || 'NGN').toUpperCase()
  const symbol = CURRENCY_SYMBOLS[code] ?? code
  const amount = price.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return status === 'rent' ? `${symbol}${amount}/mo` : `${symbol}${amount}`
}
