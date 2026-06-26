/// <reference types="astro/client" />

import type { SessionUser } from './lib/auth-client'

declare namespace App {
  interface Locals {
    user: SessionUser | null
  }
}
