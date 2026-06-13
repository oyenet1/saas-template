<script setup lang="ts">
import { CalendarDate, DateFormatter, getLocalTimeZone, type DateValue } from '@internationalized/date'
import EmptyState from '~/components/EmptyState.vue'

definePageMeta({ layout: 'dashboard' })

const colorMode = useColorMode()
const tz = getLocalTimeZone()

type DateRange = { start: DateValue; end: DateValue }

const periodTabs = [
  { label: 'Today', value: 'daily' },
  { label: 'This Week', value: 'weekly' },
  { label: 'This Month', value: 'monthly' },
  { label: 'This Year', value: 'yearly' },
]

const period = ref<string>('daily')

const periodLabel = computed(() => {
  const map: Record<string, string> = { daily: 'Today', weekly: 'This Week', monthly: 'This Month', yearly: 'This Year' }
  return map[period.value]
})

const dateRange = shallowRef<DateRange>({
  start: new CalendarDate(2025, 1, 1),
  end: new CalendarDate(2025, 6, 12),
})

const df = new DateFormatter('en-US', { day: 'numeric', month: 'short', year: 'numeric' })

const dateLabel = computed(() => {
  const { start, end } = dateRange.value
  if (!start && !end) return 'Select dates'
  if (start && !end) return df.format(start.toDate(tz))
  return `${df.format(start!.toDate(tz))}  —  ${df.format(end!.toDate(tz))}`
})

const textColor = computed(() => (colorMode.value === 'dark' ? '#CBD5E1' : '#475569'))
const borderColor = computed(() => (colorMode.value === 'dark' ? '#334155' : '#E2E8F0'))
const areaTopColor = computed(() => (colorMode.value === 'dark' ? 'rgba(79,121,168,.35)' : 'rgba(79,121,168,.15)'))
const areaBottomColor = computed(() => (colorMode.value === 'dark' ? 'rgba(79,121,168,0)' : 'rgba(79,121,168,0)'))

const kpis = computed(() => {
  const map: Record<string, { arrivals: number; occupancy: number; revenue: string; checkouts: number }> = {
    daily:   { arrivals: 12, occupancy: 78, revenue: '₦1.2M',  checkouts: 8 },
    weekly:  { arrivals: 84, occupancy: 74, revenue: '₦8.7M',  checkouts: 56 },
    monthly: { arrivals: 342, occupancy: 76, revenue: '₦34.5M', checkouts: 240 },
    yearly:  { arrivals: 4104, occupancy: 73, revenue: '₦412M', checkouts: 2880 },
  }
  const d = map[period.value]
  return [
    { label: 'Arrivals', value: String(d.arrivals), sub: `${periodLabel.value}`, icon: 'i-heroicons-arrow-down-tray', bgClass: 'bg-primary/10', iconClass: 'text-primary' },
    { label: 'Occupancy Rate', value: `${d.occupancy}%`, sub: '142 / 182 rooms', icon: 'i-heroicons-home', bgClass: 'bg-emerald-500/10', iconClass: 'text-emerald-500' },
    { label: 'Revenue', value: d.revenue, sub: `+12% vs last ${period.value === 'daily' ? 'day' : period.value}`, icon: 'i-heroicons-banknotes', bgClass: 'bg-amber-500/10', iconClass: 'text-amber-500' },
    { label: 'Check-outs', value: String(d.checkouts), sub: `${Math.round(d.checkouts * 0.08)} overdue`, icon: 'i-heroicons-arrow-up-tray', bgClass: 'bg-red-500/10', iconClass: 'text-red-500' },
  ]
})

const HOURS = ['00h','02h','04h','06h','08h','10h','12h','14h','16h','18h','20h','22h']
const DAYS  = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const WEEKS = ['W1','W2','W3','W4','W5']
const DAYS30 = Array.from({ length: 30 }, (_, i) => `${i + 1}`)
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function rand(lo: number, hi: number) { return Math.floor(Math.random() * (hi - lo + 1)) + lo }
function randf(lo: number, hi: number) { return +(lo + Math.random() * (hi - lo)).toFixed(1) }

const revenueLineOption = computed(() => {
  let xLabels: string[], thisYear: number[], lastYear: number[]
  if (period.value === 'daily') {
    xLabels = HOURS; thisYear = xLabels.map(() => randf(0.05, 0.2)); lastYear = xLabels.map(() => randf(0.04, 0.15))
  } else if (period.value === 'weekly') {
    xLabels = DAYS;   thisYear = xLabels.map(() => randf(1.0, 1.6));   lastYear = xLabels.map(() => randf(0.8, 1.3))
  } else if (period.value === 'monthly') {
    xLabels = DAYS30; thisYear = xLabels.map(() => randf(0.08, 0.4));  lastYear = xLabels.map(() => randf(0.06, 0.3))
  } else {
    xLabels = MONTHS; thisYear = [2.8,3.1,3.5,3.9,4.2,4.8,5.1,5.6,5.2,6.0,6.5,7.2]; lastYear = [2.2,2.5,2.8,3.0,3.3,3.6,3.9,4.2,4.0,4.5,4.8,5.1]
  }
  return {
    tooltip: { trigger: 'axis' as const, valueFormatter: (v: unknown) => `₦${v}M` },
    legend: { bottom: 0, textStyle: { color: textColor.value, fontSize: 11 }, itemWidth: 10, itemHeight: 10 },
    grid: { left: '3%', right: '4%', bottom: '14%', top: '8%', containLabel: true },
    xAxis: { type: 'category' as const, data: xLabels, axisLine: { lineStyle: { color: borderColor.value } }, axisLabel: { color: textColor.value, fontSize: 10, rotate: xLabels.length > 12 ? 45 : 0 }, axisTick: { show: false } },
    yAxis: { type: 'value' as const, name: '₦M', nameTextStyle: { color: textColor.value, fontSize: 11 }, splitLine: { lineStyle: { color: borderColor.value, type: 'dashed' as const } }, axisLabel: { color: textColor.value, fontSize: 11 } },
    series: [
      { name: '2025', type: 'line', data: thisYear, smooth: true, symbolSize: period.value === 'daily' ? 2 : 4, itemStyle: { color: '#4F79A8' }, lineStyle: { color: '#4F79A8', width: 2 }, areaStyle: { color: { type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: areaTopColor.value }, { offset: 1, color: areaBottomColor.value }] } } },
      { name: '2024', type: 'line', data: lastYear, smooth: true, symbolSize: period.value === 'daily' ? 2 : 4, itemStyle: { color: '#A3BAD6' }, lineStyle: { color: '#A3BAD6', width: 1.5, type: 'dashed' as const } },
    ],
  }
})

const bookingBarOption = computed(() => {
  let xLabels: string[], values: number[]
  if (period.value === 'daily')     { xLabels = HOURS;  values = xLabels.map(() => rand(0, 5)) }
  else if (period.value === 'weekly') { xLabels = DAYS;    values = xLabels.map(() => rand(4, 14)) }
  else if (period.value === 'monthly'){ xLabels = DAYS30;  values = xLabels.map(() => rand(1, 6)) }
  else { xLabels = MONTHS; values = [28,32,38,35,42,48,52,56,44,50,58,64] }
  return {
    tooltip: { trigger: 'axis' as const },
    grid: { left: '3%', right: '4%', bottom: '8%', top: '8%', containLabel: true },
    xAxis: { type: 'category' as const, data: xLabels, axisLine: { lineStyle: { color: borderColor.value } }, axisLabel: { color: textColor.value, fontSize: 10, rotate: xLabels.length > 12 ? 45 : 0 }, axisTick: { show: false } },
    yAxis: { type: 'value' as const, name: 'Bookings', nameTextStyle: { color: textColor.value, fontSize: 11 }, splitLine: { lineStyle: { color: borderColor.value, type: 'dashed' as const } }, axisLabel: { color: textColor.value, fontSize: 11 } },
    series: [{ type: 'bar', data: values, itemStyle: { color: '#4F79A8', borderRadius: [3, 3, 0, 0] }, barWidth: xLabels.length > 12 ? '70%' : '40%' }],
  }
})

const roomStatusData = [
  { value: 108, name: 'Available',   color: '#FFFFFF' },
  { value: 76,  name: 'Occupied',    color: '#3B82F6' },
  { value: 18,  name: 'Paid',        color: '#10B981' },
  { value: 10,  name: 'Unpaid',      color: '#F59E0B' },
  { value: 4,   name: 'Dirty',       color: '#64748B' },
  { value: 3,   name: 'Maintenance', color: '#000000' },
  { value: 2,   name: 'Checked Out', color: '#64748B' },
  { value: 1,   name: 'Cancelled',   color: '#EF4444' },
]

const roomTotal = computed(() => roomStatusData.reduce((sum, d) => sum + d.value, 0))

const roomDonutOption = computed(() => ({
  tooltip: { trigger: 'item' as const },
  graphic: [{
    type: 'text' as const,
    left: 'center',
    top: '40%',
    style: {
      text: `${roomTotal.value}`,
      textAlign: 'center' as const,
      fill: textColor.value,
      fontSize: 28,
      fontWeight: 'bold',
    },
  }, {
    type: 'text' as const,
    left: 'center',
    top: '52%',
    style: {
      text: 'Rooms',
      textAlign: 'center' as const,
      fill: textColor.value,
      fontSize: 12,
    },
  }],
  legend: { bottom: 0, textStyle: { color: textColor.value, fontSize: 14 }, itemWidth: 10, itemHeight: 10 },
  series: [{
    type: 'pie',
    radius: ['55%', '78%'],
    center: ['50%', '40%'],
    avoidLabelOverlap: false,
    itemStyle: { borderColor: 'transparent', borderWidth: 0 },
    label: { show: false },
    emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
    data: roomStatusData.map(d => ({ value: d.value, name: `${d.name} · ${d.value}`, itemStyle: { color: d.color } })),
  }],
}))

const cityPieOption = computed(() => {
  const periodMultiplier = period.value === 'daily' ? 1 : period.value === 'weekly' ? 7 : period.value === 'monthly' ? 30 : 365
  const base = [142, 98, 56, 34, 22]
  return {
    tooltip: { trigger: 'item' as const, formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, textStyle: { color: textColor.value, fontSize: 14 }, itemWidth: 10, itemHeight: 10 },
    series: [{ type: 'pie', radius: ['0%','70%'], center: ['50%','42%'], itemStyle: { borderColor: 'transparent', borderWidth: 0 }, label: { show: false }, emphasis: { label: { show: true, fontSize: 13, fontWeight: 'bold' } },
      data: [
        { value: base[0] * periodMultiplier, name: 'Lagos',      itemStyle: { color: '#4F79A8' } },
        { value: base[1] * periodMultiplier, name: 'Abuja',      itemStyle: { color: '#7196BF' } },
        { value: base[2] * periodMultiplier, name: 'P/Harcourt', itemStyle: { color: '#A3BAD6' } },
        { value: base[3] * periodMultiplier, name: 'Kano',       itemStyle: { color: '#C89B3C' } },
        { value: base[4] * periodMultiplier, name: 'Enugu',      itemStyle: { color: '#3D608C' } },
      ],
    }],
  }
})

const occupancyAreaOption = computed(() => {
  let xLabels: string[], values: number[]
  if (period.value === 'daily')       { xLabels = HOURS; values = xLabels.map(() => randf(55, 92)) }
  else if (period.value === 'weekly')   { xLabels = DAYS;   values = xLabels.map(() => randf(62, 88)) }
  else if (period.value === 'monthly')  { xLabels = WEEKS;  values = xLabels.map(() => randf(68, 85)) }
  else { xLabels = MONTHS; values = [74,76,78,77,82,80,76,72,78,81,83,85] }
  return {
    tooltip: { trigger: 'axis' as const, valueFormatter: (v: unknown) => `${v}%` },
    grid: { left: '3%', right: '4%', bottom: '8%', top: '8%', containLabel: true },
    xAxis: { type: 'category' as const, data: xLabels, axisLine: { lineStyle: { color: borderColor.value } }, axisLabel: { color: textColor.value, fontSize: 10 }, axisTick: { show: false } },
    yAxis: { type: 'value' as const, min: 40, max: 100, name: '%', nameTextStyle: { color: textColor.value, fontSize: 11 }, splitLine: { lineStyle: { color: borderColor.value, type: 'dashed' as const } }, axisLabel: { color: textColor.value, fontSize: 11, formatter: '{value}%' } },
    series: [{ type: 'line', data: values, smooth: true, symbolSize: 4, itemStyle: { color: '#4F79A8' }, lineStyle: { color: '#4F79A8', width: 2 }, areaStyle: { color: { type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: areaTopColor.value }, { offset: 1, color: areaBottomColor.value }] } } }],
  }
})

const roomTypeBarOption = computed(() => {
  const mult = period.value === 'daily' ? 1 : period.value === 'weekly' ? 7 : period.value === 'monthly' ? 30 : 365
  return {
    tooltip: { trigger: 'axis' as const, valueFormatter: (v: unknown) => `₦${(v as number).toLocaleString()}` },
    grid: { left: '3%', right: '8%', bottom: '8%', top: '8%', containLabel: true },
    xAxis: { type: 'value' as const, name: '₦', nameTextStyle: { color: textColor.value, fontSize: 11 }, splitLine: { lineStyle: { color: borderColor.value, type: 'dashed' as const } }, axisLabel: { color: textColor.value, fontSize: 11, formatter: (v: number) => `₦${(v / 1000000).toFixed(1)}M` } },
    yAxis: { type: 'category' as const, data: ['Standard','Deluxe','Executive','Suite','Penthouse'], axisLine: { lineStyle: { color: borderColor.value } }, axisLabel: { color: textColor.value, fontSize: 11 }, axisTick: { show: false }, inverse: true },
    series: [{ type: 'bar', barWidth: '55%',
      data: [
        { value: 350000 * mult, itemStyle: { color: '#A3BAD6', borderRadius: [0,4,4,0] } },
        { value: 580000 * mult, itemStyle: { color: '#7196BF', borderRadius: [0,4,4,0] } },
        { value: 280000 * mult, itemStyle: { color: '#4F79A8', borderRadius: [0,4,4,0] } },
        { value: 175000 * mult, itemStyle: { color: '#3D608C', borderRadius: [0,4,4,0] } },
        { value: 95000  * mult, itemStyle: { color: '#C89B3C', borderRadius: [0,4,4,0] } },
      ],
    }],
  }
})

const tableData = [
  { name: 'Savannah Nguyen', role: 'Guest', status: 'Awaiting' },
  { name: 'Jenny Wilson', role: 'Receptionist', status: 'Completed' },
  { name: 'Marvin McKinney', role: 'Receptionist', status: 'Completed' },
  { name: 'Ronald Richards', role: 'Manager', status: 'Draft' },
]
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p class="text-xs uppercase tracking-widest text-muted">12th June, 2025</p>
        <h1 class="text-2xl font-bold mt-1">Dashboard</h1>
        <p class="text-sm text-muted mt-1 max-w-xl">
          Overview of hotel operations for {{ periodLabel.toLowerCase() }}.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <UTabs
          v-model="period"
          :items="periodTabs"
          variant="pill"
          size="xs"
          :content="false"
          color="primary"
          class="min-w-0"
        />

        <UPopover :content="{ align: 'end', side: 'bottom', sideOffset: 6 }">
          <UButton
            color="neutral"
            variant="subtle"
            icon="i-lucide-calendar"
            size="sm"
          >
            {{ dateLabel }}
          </UButton>

          <template #content>
            <UCalendar
              v-model="dateRange"
              :number-of-months="2"
              range
              class="p-2"
            />
          </template>
        </UPopover>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <UCard v-for="kpi in kpis" :key="kpi.label">
        <div class="flex items-center gap-3">
          <div class="size-10 rounded-xl grid place-items-center shrink-0" :class="kpi.bgClass">
            <UIcon :name="kpi.icon" class="size-5" :class="kpi.iconClass" />
          </div>
          <div class="min-w-0">
            <p class="text-xs text-muted truncate">{{ kpi.label }}</p>
            <p class="font-bold text-2xl">{{ kpi.value }}</p>
            <p class="text-[11px] text-muted">{{ kpi.sub }}</p>
          </div>
        </div>
      </UCard>
    </div>

    <UCard>
      <template #header>
        <div class="flex items-center justify-between flex-wrap gap-2">
          <h2 class="font-semibold text-lg">Revenue Comparison</h2>
          <span class="text-xs text-muted">2025 vs 2024 · {{ periodLabel }}</span>
        </div>
      </template>
      <ClientOnly>
        <VChart class="w-full" :option="revenueLineOption" autoresize :style="{ height: '320px' }" />
        <template #fallback>
          <div class="h-80 animate-pulse rounded-lg bg-default/20" />
        </template>
      </ClientOnly>
    </UCard>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="font-semibold text-lg">Bookings</h2>
            <span class="text-xs text-muted">{{ periodLabel }}</span>
          </div>
        </template>
        <ClientOnly>
          <VChart class="w-full" :option="bookingBarOption" autoresize :style="{ height: '280px' }" />
          <template #fallback>
            <div class="h-72 animate-pulse rounded-lg bg-default/20" />
          </template>
        </ClientOnly>
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="font-semibold text-lg">Room Status</h2>
            <span class="text-xs text-muted">182 rooms</span>
          </div>
        </template>
        <ClientOnly>
          <VChart class="w-full" :option="roomDonutOption" autoresize :style="{ height: '280px' }" />
          <template #fallback>
            <div class="h-72 animate-pulse rounded-lg bg-default/20" />
          </template>
        </ClientOnly>
      </UCard>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="font-semibold text-lg">Bookings by City</h2>
            <span class="text-xs text-muted">{{ periodLabel }}</span>
          </div>
        </template>
        <ClientOnly>
          <VChart class="w-full" :option="cityPieOption" autoresize :style="{ height: '280px' }" />
          <template #fallback>
            <div class="h-72 animate-pulse rounded-lg bg-default/20" />
          </template>
        </ClientOnly>
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="font-semibold text-lg">Occupancy Trend</h2>
            <span class="text-xs text-muted">% capacity</span>
          </div>
        </template>
        <ClientOnly>
          <VChart class="w-full" :option="occupancyAreaOption" autoresize :style="{ height: '280px' }" />
          <template #fallback>
            <div class="h-72 animate-pulse rounded-lg bg-default/20" />
          </template>
        </ClientOnly>
      </UCard>
    </div>

    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="font-semibold text-lg">Revenue by Room Type</h2>
          <span class="text-xs text-muted">{{ periodLabel }}</span>
        </div>
      </template>
      <ClientOnly>
        <VChart class="w-full" :option="roomTypeBarOption" autoresize :style="{ height: '300px' }" />
        <template #fallback>
          <div class="h-72 animate-pulse rounded-lg bg-default/20" />
        </template>
      </ClientOnly>
    </UCard>

    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="font-semibold text-lg">Recent Operations</h2>
          <UBadge variant="subtle" color="primary">4 items</UBadge>
        </div>
      </template>
      <div class="overflow-x-auto">
        <UTable
          :data="tableData"
          :columns="[
            { accessorKey: 'name', header: 'Name' },
            { accessorKey: 'role', header: 'Role' },
            { accessorKey: 'status', header: 'Status' },
          ]"
          :ui="{ td: 'py-2.5 first:pl-0 last:pr-0', tr: 'border-b border-default last:border-0' }"
        >
          <template #status-cell="{ row }">
            <UBadge
              :color="row.original.status === 'Completed' ? 'success' : row.original.status === 'Awaiting' ? 'warning' : 'neutral'"
              variant="subtle"
              size="xs"
            >
              {{ row.original.status }}
            </UBadge>
          </template>
        </UTable>
      </div>
    </UCard>
  </div>
</template>
