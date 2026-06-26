import { ref, readonly } from 'vue'
import { useApiFetch } from './useApiFetch'

export interface Testimony {
  id?: number
  name: string
  title?: string
  location?: string
  content: string
  rating: number
  imageUrl?: string
  photoUrl?: string
}

const FALLBACK: Testimony[] = [
  { name: 'Sarah & James Mitchell', title: 'Bought Sunset Villa, Malibu', content: 'From the first viewing to the final handover, LuxEstate made the experience seamless.', rating: 5, imageUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&q=80' },
  { name: 'David Chen', title: 'Rented Aspen Mountain Lodge', content: 'The team\'s knowledge of the Aspen market was invaluable.', rating: 5, imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80' },
  { name: 'Olivia & Marcus Williams', title: 'Bought Mayfair Townhouse, London', content: 'LuxEstate guided us through every step.', rating: 5, imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&q=80' },
  { name: 'Elena Petrova', title: 'Bought Palm Jumeirah Villa', content: 'Exceptional service that truly understands luxury real estate.', rating: 5, imageUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&q=80' },
  { name: 'Robert & Diane Kim', title: 'Sold Manhattan Sky Penthouse', content: 'LuxEstate sold our penthouse for 12% above asking.', rating: 5, imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80' },
]

function toTestimony(api: any): Testimony {
  return {
    id: api.id,
    name: api.name || '',
    title: api.title || '',
    location: api.location || '',
    content: api.content || '',
    rating: api.rating ?? 5,
    imageUrl: api.photoUrl || api.imageUrl || '',
  }
}

export function useTestimonies() {
  const { loading, error, get } = useApiFetch()
  const testimonies = ref<Testimony[]>([])

  async function fetchAll() {
    const data = await get<{ testimonies: any[] }>(
      '/api/v1/testimonies',
      async () => ({ testimonies: FALLBACK }),
    )
    testimonies.value = (data.testimonies || []).map(toTestimony)
  }

  return {
    testimonies: readonly(testimonies),
    loading,
    error,
    fetchAll,
  }
}
