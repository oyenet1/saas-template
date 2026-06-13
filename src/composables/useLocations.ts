export interface LocationOption {
  id: number
  name: string
  label: string
  description?: string
}

interface CountryRow {
  id: number
  name: string
  iso2?: string | null
  iso3?: string | null
  phoneCode?: string | null
  region?: string | null
}

interface StateRow {
  id: number
  name: string
  country_id?: number | null
  country_code?: string | null
}

interface CityRow {
  id: number
  name: string
}

interface CountryResponse {
  countries: CountryRow[]
  meta?: { pagination?: Record<string, unknown> }
}

interface StateResponse {
  states: StateRow[]
  meta?: { pagination?: Record<string, unknown> }
}

interface CityResponse {
  cities: CityRow[]
  meta?: { pagination?: Record<string, unknown> }
}

interface LocationQuery {
  page?: number
  perPage?: number
  search?: string
  sortBy?: string
  order?: 'asc' | 'desc'
}

interface StateQuery extends LocationQuery {
  countryId?: number
}

interface CityByStateQuery extends LocationQuery {
  countryId?: number
  stateId?: number
}

const DEFAULT_COUNTRY_ID = 160

function asQuery(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value))
    }
  }

  return search.toString()
}

function mapCountry(country: CountryRow): LocationOption {
  return {
    id: country.id,
    name: country.name,
    label: country.name,
  }
}

function mapState(state: StateRow): LocationOption {
  return {
    id: state.id,
    name: state.name,
    label: state.name,
    description: state.country_code || undefined,
  }
}

function mapCity(city: CityRow): LocationOption {
  return {
    id: city.id,
    name: city.name,
    label: city.name,
  }
}

export function useLocations() {
  const { call } = useApi()

  async function getCountries(query: LocationQuery = {}) {
    const qs = asQuery({
      page: query.page ?? 1,
      perPage: query.perPage ?? 500,
      search: query.search?.trim(),
      sortBy: query.sortBy ?? 'name',
      order: query.order ?? 'asc',
    })

    const response = await call<CountryResponse>(`/v1/locations/countries?${qs}`, {}, { error: false, success: false })
    return response.data.countries.map(mapCountry)
  }

  async function getStates(query: StateQuery = {}) {
    const qs = asQuery({
      page: query.page ?? 1,
      perPage: query.perPage ?? 50,
      search: query.search?.trim(),
      countryId: query.countryId ?? DEFAULT_COUNTRY_ID,
      sortBy: query.sortBy ?? 'name',
      order: query.order ?? 'asc',
    })

    const response = await call<StateResponse>(`/v1/locations/states?${qs}`, {}, { error: false, success: false })
    return response.data.states.map(mapState)
  }

  async function getCities(query: LocationQuery = {}) {
    const qs = asQuery({
      page: query.page ?? 1,
      perPage: query.perPage ?? 50,
      search: query.search?.trim(),
    })

    const response = await call<CityResponse>(`/v1/locations/countries/cities?${qs}`, {}, { error: false, success: false })
    return response.data.cities.map(mapCity)
  }

  async function getCitiesByState(query: CityByStateQuery = {}) {
    const qs = asQuery({
      page: query.page ?? 1,
      perPage: query.perPage ?? 50,
      search: query.search?.trim(),
      countryId: query.countryId ?? DEFAULT_COUNTRY_ID,
      stateId: query.stateId,
    })

    const response = await call<CityResponse>(`/v1/locations/cities?${qs}`, {}, { error: false, success: false })
    return response.data.cities.map(mapCity)
  }

  return {
    DEFAULT_COUNTRY_ID,
    getCountries,
    getStates,
    getCities,
    getCitiesByState,
  }
}
