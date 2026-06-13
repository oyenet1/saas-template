export function getApiBase(): string {
  return import.meta.env.VITE_API_BASE || 'http://127.0.0.1:3004'
}

export function getSocketUrl(): string {
  return import.meta.env.VITE_SOCKET_URL || getApiBase()
}

export function useRuntimeConfig() {
  return {
    public: {
      apiBase: getApiBase(),
      socketUrl: getSocketUrl(),
    },
  }
}
