<script setup lang="ts">
import { adminRequest } from '../../lib/admin-api'
import { useTenant } from '../../composables/useTenant'

const props = defineProps<{ propertyId: number }>()

interface PropertyImage {
  id: number
  url: string
  altText?: string | null
  caption?: string | null
}

interface PropertyVideo {
  id: number
  url: string
  title?: string | null
  provider?: string | null
}

const { bootstrap } = useTenant()
const toast = useToast()

const loading = ref(true)
const uploadingImages = ref(false)
const uploadingVideos = ref(false)
const attachingVideo = ref(false)

const images = ref<PropertyImage[]>([])
const videos = ref<PropertyVideo[]>([])

const imageInput = ref<HTMLInputElement | null>(null)
const videoInput = ref<HTMLInputElement | null>(null)

const externalVideoUrl = ref('')
const externalVideoTitle = ref('')

function mediaPath(kind: 'images' | 'videos') {
  return `/api/v1/media/property/${props.propertyId}/${kind}`
}

function isFileVideo(url: string): boolean {
  return /\.(mp4|webm|mov|m4v|ogg)(\?|#|$)/i.test(url)
}

function inferVideoProvider(url: string): 'youtube' | 'vimeo' | 'other' {
  const normalized = url.toLowerCase()
  if (normalized.includes('youtube.com') || normalized.includes('youtu.be')) return 'youtube'
  if (normalized.includes('vimeo.com')) return 'vimeo'
  return 'other'
}

async function load() {
  loading.value = true
  await bootstrap()
  const [imageRes, videoRes] = await Promise.all([
    adminRequest<{ images: PropertyImage[] }>(mediaPath('images')),
    adminRequest<{ videos: PropertyVideo[] }>(mediaPath('videos')),
  ])
  images.value = imageRes.data?.images ?? []
  videos.value = videoRes.data?.videos ?? []
  loading.value = false
}

async function uploadImageFiles(files: File[]) {
  if (!files.length) return
  uploadingImages.value = true
  try {
    for (const file of files) {
      const formData = new FormData()
      formData.append('file', file)
      const res = await adminRequest<{ image: PropertyImage }>(`${mediaPath('images')}/upload`, {
        method: 'POST',
        body: formData,
      })
      if (!res.success) {
        throw new Error(res.message)
      }
    }
    toast.add({ title: 'Images uploaded', color: 'success', icon: 'i-lucide-check-circle-2' })
    await load()
  } catch (error) {
    toast.add({
      title: 'Image upload failed',
      description: error instanceof Error ? error.message : 'Unable to upload images',
      color: 'error',
    })
  } finally {
    uploadingImages.value = false
    if (imageInput.value) imageInput.value.value = ''
  }
}

async function uploadVideoFiles(files: File[]) {
  if (!files.length) return
  uploadingVideos.value = true
  try {
    for (const file of files) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', file.name.replace(/\.[^.]+$/, ''))
      const res = await adminRequest<{ video: PropertyVideo }>(`${mediaPath('videos')}/upload`, {
        method: 'POST',
        body: formData,
      })
      if (!res.success) {
        throw new Error(res.message)
      }
    }
    toast.add({ title: 'Videos uploaded', color: 'success', icon: 'i-lucide-check-circle-2' })
    await load()
  } catch (error) {
    toast.add({
      title: 'Video upload failed',
      description: error instanceof Error ? error.message : 'Unable to upload videos',
      color: 'error',
    })
  } finally {
    uploadingVideos.value = false
    if (videoInput.value) videoInput.value.value = ''
  }
}

async function attachExternalVideo() {
  if (!externalVideoUrl.value.trim()) return
  attachingVideo.value = true
  const url = externalVideoUrl.value.trim()
  const res = await adminRequest<{ video: PropertyVideo }>(mediaPath('videos'), {
    method: 'POST',
    body: {
      url,
      title: externalVideoTitle.value.trim() || undefined,
      provider: inferVideoProvider(url),
    },
  })
  attachingVideo.value = false
  if (!res.success) {
    toast.add({ title: 'Video link failed', description: res.message, color: 'error' })
    return
  }
  externalVideoUrl.value = ''
  externalVideoTitle.value = ''
  toast.add({ title: 'Video linked', color: 'success', icon: 'i-lucide-check-circle-2' })
  await load()
}

async function removeImage(id: number) {
  const res = await adminRequest<{ image: PropertyImage }>(`${mediaPath('images')}/${id}`, { method: 'DELETE' })
  if (!res.success) {
    toast.add({ title: 'Delete failed', description: res.message, color: 'error' })
    return
  }
  images.value = images.value.filter((image) => image.id !== id)
}

async function removeVideo(id: number) {
  const res = await adminRequest<{ video: PropertyVideo }>(`${mediaPath('videos')}/${id}`, { method: 'DELETE' })
  if (!res.success) {
    toast.add({ title: 'Delete failed', description: res.message, color: 'error' })
    return
  }
  videos.value = videos.value.filter((video) => video.id !== id)
}

function onImageSelected(event: Event) {
  const target = event.target as HTMLInputElement
  uploadImageFiles(Array.from(target.files ?? []))
}

function onVideoSelected(event: Event) {
  const target = event.target as HTMLInputElement
  uploadVideoFiles(Array.from(target.files ?? []))
}

onMounted(load)
</script>

<template>
  <section class="pt-6 border-t border-[var(--surface-border)] space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 class="text-lg font-semibold">Media</h2>
        <p class="text-sm text-muted mt-1">Upload listing photos to storage or attach a hosted video tour.</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <input ref="imageInput" type="file" accept="image/*" multiple class="hidden" @change="onImageSelected" />
        <input ref="videoInput" type="file" accept="video/mp4,video/webm,video/quicktime,video/x-m4v,video/ogg" multiple class="hidden" @change="onVideoSelected" />
        <UButton
          size="sm"
          color="primary"
          icon="i-lucide-image-plus"
          label="Upload images"
          :loading="uploadingImages"
          @click="imageInput?.click()"
        />
        <UButton
          size="sm"
          color="neutral"
          variant="outline"
          icon="i-lucide-video"
          label="Upload videos"
          :loading="uploadingVideos"
          @click="videoInput?.click()"
        />
      </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]">
      <div class="space-y-6">
        <div>
          <div class="flex items-center justify-between gap-3 mb-3">
            <h3 class="text-sm font-semibold">Images</h3>
            <span class="text-xs text-muted">{{ images.length }} file(s)</span>
          </div>
          <div v-if="loading" class="py-10 text-sm text-muted">Loading media…</div>
          <div
            v-else-if="!images.length"
            class="rounded-lg border border-dashed border-[var(--surface-border)] px-4 py-10 text-sm text-muted"
          >
            No images uploaded yet.
          </div>
          <div v-else class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <article
              v-for="image in images"
              :key="image.id"
              class="overflow-hidden rounded-lg border border-[var(--surface-border)] bg-[var(--surface-muted)]"
            >
              <img :src="image.url" :alt="image.altText || 'Property image'" class="aspect-[4/3] w-full object-cover" loading="lazy" />
              <div class="flex items-center justify-between gap-3 px-3 py-2">
                <p class="min-w-0 truncate text-xs text-muted">{{ image.caption || image.altText || 'Uploaded image' }}</p>
                <UButton size="xs" color="error" variant="ghost" icon="i-lucide-trash-2" @click="removeImage(image.id)" />
              </div>
            </article>
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between gap-3 mb-3">
            <h3 class="text-sm font-semibold">Videos</h3>
            <span class="text-xs text-muted">{{ videos.length }} item(s)</span>
          </div>
          <div
            v-if="!videos.length && !loading"
            class="rounded-lg border border-dashed border-[var(--surface-border)] px-4 py-10 text-sm text-muted"
          >
            No videos attached yet.
          </div>
          <div v-else class="grid gap-4">
            <article
              v-for="video in videos"
              :key="video.id"
              class="overflow-hidden rounded-lg border border-[var(--surface-border)] bg-[var(--surface-muted)]"
            >
              <div v-if="isFileVideo(video.url)" class="aspect-video bg-black">
                <video :src="video.url" class="h-full w-full" controls preload="metadata" />
              </div>
              <div v-else class="flex items-center gap-3 px-4 py-4">
                <UIcon name="i-lucide-video" class="size-5 text-primary" />
                <a :href="video.url" target="_blank" rel="noreferrer" class="min-w-0 flex-1 truncate text-sm text-primary hover:underline">
                  {{ video.title || video.url }}
                </a>
              </div>
              <div class="flex items-center justify-between gap-3 px-4 py-3 border-t border-[var(--surface-border)]">
                <p class="min-w-0 truncate text-xs text-muted">{{ video.title || video.provider || 'Video tour' }}</p>
                <UButton size="xs" color="error" variant="ghost" icon="i-lucide-trash-2" @click="removeVideo(video.id)" />
              </div>
            </article>
          </div>
        </div>
      </div>

      <div class="space-y-3">
        <h3 class="text-sm font-semibold">Attach external video</h3>
        <UFormField label="Video URL">
          <UInput v-model="externalVideoUrl" size="lg" class="w-full" placeholder="https://youtube.com/..." />
        </UFormField>
        <UFormField label="Title">
          <UInput v-model="externalVideoTitle" size="lg" class="w-full" placeholder="Optional title" />
        </UFormField>
        <UButton
          size="lg"
          color="neutral"
          variant="outline"
          icon="i-lucide-link"
          label="Attach link"
          :loading="attachingVideo"
          @click="attachExternalVideo"
        />
      </div>
    </div>
  </section>
</template>
