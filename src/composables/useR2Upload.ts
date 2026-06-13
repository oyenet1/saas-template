/**
 * useR2Upload — upload files directly to R2 via presigned URLs.
 *
 * ─── Two upload patterns are supported ───────────────────────────────
 *
 * 1️⃣  Single-step (legacy / simple cases):
 *     const url = await uploadFile(file, { folder: 'avatars' })
 *     → validate → sign → upload → confirm, all in one call.
 *     ⚠️  Uploads immediately even if the surrounding form has
 *     validation errors. Use only when the upload is the whole
 *     interaction (e.g. avatar picker).
 *
 * 2️⃣  Two-step (recommended for forms):
 *     // Step 1 — when the user picks a file (in the @change handler):
 *     const pending = await prepareUpload(file, { folder: 'hotels/hero' })
 *     formUploads.add('hero', pending)
 *
 *     // Step 2 — AFTER form validation passes, in the submit handler:
 *     if (!await form.validate()) return
 *     const urls = await formUploads.commitAll()   // uploads + confirms
 *     await call('/v1/hotels', { method: 'PUT', body: { ..., heroImage: urls.hero } })
 *
 *     ✅ Files are never uploaded when the form has errors.
 *
 * The server never sees the file content. Only the public URL is
 * passed to the business-logic endpoint.
 */

export interface SignParams {
  /** Folder/path prefix (e.g. "avatars", "rooms", "hotels") */
  folder?: string
  /** File extension (e.g. "jpg", "png", "webp") */
  ext?: string
}

interface SignResult {
  provider: 'r2'
  url: string
  key: string
  publicUrl: string
  expiresIn: number
}

interface ConfirmParams {
  url: string
  key?: string
}

export interface UploadProgress {
  /** 0-100 percentage */
  percent: number
  /** Uploaded bytes */
  loaded: number
  /** Total bytes */
  total: number
}

/**
 * Lifecycle of a file that has been selected but not yet uploaded
 * (the two-step pattern). Tracked in the UI so the user sees when a
 * file is being prepared, uploading, or ready.
 */
export type PendingUploadStatus = 'pending' | 'uploading' | 'uploaded' | 'error'

export interface PendingUpload {
  /** Stable key the page uses to reference this file (e.g. 'logo', 'hero') */
  key: string
  /** The original file the user picked */
  file: File
  /** Result of the sign() call — presigned URL + metadata */
  signResult: SignResult
  /** Current status of this pending upload */
  status: PendingUploadStatus
  /** Set when status === 'error' */
  error?: string
  /** Set when status === 'uploaded' */
  publicUrl?: string
}

/**
 * Upload limits by plan tier.
 */
const PLAN_LIMITS = {
  starter:  { maxBytes: 5 * 1024 * 1024,  allowVideo: false, label: '5 MB' },
  standard: { maxBytes: 15 * 1024 * 1024, allowVideo: true,  label: '15 MB' },
  enterprise: { maxBytes: 50 * 1024 * 1024, allowVideo: true, label: '50 MB' },
} as const

type PlanTier = keyof typeof PLAN_LIMITS

export function useR2Upload() {
  const { call } = useApi()
  const toast = useToast()
  const { on: socketOn } = useSocket()

  /**
   * Step 1: request a presigned PUT URL from the backend.
   */
  async function sign(
    params: SignParams = {},
    opts: { silent?: boolean; silentSuccess?: boolean; silentError?: boolean } = {},
  ): Promise<SignResult> {
    const query = new URLSearchParams()
    if (params.folder) query.set('folder', params.folder)
    if (params.ext) query.set('ext', params.ext)

    const result = await call<SignResult>(
      `/v2/users/generate-signature?${query.toString()}`,
      { method: 'POST' },
      opts,
    )
    return result.data
  }

  /**
   * Step 2: PUT the file directly to R2 using the presigned URL.
   */
  async function upload(
    file: File | Blob,
    result: SignResult,
    onProgress?: (p: UploadProgress) => void,
  ): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress({
            percent: Math.round((e.loaded / e.total) * 100),
            loaded: e.loaded,
            total: e.total,
          })
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(result.publicUrl)
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`))
        }
      })

      xhr.addEventListener('error', () => reject(new Error('Upload failed — network error')))
      xhr.addEventListener('abort', () => reject(new Error('Upload aborted')))

      xhr.open('PUT', result.url)
      xhr.setRequestHeader('Content-Type', (file as File).type || 'application/octet-stream')
      xhr.send(file)
    })
  }

  /**
   * Step 3: confirm the upload with the backend.
   */
  async function confirm(
    params: ConfirmParams,
    opts: { silent?: boolean; silentSuccess?: boolean; silentError?: boolean } = {},
  ): Promise<{ url: string; key?: string }> {
    const result = await call<{ url: string; key?: string }>(
      '/v2/users/confirm-upload',
      { method: 'POST', body: { url: params.url, key: params.key } },
      opts,
    )
    return result.data
  }

  /**
   * Validate a file against the user's plan limits.
   * Returns null if valid, or an error string if rejected.
   */
  function validate(file: { size: number; type?: string }, planTier?: PlanTier): string | null {
    const tier = (planTier || 'starter') as PlanTier
    const limit = PLAN_LIMITS[tier]

    if (file.size > limit.maxBytes) {
      return `File is too large. Your plan allows up to ${limit.label} per file.`
    }

    if (!limit.allowVideo && file.type?.startsWith('video/')) {
      return 'Video upload is not supported on your current plan.'
    }

    return null
  }

  /**
   * Convenience: validate → sign → upload → confirm in one call.
   * Use only when the upload IS the whole interaction — for anything
   * tied to a form, use prepareUpload + commitUpload (see top of file).
   */
  async function uploadFile(
    file: File | Blob,
    params: SignParams & { planTier?: PlanTier } = {},
    onProgress?: (p: UploadProgress) => void,
    opts: { silent?: boolean; silentSuccess?: boolean; silentError?: boolean } = { silentSuccess: true },
  ): Promise<string> {
    // 1) Validate against plan limits
    const error = validate(file as File, params.planTier)
    if (error) {
      if (!opts.silent) {
        toast.add({
          title: error,
          icon: 'i-heroicons-exclamation-triangle',
          color: 'warning',
        })
      }
      throw new Error(error)
    }

    // 2) Get presigned URL
    const ext = params.ext || (file instanceof File ? file.name.split('.').pop() : undefined) || 'jpg'
    const signResult = await sign({ folder: params.folder, ext }, opts)

    // 3) PUT to R2
    const publicUrl = await upload(file, signResult, onProgress)

    // 4) Confirm
    await confirm({ url: publicUrl, key: signResult.key }, opts)

    return publicUrl
  }

  /**
   * Step 1 of the two-step pattern: validate the file and request a
   * presigned URL from the backend. No upload happens here — the file
   * is held in memory and a {@link PendingUpload} is returned. The
   * page should store this and only call {@link commitUpload} once the
   * surrounding form has passed validation.
   */
  async function prepareUpload(
    key: string,
    file: File,
    params: SignParams & { planTier?: PlanTier } = {},
  ): Promise<PendingUpload> {
    // 1) Local validation — surface errors immediately so the user
    //    doesn't bother filling out the rest of the form.
    const error = validate(file, params.planTier)
    if (error) {
      toast.add({
        title: error,
        icon: 'i-heroicons-exclamation-triangle',
        color: 'warning',
      })
      throw new Error(error)
    }

    // 2) Request the presigned URL (silent — we haven't actually
    //    uploaded anything yet, the prepare step is silent by design)
    const ext = params.ext || file.name.split('.').pop() || 'jpg'
    const signResult = await sign(
      { folder: params.folder, ext },
      { silent: true },
    )

    return {
      key,
      file,
      signResult,
      status: 'pending',
    }
  }

  /**
   * Step 2 of the two-step pattern: PUT the file to R2 and confirm
   * with the backend. Returns the public URL on success. Throws on
   * failure — callers should catch and surface the message to the
   * form. The pending item is mutated in place so the UI sees the
   * new status.
   */
  async function commitUpload(
    pending: PendingUpload,
    opts: { silent?: boolean; silentError?: boolean } = {},
  ): Promise<string> {
    if (pending.status === 'uploaded' && pending.publicUrl) {
      return pending.publicUrl
    }

    pending.status = 'uploading'
    try {
      const publicUrl = await upload(pending.file, pending.signResult)
      await confirm({ url: publicUrl, key: pending.signResult.key }, { silent: true })
      pending.status = 'uploaded'
      pending.publicUrl = publicUrl
      return publicUrl
    } catch (e) {
      pending.status = 'error'
      pending.error = e instanceof Error ? e.message : 'Upload failed'
      if (!opts.silent) {
        toast.add({
          title: 'Upload failed',
          description: pending.error,
          icon: 'i-heroicons-exclamation-triangle',
          color: 'error',
        })
      }
      throw e
    }
  }

  /**
   * Upload a video through the backend (not directly to R2).
   * The backend uploads to R2 server-side and emits a socket event
   * `upload:video:complete` when done.
   *
   * @param file     The video file
   * @param onDone   Optional callback invoked when the socket confirms completion
   */
  async function uploadVideo(
    file: File,
    onDone?: (result: { url: string; key: string }) => void,
  ): Promise<string> {
    const form = new FormData()
    form.append('video', file)

    // Listen for socket completion before it happens
    const off = socketOn('upload:video:complete', (data: any) => {
      if (data?.url) {
        off()
        if (onDone) onDone({ url: data.url, key: data.key })
      }
    })

    try {
      const result = await call<{ url: string; key: string }>(
        '/v2/users/upload-video',
        { method: 'POST', body: form },
        { success: false },
      )
      return result.data.url
    } catch (e: any) {
      off()
      throw e
    }
  }

  return { sign, upload, confirm, validate, uploadFile, uploadVideo, prepareUpload, commitUpload }
}
