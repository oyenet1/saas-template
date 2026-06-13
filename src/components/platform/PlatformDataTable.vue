<script setup lang="ts">
type SortDir = 'asc' | 'desc'

const props = defineProps<{
  columns: any[]
  data: any[]
  loading?: boolean
  total?: number
  page?: number
  perPage?: number
  emptyTitle?: string
  emptyDescription?: string
  emptyIcon?: string
  rowKey?: string
  striped?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:page', value: number): void
  (e: 'update:perPage', value: number): void
  (e: 'update:sort', value: { column: string; direction: SortDir }): void
  (e: 'row-click', row: any): void
}>()

const localPage = computed({
  get: () => props.page ?? 1,
  set: (v) => emit('update:page', v),
})
const localPerPage = computed({
  get: () => props.perPage ?? 24,
  set: (v) => emit('update:perPage', v),
})

const totalPages = computed(() => {
  const t = props.total ?? 0
  const p = localPerPage.value
  return Math.max(1, Math.ceil(t / p))
})

const firstRow = computed(() => ((localPage.value - 1) * localPerPage.value) + 1)
const lastRow = computed(() => Math.min(localPage.value * localPerPage.value, props.total ?? 0))

const sort = ref<{ column: string; direction: SortDir } | null>(null)

function onSort(column: any) {
  if (!column || column.sortable === false) return
  const id = (column.accessorKey || column.id) as string
  if (!id) return
  if (sort.value?.column === id) {
    sort.value = { column: id, direction: sort.value.direction === 'asc' ? 'desc' : 'asc' }
  } else {
    sort.value = { column: id, direction: 'asc' }
  }
  emit('update:sort', sort.value)
}

function next() {
  if (localPage.value < totalPages.value) localPage.value += 1
}
function prev() {
  if (localPage.value > 1) localPage.value -= 1
}

const perPageOptions = [10, 24, 50, 100, 200]
</script>

<template>
  <div class="space-y-3">
    <div
      class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden"
    >
      <UTable
        :columns="columns"
        :data="data"
        :loading="loading"
        :striped="striped"
        :ui="{
          th: 'text-xs font-semibold tracking-wide uppercase text-muted whitespace-nowrap',
          td: 'text-sm',
        }"
        @sort="onSort"
      >
        <template v-for="(_, slotName) in $slots" #[slotName]="slotProps">
          <slot :name="slotName" v-bind="slotProps" />
        </template>
      </UTable>

      <div
        v-if="(data?.length ?? 0) === 0 && !loading"
        class="py-12 px-6 flex flex-col items-center text-center"
      >
        <UIcon
          :name="emptyIcon || 'i-heroicons-inbox'"
          class="size-10 text-muted"
        />
        <p class="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
          {{ emptyTitle || 'No results' }}
        </p>
        <p v-if="emptyDescription" class="text-xs text-muted mt-1 max-w-sm">
          {{ emptyDescription }}
        </p>
      </div>
    </div>

    <div class="flex items-center justify-between gap-3 flex-wrap">
      <div class="text-xs text-muted">
        <span v-if="(data?.length ?? 0) > 0">
          Showing <span class="font-semibold text-gray-900 dark:text-white">{{ firstRow }}</span>
          – <span class="font-semibold text-gray-900 dark:text-white">{{ lastRow }}</span>
          of <span class="font-semibold text-gray-900 dark:text-white">{{ total ?? 0 }}</span>
        </span>
        <span v-else>No records</span>
      </div>
      <div class="flex items-center gap-2">
        <USelect
          v-model="localPerPage"
          :items="perPageOptions.map((n) => ({ label: `${n} / page`, value: n }))"
          size="xs"
          class="w-32"
        />
        <div class="flex items-center gap-1">
          <UButton
            icon="i-heroicons-chevron-left"
            size="xs"
            color="neutral"
            variant="soft"
            :disabled="localPage <= 1"
            @click="prev"
          />
          <span class="text-xs text-muted px-2">
            {{ localPage }} / {{ totalPages }}
          </span>
          <UButton
            icon="i-heroicons-chevron-right"
            size="xs"
            color="neutral"
            variant="soft"
            :disabled="localPage >= totalPages"
            @click="next"
          />
        </div>
      </div>
    </div>
  </div>
</template>
