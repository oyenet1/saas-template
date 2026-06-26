/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-06-26
 * 🔄 Updated Date: 2026-06-26
 * ──────────────────────────────────────────────────────────────────
 */

import { ref, readonly } from 'vue'
import { adminRequest, setActiveCompanyId, getActiveCompanyId } from '../lib/admin-api'

export interface TenantCompany {
  id: number
  name: string
  slug: string
  status?: string
  plan?: string
  role?: string
  isOwner?: boolean
}

export function useTenant() {
  const loading = ref(false)
  const companies = ref<TenantCompany[]>([])
  const activeCompany = ref<TenantCompany | null>(null)
  const ready = ref(false)

  async function fetchMine() {
    loading.value = true
    const res = await adminRequest<{ companies: TenantCompany[] }>('/api/v1/companies/mine')
    loading.value = false
    if (res.success && res.data?.companies) {
      companies.value = res.data.companies
      return companies.value
    }
    companies.value = []
    return []
  }

  async function fetchActive() {
    const res = await adminRequest<{ company: TenantCompany }>('/api/v1/companies/mine/active')
    if (res.success && res.data?.company) {
      activeCompany.value = res.data.company
      setActiveCompanyId(res.data.company.id)
      return res.data.company
    }
    return null
  }

  async function bootstrap() {
    loading.value = true
    await fetchMine()
    const storedId = getActiveCompanyId()
    const active = await fetchActive()
    if (!active && storedId) {
      const match = companies.value.find((c) => c.id === storedId)
      if (match) {
        await activate(storedId)
      } else if (companies.value[0]) {
        await activate(companies.value[0].id)
      }
    } else if (!active && companies.value[0]) {
      await activate(companies.value[0].id)
    }
    loading.value = false
    ready.value = true
    if (
      typeof window !== 'undefined' &&
      !activeCompany.value &&
      companies.value.length === 0 &&
      !window.location.pathname.startsWith('/admin/onboarding')
    ) {
      window.location.assign('/admin/onboarding')
    }
    return activeCompany.value
  }

  async function activate(companyId: number) {
    const res = await adminRequest<{ companyId: number }>(`/api/v1/companies/${companyId}/activate`, {
      method: 'POST',
    })
    if (!res.success) return false
    setActiveCompanyId(companyId)
    const company = companies.value.find((c) => c.id === companyId) ?? null
    activeCompany.value = company
    await fetchActive()
    return true
  }

  async function createCompany(input: { name: string; slug?: string }) {
    const res = await adminRequest<{ company: TenantCompany }>('/api/v1/companies', {
      method: 'POST',
      body: input,
    })
    if (!res.success || !res.data?.company) {
      return { ok: false as const, message: res.message, errors: res.errors }
    }
    await fetchMine()
    await activate(res.data.company.id)
    return { ok: true as const, company: res.data.company }
  }

  return {
    loading: readonly(loading),
    ready: readonly(ready),
    companies: readonly(companies),
    activeCompany: readonly(activeCompany),
    bootstrap,
    fetchMine,
    fetchActive,
    activate,
    createCompany,
  }
}
