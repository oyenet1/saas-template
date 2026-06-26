import { ref, readonly } from 'vue'
import { useApiFetch } from './useApiFetch'

export interface SessionUser {
  id: string
  email: string
  name?: string | null
  image?: string | null
}

export function useAuth() {
  const { loading, error, post, get } = useApiFetch()
  const user = ref<SessionUser | null>(null)
  const isAuthenticated = ref(false)

  async function login(input: { email: string; password: string }): Promise<boolean> {
    const res = await post<{ user: SessionUser }>(
      '/api/v1/auth/login',
      input,
      async () => {
        throw new Error('Network unavailable')
      },
    )
    if (res.user) {
      user.value = res.user
      isAuthenticated.value = true
      return true
    }
    return false
  }

  async function register(input: { email: string; password: string; name: string }): Promise<boolean> {
    const res = await post<{ user: SessionUser }>(
      '/api/v1/auth/register',
      input,
      async () => {
        throw new Error('Network unavailable')
      },
    )
    if (res.user) {
      user.value = res.user
      isAuthenticated.value = true
      return true
    }
    return false
  }

  async function logout(): Promise<void> {
    await post<null>(
      '/api/v1/auth/logout',
      null,
      async () => null,
    )
    user.value = null
    isAuthenticated.value = false
  }

  async function fetchMe(): Promise<void> {
    try {
      const data = await get<SessionUser>(
        '/api/v1/auth/me',
        async () => {
          throw new Error('Network unavailable')
        },
      )
      user.value = data as unknown as SessionUser
      isAuthenticated.value = true
    } catch {
      user.value = null
      isAuthenticated.value = false
    }
  }

  async function forgotPassword(email: string): Promise<boolean> {
    const res = await post<null>(
      '/api/v1/auth/forgot-password',
      { email },
      async () => { throw new Error('Network unavailable') },
    )
    return res !== null
  }

  async function resetPassword(input: { email: string; code: string; password: string }): Promise<boolean> {
    const res = await post<null>(
      '/api/v1/auth/reset-password',
      input,
      async () => { throw new Error('Network unavailable') },
    )
    return res !== null
  }

  return {
    user: readonly(user),
    isAuthenticated: readonly(isAuthenticated),
    loading,
    error,
    login,
    register,
    logout,
    fetchMe,
    forgotPassword,
    resetPassword,
  }
}
