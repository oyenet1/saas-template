# LodgeStatus V2 — Vue Frontend (`vue-copy`)

Vue 3 + Vite SPA that mirrors the Nuxt 4 frontend in `../frontend/`, talking to the
Hono backend at `/v1/*` endpoints. This is a **carbon copy** of the Nuxt app
without the Nuxt framework — every page, composable, store, and component is
ported 1:1, and Nuxt's auto-import magic is replaced by explicit
`unplugin-auto-import` + `unplugin-vue-components` configured inside
`@nuxt/ui/vite`.

## 🚀 Quick start

```bash
bun install
cp .env.example .env   # set VITE_API_BASE / VITE_SOCKET_URL
bun run dev            # http://localhost:5173
```

Build:

```bash
bun run build          # type-check + production build
bun run preview        # serve dist/
bun run typecheck      # vue-tsc --noEmit
```

## 🛠 Tech stack

| Layer | Choice |
|---|---|
| Framework | Vue 3.5 + Vite 7 |
| UI kit | `@nuxt/ui` 4 (Vue plugin + Vite plugin) |
| Router | `vue-router` 4 + `unplugin-vue-router` (file-based) |
| State | `pinia` + `@pinia/colada` |
| Auto-imports | `unplugin-auto-import` + `unplugin-vue-components` (bundled in `@nuxt/ui/vite`) |
| Charts | `vue-echarts` + `echarts` |
| Maps | `@vue-leaflet/vue-leaflet` + `leaflet` |
| Editor | `@tiptap/vue-3` + extensions |
| Realtime | `socket.io-client` |
| Image CDN | `@unpic/vue` + `unpic/providers/cloudflare_images` |
| Types | TypeScript 5.6 + `vue-tsc` |

## 🔁 Nuxt → Vue module mapping

| Nuxt module | Vue replacement | Why |
|---|---|---|
| `@nuxt/image` (`<NuxtImg>`) | `<R2Img>` → `@unpic/vue` + `unpic/providers/cloudflare_images` | Same CDN-aware transforms, no Nuxt runtime needed |
| `@nuxt/ui` | `@nuxt/ui/vue-plugin` + `@nuxt/ui/vite` (with `ui({...})` config) | Identical component library |
| `@nuxtjs/device` (`useDevice()`) | `@vueuse/core` (`useMediaQuery`, `useBreakpoints`) | Real breakpoints > UA sniffing |
| `@nuxtjs/leaflet` | `@vue-leaflet/vue-leaflet` | Registered globally in `main.ts` |
| `@pinia/nuxt` | `pinia` + autoImport `dirs: ['./src/stores']` | Stores auto-imported |
| `nuxt-echarts` | `vue-echarts` + `echarts/core` | Register only what you use |
| `nuxt-tiptap-editor` | `@tiptap/vue-3` + extensions | Build your own `<Editor>` wrapper |
| `definePageMeta()` | `~/composables/definePageMeta` (auto-imported stub) | Real meta handled by `unplugin-vue-router` |
| `navigateTo()` | `~/composables/navigateTo` (auto-imported) | Wraps `router.push/replace` |
| `useRuntimeConfig()` | `~/composables/useRuntimeConfig` (auto-imported) | Reads `import.meta.env.VITE_*` |
| `useFetch()` / `useState()` / `useCookie()` | `$fetch` (ofetch) / `ref` / `useStorage` (VueUse) | All auto-imported |
| `<NuxtLink>` | `~/components/NuxtLink.vue` (auto-imported) | Thin `<RouterLink>` wrapper |
| `<ClientOnly>` | `~/components/ClientOnly.vue` (auto-imported) | Mounts on `onMounted` |
| `<NuxtRouteAnnouncer>` | _removed_ | App is SPA — no route announce needed |
| `nitro-cloudflare-dev` | Plain Vite dev/build | Deploy to any static host |

## 🖼 `<R2Img>` — Cloudflare Images component

`src/components/R2Img.vue` replaces Nuxt's `<NuxtImg>` and is the only image
component you should use. It auto-detects Cloudflare Images URLs
(`imagedelivery.net/<hash>/<id>/<variant>`) and applies the requested
transformations via `unpic/providers/cloudflare_images`. Any other URL falls
back to a plain `<img>`.

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `src` | `string` | — | Image URL (Cloudflare Images or any URL) |
| `alt` | `string` | `''` | Alt text |
| `width` | `number \| string` | — | Render width (intrinsic layout) |
| `height` | `number \| string` | — | Render height |
| `aspectRatio` | `number` | — | e.g. `16/9` → `1.78` |
| `layout` | `'constrained' \| 'fullWidth' \| 'fixed'` | `'constrained'` | `@unpic/vue` layout mode |
| `loading` | `'lazy' \| 'eager'` | `'lazy'` | Native loading attribute |
| `background` | `string` | — | Background colour while loading |
| `objectFit` | `CSS object-fit` | `'cover'` | Inner `<img>` fit |
| `sizes` | `string` | — | Responsive sizes attribute |
| `operations` | `R2ImgOperations` | — | Cloudflare transformation params |
| `variant` | `string` | — | Cloudflare Images **named variant** (overrides `operations`) |
| `placeholder` | `'blur' \| 'empty' \| string` | — | See placeholder section below |

### `R2ImgOperations` (Cloudflare transformations)

Full list of supported transformations. All are optional and merged into the
final URL. See [Cloudflare Images docs](https://developers.cloudflare.com/images/transformations/)
for details.

```ts
interface R2ImgOperations {
  width?: number              // 1–2000
  height?: number             // 1–2000
  fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad'
  gravity?: 'auto' | 'side' | 'top' | 'bottom' | 'left' | 'right'
  quality?: number            // 1–100
  format?: 'auto' | 'webp' | 'avif' | 'jpeg' | 'png' | 'json'
  dpr?: number                // 1–3 (device pixel ratio)
  sharpen?: number            // 0–10
  blur?: number               // 1–250
  rotate?: 0 | 90 | 180 | 270
  background?: string         // CSS colour, used with fit=pad
  metadata?: 'keep' | 'copyright' | 'none'
  [key: string]: string | number | undefined
}
```

### Placeholders

| Value | Behaviour |
|---|---|
| `'blur'` | Fetches a tiny `width=20, quality=10, blur=50` Cloudflare variant and renders it under the real image with Tailwind `blur-2xl scale-110`. Fades out as the real image loads. Only works with Cloudflare URLs. |
| `'empty'` | Solid neutral background (`#f1f5f9`). No network request. |
| `'/my-placeholder.png'` | Uses your custom URL. |
| `undefined` | No placeholder. |

### Examples

**Basic hero banner with full Cloudflare transformations:**

```vue
<R2Img
  src="https://imagedelivery.net/abc123/hotel-hero/PUBLIC_ID"
  width="1920"
  height="800"
  :operations="{
    width: 1920,
    height: 800,
    fit: 'cover',
    gravity: 'auto',
    quality: 85,
    format: 'auto',
    dpr: 2,
    metadata: 'none',
  }"
  placeholder="blur"
  sizes="(max-width: 768px) 100vw, 1920px"
  class="w-full h-auto"
/>
```

Renders as:
```
https://imagedelivery.net/abc123/hotel-hero/PUBLIC_ID/w=1920,h=800,fit=cover,g=auto,q=85,f=auto,dpr=2,metadata=none
```

**Avatar using a named Cloudflare variant** (define `avatar` in your
Cloudflare Images dashboard):

```vue
<R2Img
  :src="user.avatarUrl"
  variant="avatar"
  width="80"
  height="80"
  fit="cover"
  gravity="auto"
  class="rounded-full"
/>
```

**Product thumbnail, no placeholder, eager-loaded:**

```vue
<R2Img
  :src="product.image"
  width="400"
  height="400"
  fit="cover"
  format="webp"
  :quality="75"
  loading="eager"
/>
```

**Gallery image, lazy + blur placeholder:**

```vue
<R2Img
  v-for="image in gallery"
  :key="image.id"
  :src="image.url"
  width="600"
  height="400"
  fit="cover"
  gravity="auto"
  format="webp"
  :quality="70"
  placeholder="blur"
  class="rounded-lg"
/>
```

**Plain local asset** (no Cloudflare URL — falls back to a regular `<img>`):

```vue
<R2Img src="/logo.png" alt="LodgeStatus" class="h-14" />
```

### How it works internally

1. The component checks if `src` is an absolute URL on `imagedelivery.net`.
2. If yes, it sets the `@unpic/vue` `transformer` prop to the
   `cloudflare_images` provider from `unpic`, and forwards `operations` to it.
3. If `variant` is set, it's added to the operations (Cloudflare resolves the
   variant to its own width/height/fit rules).
4. If `placeholder="blur"`, a parallel `<img>` is rendered with a tiny blurred
   Cloudflare URL and `blur-2xl` Tailwind class.
5. For non-Cloudflare URLs, `transformer` is `undefined` so `@unpic/vue` falls
   back to a plain `<img>`.

## 📁 Project structure

```
vue-copy/
├── index.html
├── vite.config.ts          # @nuxt/ui/vite + autoImport + vue-router
├── auto-imports.d.ts      # generated
├── components.d.ts        # generated
├── typed-router.d.ts      # generated
└── src/
    ├── main.ts            # createApp + Pinia + Colada + Router + UI plugin
    ├── App.vue            # Root layout switcher (auth | default | dashboard | launch)
    ├── assets/css/        # Tailwind entry
    ├── components/        # Auto-imported (NuxtLink, NuxtImg→R2Img, ClientOnly, …)
    ├── composables/       # Auto-imported (useApi, useAuthStore, …)
    ├── layouts/           # auth, default, dashboard, launch
    ├── pages/             # File-based routes via unplugin-vue-router
    │   └── admin/         # All admin sub-routes
    ├── router/guards.ts   # Auth middleware (beforeEach)
    ├── shared/utils/      # Auto-imported utilities
    ├── stores/            # Pinia stores (auto-imported)
    ├── types/             # #imports virtual module declarations
    └── utils/             # Auto-imported utils
```

## 🔐 Auth flow

`src/router/guards.ts` runs before every navigation:

1. Calls `auth.hydrate()` to read tokens from sessionStorage.
2. Public routes (`/`, `/sign-in`, `/sign-up`, `/forgot-password`, `/otp`,
   `/reset-password`) are always accessible.
3. Authenticated users hitting `/sign-in` or `/sign-up` are redirected to
   `/dashboard` (or `?redirect=…` if present).
4. Protected routes without a token → `/sign-in?redirect=<fullPath>`.
5. Protected routes with a token but no user → tries `auth.ensureSession()`
   (which refreshes the token on 401 and re-fetches `/v1/auth/profile`).

## 🌐 API contract

- **Base URL:** `VITE_API_BASE` (defaults to `http://127.0.0.1:3004`)
- **Socket URL:** `VITE_SOCKET_URL` (defaults to the API base)
- **Auth header:** `Authorization: Bearer <accessToken>` (added automatically
  by `useAuthenticatedFetch()`)
- **Envelope:** `{ success, message, data, statusCode }`
- **Pagination:** `data.meta.pagination`
- **Validation (422):** `data.errors[fieldName] = [msg]`

All `useApi().call()` and `useAuthenticatedFetch().call()` responses
automatically surface the server `message` as a toast (success or error).
422 responses with `fieldErrors` are mapped to form inputs.

## 🛡 Conventions

- **Status colors:** `maintenance` = `#000000`; `dirty`/`checkout` = `#64748B`;
  `refund` = `#EF4444` (same as `cancelled`).
- **Auto-imports:** never manually import from `./composables/*`, `./stores/*`,
  `./utils/*`, `./shared/utils/*`, or Vue/Vue Router/Pinia/`@nuxt/ui` globals.
  The `unplugin-auto-import` config in `vite.config.ts` handles it.
- **API errors:** every mutation shows the real server message in a toast.
  No generic/default messages in form fields. No error toasts for
  GET/HEAD/OPTIONS.
- **APIs:** all requests go to `/v1/*` (not `/v2/*` like the Nuxt frontend).

## 📦 Build & deploy

```bash
bun run build
# Outputs dist/ — deploy to any static host (Cloudflare Pages, Netlify, S3+CDN, …)
```

The output is a fully static SPA. Configure your host to redirect all
unknown paths to `/index.html` so `vue-router`'s HTML5 history mode works.

## 📚 Additional resources

- [@unpic/vue docs](https://unpic.pics/) — image component
- [Cloudflare Images transformations](https://developers.cloudflare.com/images/transformations/)
- [Nuxt UI v4 docs](https://ui.nuxt.com/)
- [Pinia Colada](https://pinia-colada.esm.dev/) — async state management
- [unplugin-auto-import](https://github.com/unplugin/unplugin-auto-import)

---

Built with ❤️ using Vue 3, Nuxt UI, and Cloudflare Images.
