import { ref, readonly } from 'vue'
import { useApiFetch } from './useApiFetch'

export interface Feature {
  id: number
  name: string
  slug?: string
  icon?: string
}

const FALLBACK: Feature[] = [
  { id: 1, name: 'Swimming Pool', slug: 'swimming-pool', icon: 'pool' },
  { id: 2, name: 'Parking', slug: 'parking', icon: 'garage' },
  { id: 3, name: 'Gym', slug: 'gym', icon: 'fitness' },
  { id: 4, name: 'Security', slug: 'security', icon: 'security' },
  { id: 5, name: 'Air Conditioning', slug: 'ac', icon: 'ac' },
  { id: 6, name: 'Garden', slug: 'garden', icon: 'yard' },
  { id: 7, name: 'Smart Home', slug: 'smart-home', icon: 'smart' },
  { id: 8, name: 'CCTV', slug: 'cctv', icon: 'camera' },
]

export function useFeatures() {
  const { loading, error, get } = useApiFetch()
  const features = ref<Feature[]>([])

  async function fetchAll() {
    const data = await get<{ features: any[] }>(
      '/api/v1/features',
      async () => ({ features: FALLBACK }),
    )
    if (data.features?.length) {
      features.value = data.features.map(toFeature)
    } else {
      features.value = FALLBACK
    }
  }

  function toFeature(api: any): Feature {
    return {
      id: api.id,
      name: api.name,
      slug: api.slug,
      icon: api.icon,
    }
  }

  return {
    features: readonly(features),
    loading,
    error,
    fetchAll,
  }
}
