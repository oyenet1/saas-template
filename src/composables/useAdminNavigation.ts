import type { NavigationMenuItem } from '@nuxt/ui'

type NavSeed = {
  label: string
  icon?: string
  to: string
  exact?: boolean
  badge?: string | number
  children?: NavSeed[]
}

type AdminNavigationOptions = {
  isSuperAdmin?: boolean
  isCustomerCare?: boolean
}

const tooltip = { content: { side: 'right' as const }, arrow: true }

const hotelOperationsGroups: NavSeed[][] = [
  [
    {
      label: 'Dashboard',
      icon: 'i-heroicons-home',
      to: '/admin',
      exact: true,
    },
  ],
  [
    {
      label: 'Front Desk',
      icon: 'i-heroicons-building-storefront',
      to: '/admin/front-desk',
      children: [
        { label: 'Bookings', to: '/admin/bookings' },
        { label: 'Reservations', to: '/admin/bookings/reservations' },
        { label: 'Check-ins', to: '/admin/bookings/check-ins' },
        { label: 'Check-outs', to: '/admin/bookings/check-outs' },
        { label: 'Walk-ins', to: '/admin/bookings/walk-ins' },
        { label: 'Payment Desk', to: '/admin/bookings/payments' },
      ],
    },
    {
      label: 'Property',
      icon: 'i-heroicons-building-office-2',
      to: '/admin/property',
      children: [
        { label: 'Hotels', to: '/admin/property/hotels' },
        { label: 'Rooms', to: '/admin/property/rooms' },
        { label: 'Room Types', to: '/admin/property/room-types' },
        { label: 'Availability', to: '/admin/property/availability' },
        { label: 'Pricing', to: '/admin/property/pricing' },
        { label: 'Floors', to: '/admin/property/floors' },
        { label: 'Halls', to: '/admin/property/halls' },
        { label: 'Online Booking Channels', to: '/admin/property/channel-manager' },
        { label: 'Smart TV', to: '/admin/property/smart-tv' },
        { label: 'QR Codes & Access', to: '/admin/property/access' },
      ],
    },
    {
      label: 'Guest Management',
      icon: 'i-heroicons-users',
      to: '/admin/guests',
      children: [
        { label: 'Guest Directory', to: '/admin/guests/directory' },
        { label: 'Customers', to: '/admin/guests/customers' },
        { label: 'Visitors', to: '/admin/guests/visitors' },
        { label: 'Ratings', to: '/admin/guests/ratings' },
        { label: 'Favourite Hotels', to: '/admin/guests/favourites' },
      ],
    },
  ],
  [
    {
      label: 'Operations',
      icon: 'i-heroicons-wrench-screwdriver',
      to: '/admin/operations',
      children: [
        { label: 'Housekeeping', to: '/admin/operations/housekeeping' },
        { label: 'Maintenance', to: '/admin/operations/maintenance' },
        { label: 'Events', to: '/admin/operations/events' },
        { label: 'Suppliers', to: '/admin/operations/suppliers' },
        { label: 'Notifications', to: '/admin/operations/notifications' },
      ],
    },
    {
      label: 'HR',
      icon: 'i-heroicons-user-group',
      to: '/admin/team',
      children: [
        { label: 'Staff Directory', to: '/admin/team/staff' },
        { label: 'Access Control', to: '/admin/team/permissions' },
      ],
    },
    {
      label: 'Finance',
      icon: 'i-heroicons-banknotes',
      to: '/admin/finance',
      children: [
        { label: 'Finance Overview', to: '/admin/finance' },
        { label: 'Invoices', to: '/admin/finance/invoices' },
        { label: 'Point of Sale', to: '/admin/finance/pos' },
        { label: 'Charges', to: '/admin/finance/charges' },
        { label: 'Refund Requests', to: '/admin/finance/refunds' },
        { label: 'Payouts', to: '/admin/finance/payouts' },
        { label: 'Bank Transfer Accounts', to: '/admin/finance/virtual-accounts' },
        { label: 'Sales', to: '/admin/finance/sales' },
        { label: 'Income Categories', to: '/admin/finance/revenues' },
        { label: 'Expenses', to: '/admin/finance/expenditures' },
        { label: 'Vouchers', to: '/admin/finance/vouchers' },
        { label: 'Subscriptions', to: '/admin/finance/subscriptions' },
        { label: 'Payment Methods', to: '/admin/finance/hotel-gateways' },
        { label: 'Banks', to: '/admin/finance/banks' },
      ],
    },
  ],
  [
    {
      label: 'Insights',
      icon: 'i-heroicons-chart-bar-square',
      to: '/admin/insights',
      children: [
        { label: 'Business Overview', to: '/admin/insights/analytics' },
        { label: 'Income Trends', to: '/admin/insights/revenue-trends' },
        { label: 'Booking Reports', to: '/admin/insights/bookings' },
        { label: 'Customer Reports', to: '/admin/insights/customers' },
        { label: 'Reports', to: '/admin/insights/reports' },
        { label: 'Exports', to: '/admin/insights/exports' },
        { label: 'Activity Logs', to: '/admin/insights/activity-logs' },
      ],
    },
    {
      label: 'Content',
      icon: 'i-heroicons-photo',
      to: '/admin/content',
      children: [
        { label: 'Gallery', to: '/admin/content/gallery' },
        { label: 'Social Media', to: '/admin/content/social-media' },
        { label: 'Articles', to: '/admin/content/articles' },
      ],
    },
  ],
  [
    {
      label: 'Settings',
      icon: 'i-heroicons-cog-6-tooth',
      to: '/admin/settings',
      children: [
        { label: 'General', to: '/admin/settings' },
        { label: 'Profile', to: '/admin/settings/profile' },
        { label: 'Billing', to: '/admin/settings/billing' },
        { label: 'Notifications', to: '/admin/settings/notifications' },
        { label: 'Security', to: '/admin/settings/security' },
      ],
    },
  ],
]

// Super-admin only — full platform control
const superAdminPlatformGroups: NavSeed[][] = [
  [
    {
      label: 'Platform HQ',
      icon: 'i-heroicons-command-line',
      to: '/platform',
      exact: true,
    },
    {
      label: 'Tenants & Hotels',
      icon: 'i-heroicons-building-office-2',
      to: '/platform/hotels',
      children: [
        { label: 'All Hotels', to: '/platform/hotels' },
        { label: 'Platform Staff', to: '/platform/staff' },
        { label: 'Locations', to: '/platform/locations' },
      ],
    },
  ],
  [
    {
      label: 'Commercial',
      icon: 'i-heroicons-credit-card',
      to: '/platform/subscriptions',
      children: [
        { label: 'Subscriptions', to: '/platform/subscriptions' },
        { label: 'Plans', to: '/platform/plans' },
        { label: 'Invoices', to: '/platform/invoices' },
      ],
    },
    {
      label: 'People',
      icon: 'i-heroicons-user-group',
      to: '/platform/customers',
      children: [
        { label: 'Customers', to: '/platform/customers' },
        { label: 'Bookings', to: '/platform/bookings' },
      ],
    },
  ],
  [
    {
      label: 'Activity',
      icon: 'i-heroicons-pulse',
      to: '/platform/activity-logs',
      children: [
        { label: 'Activity Logs', to: '/platform/activity-logs' },
        { label: 'Failed Jobs', to: '/platform/failed-jobs' },
      ],
    },
  ],
]

// Customer-care only — narrower surface, no plans management
const customerCarePlatformGroups: NavSeed[][] = [
  [
    {
      label: 'Platform HQ',
      icon: 'i-heroicons-command-line',
      to: '/platform',
      exact: true,
    },
    {
      label: 'Tenants & Hotels',
      icon: 'i-heroicons-building-office-2',
      to: '/platform/hotels',
      children: [
        { label: 'All Hotels', to: '/platform/hotels' },
        { label: 'Locations', to: '/platform/locations' },
      ],
    },
  ],
  [
    {
      label: 'People',
      icon: 'i-heroicons-user-group',
      to: '/platform/customers',
      children: [
        { label: 'Customers', to: '/platform/customers' },
        { label: 'Bookings', to: '/platform/bookings' },
      ],
    },
    {
      label: 'Commercial',
      icon: 'i-heroicons-credit-card',
      to: '/platform/subscriptions',
      children: [
        { label: 'Subscriptions', to: '/platform/subscriptions' },
        { label: 'Invoices', to: '/platform/invoices' },
      ],
    },
  ],
  [
    {
      label: 'Activity',
      icon: 'i-heroicons-pulse',
      to: '/platform/activity-logs',
      children: [
        { label: 'Activity Logs', to: '/platform/activity-logs' },
        { label: 'Failed Jobs', to: '/platform/failed-jobs' },
      ],
    },
  ],
]

const hotelMobileSeeds: NavSeed[] = [
  { label: 'Dashboard', icon: 'i-heroicons-home', to: '/admin', exact: true },
  { label: 'Bookings', icon: 'i-heroicons-calendar-days', to: '/admin/bookings' },
  { label: 'Finance', icon: 'i-heroicons-banknotes', to: '/admin/finance' },
  { label: 'Reports', icon: 'i-heroicons-chart-bar', to: '/admin/insights/reports' },
  { label: 'HR', icon: 'i-heroicons-user-group', to: '/admin/team/staff' },
]

const superAdminMobileSeeds: NavSeed[] = [
  { label: 'HQ', icon: 'i-heroicons-command-line', to: '/platform' },
  { label: 'Hotels', icon: 'i-heroicons-building-office-2', to: '/platform/hotels' },
  { label: 'Billing', icon: 'i-heroicons-credit-card', to: '/platform/subscriptions' },
  { label: 'Plans', icon: 'i-heroicons-rectangle-stack', to: '/platform/plans' },
  { label: 'Activity', icon: 'i-heroicons-pulse', to: '/platform/activity-logs' },
]

const customerCareMobileSeeds: NavSeed[] = [
  { label: 'HQ', icon: 'i-heroicons-command-line', to: '/platform' },
  { label: 'Hotels', icon: 'i-heroicons-building-office-2', to: '/platform/hotels' },
  { label: 'Customers', icon: 'i-heroicons-user-group', to: '/platform/customers' },
  { label: 'Bookings', icon: 'i-heroicons-calendar-days', to: '/platform/bookings' },
  { label: 'Activity', icon: 'i-heroicons-pulse', to: '/platform/activity-logs' },
]

function isActivePath(currentPath: string, targetPath: string, exact = false) {
  if (exact) return currentPath === targetPath
  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`)
}

function decorateItem(item: NavSeed, currentPath: string): NavigationMenuItem {
  const children = item.children?.map(child => decorateItem(child, currentPath))
  const selfActive = isActivePath(currentPath, item.to, item.exact)
  const childActive = children?.some(child => Boolean(child.active)) ?? false

  return {
    label: item.label,
    icon: item.icon,
    to: item.to,
    badge: item.badge,
    active: selfActive || childActive,
    defaultOpen: children?.length ? selfActive || childActive : undefined,
    tooltip,
    children,
  }
}

export function getAdminSidebarNavigation(
  currentPath: string,
  options: AdminNavigationOptions = {},
): NavigationMenuItem[][] {
  if (options.isSuperAdmin) {
    return [...superAdminPlatformGroups, ...hotelOperationsGroups].map(group =>
      group.map(item => decorateItem(item, currentPath)),
    )
  }

  if (options.isCustomerCare) {
    return customerCarePlatformGroups.map(group =>
      group.map(item => decorateItem(item, currentPath)),
    )
  }

  return hotelOperationsGroups.map(group =>
    group.map(item => decorateItem(item, currentPath)),
  )
}

export function getAdminMobileNavigation(
  currentPath: string,
  options: AdminNavigationOptions = {},
) {
  if (options.isSuperAdmin) {
    return superAdminMobileSeeds.map(item => ({
      label: item.label,
      icon: item.icon,
      to: item.to,
      active: isActivePath(currentPath, item.to, item.exact),
    }))
  }
  if (options.isCustomerCare) {
    return customerCareMobileSeeds.map(item => ({
      label: item.label,
      icon: item.icon,
      to: item.to,
      active: isActivePath(currentPath, item.to, item.exact),
    }))
  }
  return hotelMobileSeeds.map(item => ({
    label: item.label,
    icon: item.icon,
    to: item.to,
    active: isActivePath(currentPath, item.to, item.exact),
  }))
}
