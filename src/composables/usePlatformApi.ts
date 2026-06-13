// Centralised helpers for the /v1/platform backend endpoints.
import { getApiBase } from '~/composables/useRuntimeConfig'
import { useAuthStore } from '~/stores/auth'

type Query = Record<string, any>

function buildQuery(params: Query) {
  const q: Record<string, string> = {}
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue
    q[k] = String(v)
  }
  return q
}

async function unwrap<T>(res: any): Promise<T> {
  const data = res?.data ?? res
  return (data?.data ?? data) as T
}

export function usePlatformApi() {
  const config = getApiBase()

  async function call<T = any>(
    path: string,
    options: { method?: string; query?: Query; body?: any } = {},
  ): Promise<T> {
    const url = `${config}/v1/platform${path}`
    const fetchOptions: any = {
      method: options.method || 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    }
    if (options.query) fetchOptions.query = buildQuery(options.query)
    if (options.body) fetchOptions.body = options.body
    const token = useAuthStore().accessToken
    if (token) fetchOptions.headers.Authorization = `Bearer ${token}`
    const res = await $fetch<any>(url, fetchOptions)
    return unwrap<T>(res)
  }

  return {
    // Hotels
    listHotels: (q: Query) => call<any>('/hotels', { query: q }),
    getHotel: (id: string) => call<any>(`/hotels/${id}`),

    // Plans
    listPlans: (q: Query) => call<any>('/plans', { query: q }),
    getPlan: (id: string) => call<any>(`/plans/${id}`),
    createPlan: (body: any) => call<any>('/plans', { method: 'POST', body }),
    updatePlan: (id: string, body: any) => call<any>(`/plans/${id}`, { method: 'PATCH', body }),
    deletePlan: (id: string) => call<any>(`/plans/${id}`, { method: 'DELETE' }),

    // Subscriptions
    listSubscriptions: (q: Query) => call<any>('/subscriptions', { query: q }),

    // Invoices
    listInvoices: (q: Query) => call<any>('/invoices', { query: q }),
    getInvoice: (id: string) => call<any>(`/invoices/${id}`),

    // Locations
    listCities: (q: Query) => call<any>('/locations/cities', { query: q }),
    listStates: (q: Query) => call<any>('/locations/states', { query: q }),

    // Customers
    listCustomers: (q: Query) => call<any>('/customers', { query: q }),

    // Bookings
    listBookings: (q: Query) => call<any>('/bookings', { query: q }),

    // Staff
    listStaff: (q: Query) => call<any>('/staff', { query: q }),

    // Activity
    listActivityLogs: (q: Query) => call<any>('/activity-logs', { query: q }),

    // Failed jobs
    listFailedJobs: (q: Query) => call<any>('/failed-jobs', { query: q }),
  }
}
