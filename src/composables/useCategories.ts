import { ref, readonly } from 'vue'
import { useApiFetch } from './useApiFetch'

export interface Category {
  id: number
  name: string
  slug: string
  description?: string
  icon?: string
  parentId?: number
  sortOrder: number
  isFeatured: boolean
}

const FALLBACK: Category[] = [
  { id: 1, name: 'Apartments', slug: 'apartments', description: 'Modern urban living spaces', icon: 'building', sortOrder: 1, isFeatured: true },
  { id: 2, name: 'Villas', slug: 'villas', description: 'Luxury standalone homes', icon: 'home', sortOrder: 2, isFeatured: true },
  { id: 3, name: 'Houses', slug: 'houses', description: 'Family homes', icon: 'house', sortOrder: 3, isFeatured: true },
  { id: 4, name: 'Penthouses', slug: 'penthouses', description: 'Top-floor luxury living', icon: 'building', sortOrder: 4, isFeatured: true },
  { id: 5, name: 'Land', slug: 'land', description: 'Plots and development land', icon: 'terrain', sortOrder: 5, isFeatured: false },
  { id: 6, name: 'Commercial', slug: 'commercial', description: 'Office and retail spaces', icon: 'store', sortOrder: 6, isFeatured: false },
]

export function useCategories() {
  const { loading, error, get } = useApiFetch()
  const categories = ref<Category[]>([])

  async function fetchAll() {
    const data = await get<{ categories: any[] }>(
      '/api/v1/categories',
      async () => ({ categories: FALLBACK }),
    )
    if (data.categories?.length) {
      categories.value = data.categories.map(toCategory)
    } else {
      categories.value = FALLBACK
    }
  }

  function toCategory(api: any): Category {
    return {
      id: api.id,
      name: api.name,
      slug: api.slug,
      description: api.description,
      icon: api.icon,
      parentId: api.parentId,
      sortOrder: api.sortOrder ?? 0,
      isFeatured: api.isFeatured ?? false,
    }
  }

  return {
    categories: readonly(categories),
    loading,
    error,
    fetchAll,
  }
}
