type StatusKey =
  | 'available'
  | 'checked_in'
  | 'occupied'
  | 'paid'
  | 'unpaid'
  | 'partial'
  | 'dirty'
  | 'maintenance'
  | 'checkout'
  | 'cancelled'
  | string

interface StatusColor {
  name: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'
  hex: string
  bgClass: string
  textClass: string
  variant: 'solid' | 'soft' | 'subtle' | 'outline'
}

const STATUS_MAP: Record<string, StatusColor> = {
  available:   { name: 'neutral',   hex: '#FFFFFF',  bgClass: 'bg-white dark:bg-gray-900',   textClass: 'text-gray-700 dark:text-gray-200', variant: 'outline' },
  checked_in:  { name: 'info',      hex: '#3B82F6',  bgClass: 'bg-[#3B82F6]',               textClass: 'text-[#3B82F6]',   variant: 'subtle' },
  occupied:    { name: 'info',      hex: '#3B82F6',  bgClass: 'bg-[#3B82F6]',               textClass: 'text-[#3B82F6]',   variant: 'subtle' },
  paid:        { name: 'success',   hex: '#10B981',  bgClass: 'bg-[#10B981]',               textClass: 'text-[#10B981]',   variant: 'subtle' },
  unpaid:      { name: 'warning',   hex: '#F59E0B',  bgClass: 'bg-[#F59E0B]',               textClass: 'text-[#F59E0B]',   variant: 'subtle' },
  partial:     { name: 'warning',   hex: '#F59E0B',  bgClass: 'bg-[#F59E0B]',               textClass: 'text-[#F59E0B]',   variant: 'soft' },
  dirty:       { name: 'neutral',   hex: '#64748B',  bgClass: 'bg-[#64748B]',               textClass: 'text-[#64748B]',   variant: 'subtle' },
  maintenance: { name: 'neutral',   hex: '#000000',  bgClass: 'bg-black',                   textClass: 'text-black',        variant: 'solid' },
  checkout:    { name: 'neutral',   hex: '#64748B',  bgClass: 'bg-[#64748B]',               textClass: 'text-[#64748B]',   variant: 'solid' },
  cancelled:   { name: 'error',     hex: '#EF4444',  bgClass: 'bg-[#EF4444]',               textClass: 'text-[#EF4444]',   variant: 'subtle' },
  refund:      { name: 'error',     hex: '#EF4444',  bgClass: 'bg-[#EF4444]',               textClass: 'text-[#EF4444]',   variant: 'subtle' },
}

const DEFAULT_STATUS: StatusColor = {
  name: 'neutral', hex: '#94A3B8', bgClass: 'bg-[#94A3B8]', textClass: 'text-[#94A3B8]', variant: 'subtle',
}

export function useStatusColor(status: StatusKey): StatusColor {
  return STATUS_MAP[status.toLowerCase()] ?? DEFAULT_STATUS
}

export function useStatusLabel(status: StatusKey): string {
  const map: Record<string, string> = {
    available:   'Available',
    checked_in:  'Checked In',
    occupied:    'Occupied',
    paid:        'Paid',
    unpaid:      'Unpaid',
    partial:     'Partial Payment',
    dirty:       'Dirty',
    maintenance: 'Maintenance',
    checkout:    'Checked Out',
    cancelled:   'Cancelled',
    refund:      'Refund',
  }
  return map[status.toLowerCase()] ?? status
}
