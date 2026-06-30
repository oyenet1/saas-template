/// <reference types="astro/client" />

import type { SessionUser } from './lib/auth-client'

declare global {
  namespace App {
    interface Locals {
      user: SessionUser | null
    }
  }
}

export {}
