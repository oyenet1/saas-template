import { ref, readonly } from 'vue'
import { useApiFetch } from './useApiFetch'

export interface Country {
  id: number
  name: string
  iso2: string
  iso3?: string
  phoneCode?: string
  currency?: string
}

export interface State {
  id: number
  name: string
  code?: string
  countryId: number
}

export interface City {
  id: number
  name: string
  countryId: number
  stateId?: number
  latitude?: number
  longitude?: number
}

const NIGERIA: Country = {
  id: 1,
  name: 'Nigeria',
  iso2: 'NG',
  iso3: 'NGA',
  phoneCode: '+234',
  currency: 'NGN',
}

const NIGERIAN_STATES: State[] = [
  { id: 1, name: 'Lagos', countryId: 1 },
  { id: 2, name: 'Abuja', countryId: 1, code: 'FC' },
  { id: 3, name: 'Rivers', countryId: 1 },
  { id: 4, name: 'Oyo', countryId: 1 },
  { id: 5, name: 'Kaduna', countryId: 1 },
]

export function useGeo() {
  const { loading, error, get } = useApiFetch()
  const countries = ref<Country[]>([])
  const states = ref<State[]>([])
  const cities = ref<City[]>([])

  async function fetchCountries() {
    const data = await get<{ countries: any[] }>(
      '/api/v1/geo/countries',
      async () => ({ countries: [NIGERIA] }),
    )
    countries.value = (data.countries || []).map(toCountry)
  }

  async function fetchStatesByCountry(countryId: number) {
    const data = await get<{ states: any[] }>(
      `/api/v1/geo/states/by-country/${countryId}`,
      async () => ({ states: NIGERIAN_STATES.filter((s) => s.countryId === countryId) }),
    )
    states.value = (data.states || []).map(toState)
  }

  async function fetchCitiesByState(stateId: number) {
    const data = await get<{ cities: any[] }>(
      `/api/v1/geo/cities/by-state/${stateId}`,
      async () => ({ cities: [] }),
    )
    cities.value = (data.cities || []).map(toCity)
  }

  function toCountry(api: any): Country {
    return { id: api.id, name: api.name, iso2: api.iso2, iso3: api.iso3, phoneCode: api.phoneCode, currency: api.currency }
  }

  function toState(api: any): State {
    return { id: api.id, name: api.name, code: api.code, countryId: api.countryId }
  }

  function toCity(api: any): City {
    return { id: api.id, name: api.name, countryId: api.countryId, stateId: api.stateId, latitude: api.latitude, longitude: api.longitude }
  }

  return {
    countries: readonly(countries),
    states: readonly(states),
    cities: readonly(cities),
    loading,
    error,
    fetchCountries,
    fetchStatesByCountry,
    fetchCitiesByState,
  }
}
