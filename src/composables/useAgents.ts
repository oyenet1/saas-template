import { ref, computed, readonly } from 'vue'
import { useApiFetch } from './useApiFetch'

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

function toAgent(api: any): Agent {
  const name = api.name || ''
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  return {
    id: api.id || 0,
    slug,
    name,
    title: api.role || api.title || '',
    bio: api.bio || '',
    imageUrl: api.photoUrl || api.imageUrl || api.image_url || '',
    email: api.email || '',
    phone: api.phone || '',
    specialties: ['Real Estate'],
    propertiesSold: api.propertiesSold || 0,
    experience: api.experience || 0,
    rating: api.rating || 5,
    featured: api.featured ?? [1, 2, 3, 4].includes(api.id),
  }
}

let mockCache: Agent[] | null = null

async function loadMock(): Promise<Agent[]> {
  if (mockCache) return mockCache
  const { agents } = await import('../data/agents')
  mockCache = agents
  return agents
}

export function useAgents() {
  const { loading, error, get } = useApiFetch()
  const agents = ref<Agent[]>([])
  const current = ref<Agent | null>(null)

  const featured = computed(() => agents.value.filter((a) => a.featured))
  const specialties = computed(() => [...new Set(agents.value.flatMap((a) => a.specialties))].sort())

  async function fetchAll() {
    const mock = await loadMock()
    const data = await get<{ teams: any[] }>(
      '/api/v1/teams',
      async () => ({ teams: mock }),
    )
    agents.value = (data.teams || []).map(toAgent)
  }

  async function fetchById(id: number) {
    const mock = await loadMock()
    const mockItem = mock.find((a) => a.id === id) || null
    const data = await get<{ team: any }>(
      `/api/v1/teams/${id}`,
      async () => ({ team: mockItem }),
    )
    current.value = data.team ? toAgent(data.team) : null
    return current.value
  }

  function getBySlug(slug: string): Agent | undefined {
    return agents.value.find((a) => a.slug === slug)
  }

  return {
    agents: readonly(agents),
    current: readonly(current),
    featured,
    specialties,
    loading,
    error,
    fetchAll,
    fetchById,
    getBySlug,
  }
}
