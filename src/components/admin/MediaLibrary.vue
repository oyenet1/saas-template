<script setup lang="ts">
import { adminRequest } from '../../lib/admin-api'
import { useTenant } from '../../composables/useTenant'
import { useConfirm } from '../../composables/useConfirm'
import ConfirmDialog from '../../components/ConfirmDialog.vue'

const { bootstrap } = useTenant()
const confirm = useConfirm()
const loading = ref(true)
const items = ref<Record<string, unknown>[]>([])
const tab = ref<'images' | 'videos'>('images')
const toast = useToast()

async function load() {
  loading.value = true
  await bootstrap()
  const res = await adminRequest<Record<string, unknown[]>>(`/api/v1/media?perPage=100&type=${tab.value}`)
  const data = res.data as Record<string, unknown[]> | undefined
  items.value = (data?.[`${tab.value}`] as Record<string, unknown>[]) ?? []
  loading.value = false
}

watch(tab, load)

async function remove(id: number) {
  const ok = await confirm.confirm('Delete this item?')
  if (!ok) return
  const res = await adminRequest(`/api/v1/media/${id}`, { method: 'DELETE' })
  if (!res.success) {
    toast.add({ title: 'Delete failed', description: res.message, color: 'error' })
    return
  }
  toast.add({ title: 'Deleted', color: 'success' })
  await load()
}

onMounted(load)
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <UTabs
        :items="[
          { label: 'Images', slot: 'images', value: 'images' },
          { label: 'Videos', slot: 'videos', value: 'videos' },
        ]"
        v-model="tab"
      />
      <p class="text-sm text-muted">{{ items.length }} item(s)</p>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-primary" />
    </div>
    <div v-else-if="!items.length" class="p-12 text-center text-muted border border-dashed border-[var(--surface-border)] rounded-xl">No {{ tab }} uploaded yet.</div>
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      <div v-for="item in items" :key="String(item.id)" class="group relative rounded-xl border border-[var(--surface-border)] overflow-hidden bg-elevated">
        <div v-if="tab === 'images'" class="aspect-square">
          <img
            :src="(item.url as string) || (item.path as string) || ''"
            :alt="(item.alt as string) || (item.name as string) || ''"
            class="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        <div v-else class="aspect-square flex items-center justify-center bg-muted/20">
          <span class="i-lucide-video size-10 text-muted" />
        </div>
        <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-trash-2" class="text-white hover:text-error" @click="remove(item.id as number)" />
        </div>
        <div class="px-2 py-1.5">
          <p class="text-xs truncate text-muted">{{ (item.name as string) || (item.filename as string) || 'Untitled' }}</p>
        </div>
      </div>
    </div>
    <ConfirmDialog :confirm="confirm" />
  </div>
</template>
