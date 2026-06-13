/**
 * useFormFileUpload — form-aware two-step file upload state.
 *
 * Solves the "don't upload files when the form has errors" problem.
 *
 * Usage in a page:
 *
 *   const fileUploads = useFormFileUpload()
 *
 *   // Step 1: When the user picks a file (in the @change handler):
 *   async function onHeroChange(e: Event) {
 *     const file = (e.target as HTMLInputElement).files?.[0]
 *     if (!file) return
 *     try {
 *       await fileUploads.add('hero', file, { folder: 'hotels/hero' })
 *       // file is now prepared (validated + signed), but NOT uploaded
 *     } catch { // validation error already toasted
 *     }
 *   }
 *
 *   // Step 2: In the form submit handler, AFTER form validation passes:
 *   async function onSubmit() {
 *     if (!await form.validate()) return       // form validation FIRST
 *     const urls = await fileUploads.commitAll()  // only uploads if form is valid
 *     await call('/v1/hotels', {
 *       method: 'PUT',
 *       body: { name: state.name, heroImage: urls.hero, ... },
 *     })
 *   }
 *
 *   // Step 3: In the template, show the preview + status from fileUploads.items
 *
 *   <img :src="fileUploads.get('hero')?.publicUrl" />
 *   <span v-if="fileUploads.get('hero')?.status === 'uploading'">Uploading…</span>
 */
import { ref, computed } from 'vue'
import type { PendingUpload, SignParams } from './useR2Upload'
import { useR2Upload } from './useR2Upload'

export type FileUploadKey = string

export function useFormFileUpload() {
  const { prepareUpload, commitUpload } = useR2Upload()

  /** Pending uploads keyed by the page-supplied key (e.g. 'logo', 'hero'). */
  const items = ref<Map<FileUploadKey, PendingUpload>>(new Map())

  /** Whether any upload is currently in flight. */
  const uploading = ref(false)

  /** Has the user picked at least one file? */
  const hasFiles = computed(() => items.value.size > 0)

  /** Any upload currently in the 'error' state? */
  const hasError = computed(() =>
    Array.from(items.value.values()).some(i => i.status === 'error'),
  )

  /** Number of uploads still in 'pending' or 'uploading' state. */
  const pendingCount = computed(() =>
    Array.from(items.value.values()).filter(
      i => i.status === 'pending' || i.status === 'uploading',
    ).length,
  )

  /**
   * Add a file to the pending pool. Validates + signs but does NOT
   * upload. Throws on validation failure (and shows a toast).
   *
   * If a pending upload already exists for the same key, it is replaced.
   */
  async function add(
    key: FileUploadKey,
    file: File,
    params: SignParams = {},
  ): Promise<PendingUpload> {
    const pending = await prepareUpload(key, file, params)
    items.value.set(key, pending)
    // Force reactivity for Map mutations
    items.value = new Map(items.value)
    return pending
  }

  /**
   * Drop a pending upload (e.g. user clicks "remove file" on the preview).
   */
  function remove(key: FileUploadKey) {
    items.value.delete(key)
    items.value = new Map(items.value)
  }

  /**
   * Commit ALL pending uploads in one go. Already-uploaded items are
   * skipped (idempotent), so calling this twice is safe.
   *
   * Returns a map of key → publicUrl. Throws on the first failure
   * (subsequent items are left in 'pending' state for retry).
   */
  async function commitAll(): Promise<Record<FileUploadKey, string>> {
    if (items.value.size === 0) return {}
    uploading.value = true
    try {
      const urls: Record<string, string> = {}
      for (const [key, item] of Array.from(items.value.entries())) {
        urls[key] = await commitUpload(item, { silent: true })
      }
      return urls
    } finally {
      uploading.value = false
    }
  }

  /**
   * Commit a single pending upload by key. Returns the public URL.
   * Useful for partial commits (e.g. one file is required, the other optional).
   */
  async function commitOne(key: FileUploadKey): Promise<string> {
    const item = items.value.get(key)
    if (!item) throw new Error(`No pending upload for key "${key}"`)
    uploading.value = true
    try {
      return await commitUpload(item, { silent: true })
    } finally {
      uploading.value = false
    }
  }

  /**
   * Reset all state (e.g. after a successful form submit).
   */
  function clear() {
    items.value.clear()
    items.value = new Map(items.value)
  }

  /** Read-only access for the template. */
  const get = (key: FileUploadKey) => items.value.get(key)

  return {
    items,
    uploading,
    hasFiles,
    hasError,
    pendingCount,
    add,
    remove,
    commitAll,
    commitOne,
    clear,
    get,
  }
}
