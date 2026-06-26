const API_BASE: string =
  (import.meta.env.PUBLIC_API_BASE_URL as string | undefined) || 'http://localhost:3000'

/* ── Generic fetch with timeout + fallback ──────────────────── */

async function apiFetch<T>(path: string, fallback: () => Promise<T>): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { signal: AbortSignal.timeout(3000) })
    if (!res.ok) throw new Error(`API ${res.status}`)
    const json = await res.json()
    if (!json.success) throw new Error(json.message || 'API error')
    return json.data as T
  } catch {
    return fallback()
  }
}

/* ── Property helpers ───────────────────────────────────────── */

async function getApiProperties(): Promise<any[]> {
  const { properties: mock } = await import('../data/properties')
  return apiFetch<{ properties: any[] }>('/api/v1/properties', async () => ({ properties: mock })).then((d) => d.properties)
}

export async function getProperties(): Promise<Property[]> {
  const raw = await getApiProperties()
  return raw.map(toProperty)
}

export async function getFeaturedProperties(): Promise<Property[]> {
  const all = await getProperties()
  return all.filter((p) => p.featured)
}

export async function getPropertyBySlug(slug: string): Promise<Property | undefined> {
  const { getPropertyBySlug: mock } = await import('../data/properties')
  try {
    const data = await apiFetch<{ property: any }>(`/api/v1/properties/by-slug/${slug}`, async () => ({
      property: mock(slug) ?? null,
    }))
    return data.property ? toProperty(data.property) : undefined
  } catch {
    return undefined
  }
}

/* ── Agent helpers ──────────────────────────────────────────── */

async function getApiTeams(): Promise<any[]> {
  const { agents: mock } = await import('../data/agents')
  return apiFetch<{ teams: any[] }>('/api/v1/teams', async () => ({ teams: mock })).then((d) => d.teams)
}

export async function getAgents(): Promise<Agent[]> {
  const raw = await getApiTeams()
  return raw.map(toAgent)
}

export async function getFeaturedAgents(): Promise<Agent[]> {
  const all = await getAgents()
  return all.filter((a) => a.featured)
}

export async function getAgentBySlug(slug: string): Promise<Agent | undefined> {
  const all = await getAgents()
  return all.find((a) => a.slug === slug)
}

export async function getAgentById(id: number): Promise<Agent | undefined> {
  const { agents: mock } = await import('../data/agents')
  try {
    const data = await apiFetch<{ team: any }>(`/api/v1/teams/${id}`, async () => ({
      team: mock.find((a: any) => a.id === id) ?? null,
    }))
    return data.team ? toAgent(data.team) : undefined
  } catch {
    return undefined
  }
}

/* ── Testimony helpers ──────────────────────────────────────── */

export async function getTestimonies(): Promise<Testimony[]> {
  const fallback = [
    { name: 'Sarah & James Mitchell', title: 'Bought Sunset Villa, Malibu', content: 'From the first viewing to the final handover, LuxEstate made the experience seamless.', rating: 5, imageUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&q=80' },
    { name: 'David Chen', title: 'Rented Aspen Mountain Lodge', content: 'The team\'s knowledge of the Aspen market was invaluable.', rating: 5, imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80' },
    { name: 'Olivia & Marcus Williams', title: 'Bought Mayfair Townhouse, London', content: 'LuxEstate guided us through every step.', rating: 5, imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&q=80' },
    { name: 'Elena Petrova', title: 'Bought Palm Jumeirah Villa', content: 'Exceptional service that truly understands luxury real estate.', rating: 5, imageUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&q=80' },
    { name: 'Robert & Diane Kim', title: 'Sold Manhattan Sky Penthouse', content: 'LuxEstate sold our penthouse for 12% above asking.', rating: 5, imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80' },
  ]
  return apiFetch<{ testimonies: any[] }>('/api/v1/testimonies', async () => ({ testimonies: fallback })).then((d) => d.testimonies)
}

/* ── Types ──────────────────────────────────────────────────── */

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

export interface Agent {
  id: number
  slug: string
  name: string
  title: string
  bio: string
  imageUrl: string
  email: string
  phone: string
  specialties: string[]
  propertiesSold: number
  experience: number
  rating: number
  featured: boolean
}

export interface Testimony {
  name: string
  title: string
  content: string
  rating: number
  imageUrl: string
}

/* ── Normalisers ────────────────────────────────────────────── */

const IMAGE_POOL = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200',
  'https://images.unsplash.com/photo-1600566753086-00f18f6b0058?w=1200',
  'https://images.unsplash.com/photo-1600566753376-12c8ab7fb144?w=1200',
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

function toProperty(api: any): Property {
  const slug = api.slug || ''
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
    features: FEATURE_MAP[slug] || ['Modern Finishes', 'Natural Light'],
    images: IMAGE_POOL,
    video: api.videoUrl || api.video,
    featured: FEATURED_SLUGS.includes(slug) || !!api.featured,
  }
}

const SPECIALTIES_MAP: Record<string, string[]> = {
  'alexander-voss': ['Luxury Residential', 'International Investments', 'Portfolio Management'],
  'isabella-chen': ['International Buyers', 'Condominiums', 'Pre-Construction'],
  'marcus-rivera': ['Residential', 'Commercial', 'Luxury Estates'],
  'sophie-laurent': ['International Sales', 'European Properties', 'Luxury Rentals'],
  'james-okonkwo': ['Emerging Markets', 'Luxury Development', 'Investment Properties'],
  'emily-foster': ['Luxury Rentals', 'Short-Term Leasing', 'Concierge Services'],
}

function makeSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

function toAgent(api: any): Agent {
  const name = api.name || ''
  const slug = makeSlug(name)
  return {
    id: api.id || 0,
    slug,
    name,
    title: api.title || '',
    bio: api.bio || '',
    imageUrl: api.imageUrl || api.image_url || '',
    email: api.email || '',
    phone: api.phone || '',
    specialties: SPECIALTIES_MAP[slug] || ['Real Estate'],
    propertiesSold: api.propertiesSold || 0,
    experience: api.experience || 0,
    rating: api.rating || 5,
    featured: api.featured ?? [1, 2, 3, 4].includes(api.id),
  }
}

/* ── Utility functions ──────────────────────────────────────── */

export function formatPrice(price: number, status: 'sale' | 'rent'): string {
  if (status === 'rent') return `$${price.toLocaleString()}/mo`
  if (price >= 1000000) return `$${(price / 1000000).toFixed(price % 1000000 === 0 ? 0 : 1)}M`
  return `$${price.toLocaleString()}`
}

export function searchProperties(list: Property[], query: string): Property[] {
  const q = query.toLowerCase()
  return list.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q) ||
      p.type.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q),
  )
}

export function filterProperties(list: Property[], filters: {
  type?: string; status?: string; minPrice?: number; maxPrice?: number; minBedrooms?: number; city?: string
}): Property[] {
  return list.filter((p) => {
    if (filters.type && p.type !== filters.type) return false
    if (filters.status && p.status !== filters.status) return false
    if (filters.minPrice && p.price < filters.minPrice) return false
    if (filters.maxPrice && p.price > filters.maxPrice) return false
    if (filters.minBedrooms && p.bedrooms < filters.minBedrooms) return false
    if (filters.city && p.city.toLowerCase() !== filters.city.toLowerCase()) return false
    return true
  })
}

export function getCities(properties: Property[]): string[] {
  return [...new Set(properties.map((p) => p.city))].sort()
}

export function getPropertyTypes(properties: Property[]): string[] {
  return [...new Set(properties.map((p) => p.type))].sort()
}

export function getSpecialties(agents: Agent[]): string[] {
  return [...new Set(agents.flatMap((a) => a.specialties))].sort()
}
