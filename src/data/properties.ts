export interface Property {
  slug: string
  title: string
  type: 'house' | 'apartment' | 'villa' | 'penthouse' | 'land'
  status: 'sale' | 'rent'
  price: number
  bedrooms: number
  bathrooms: number
  area: number
  location: string
  city: string
  description: string
  features: string[]
  images: string[]
  video?: string
  featured: boolean
}

export const properties: Property[] = [
  {
    slug: 'sunset-villa-malibu',
    title: 'Sunset Villa Malibu',
    type: 'villa',
    status: 'sale',
    price: 4850000,
    bedrooms: 6,
    bathrooms: 5,
    area: 5200,
    location: 'Malibu, California',
    city: 'Los Angeles',
    description: 'Perched above the Pacific with panoramic ocean views, this architectural masterpiece blends indoor-outdoor living across 5,200 sq ft. Floor-to-ceiling glass walls frame dramatic sunsets, while a infinity-edge pool appears to merge with the horizon. The gourmet kitchen features Italian marble and Miele appliances. The primary suite occupies an entire wing with a private terrace, his-and-hers walk-in closets, and a spa-inspired bathroom with a soaking tub overlooking the coastline.',
    features: ['Infinity Pool', 'Home Theater', 'Wine Cellar', 'Smart Home', 'EV Charger', 'Ocean View', 'Private Beach Access', 'Outdoor Kitchen'],
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200',
      'https://images.unsplash.com/photo-1600566753086-00f18f6b0058?w=1200',
    ],
    featured: true,
  },
  {
    slug: 'manhattan-sky-penthouse',
    title: 'Manhattan Sky Penthouse',
    type: 'penthouse',
    status: 'sale',
    price: 7200000,
    bedrooms: 4,
    bathrooms: 4,
    area: 3800,
    location: 'Upper East Side, New York',
    city: 'New York',
    description: 'Occupying the entire 42nd floor of a prewar landmark, this penthouse offers 360-degree views of Central Park and the Manhattan skyline. The grand salon features 12-foot ceilings with original crown moldings restored to perfection. A private elevator opens directly into the residence. The chef\'s kitchen boasts Calacatta gold marble and custom walnut cabinetry. Three terraces totaling 1,200 sq ft provide unparalleled outdoor living.',
    features: ['Private Elevator', 'Rooftop Terrace', 'Concierge', 'Central Park Views', 'Wine Room', 'Fitness Center', 'Valet Parking', 'Pet Spa'],
    images: [
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1200',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200',
      'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=1200',
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200',
    ],
    featured: true,
  },
  {
    slug: 'tuscan-hills-estate',
    title: 'Tuscan Hills Estate',
    type: 'villa',
    status: 'sale',
    price: 3150000,
    bedrooms: 5,
    bathrooms: 4,
    area: 4500,
    location: 'Napa Valley, California',
    city: 'Napa',
    description: 'Set among rolling vineyards in the heart of wine country, this Tuscan-inspired estate offers old-world charm with modern luxury. Hand-hewn oak beams, terracotta flooring, and a wood-burning stone fireplace anchor the great room. The grounds feature a century-old olive grove, a private vineyard producing award-winning Cabernet, and a saltwater pool surrounded by lavender gardens.',
    features: ['Vineyard', 'Saltwater Pool', 'Wine Cave', 'Guest House', 'Olive Grove', 'Barn/Stables', 'Solar Powered', 'Gated Entry'],
    images: [
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb144?w=1200',
      'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=1200',
      'https://images.unsplash.com/photo-1600585153490-76fb20a32601?w=1200',
      'https://images.unsplash.com/photo-1600047509782-20d39509f26d?w=1200',
    ],
    featured: true,
  },
  {
    slug: 'sydney-harbour-residence',
    title: 'Sydney Harbour Residence',
    type: 'house',
    status: 'sale',
    price: 5600000,
    bedrooms: 5,
    bathrooms: 3,
    area: 4100,
    location: 'Point Piper, Sydney',
    city: 'Sydney',
    description: 'Commanding a premier waterfront position with direct harbour access, this contemporary residence captures uninterrupted views of the Opera House and Harbour Bridge. Designed by a Pritzker Prize-winning architect, the home features cantilevered living spaces, a floating staircase, and an indoor lap pool with retractable glass walls. The master suite features a private pontoon and boat dock.',
    features: ['Waterfront', 'Boat Dock', 'Indoor Pool', 'Home Office', 'Wine Cellar', 'Smart Home', 'Guest Quarters', 'Landscaped Gardens'],
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200',
      'https://images.unsplash.com/photo-1600566753086-00f18f6b0058?w=1200',
    ],
    featured: false,
  },
  {
    slug: 'parisian-marais-loft',
    title: 'Parisian Marais Loft',
    type: 'apartment',
    status: 'rent',
    price: 8500,
    bedrooms: 3,
    bathrooms: 2,
    area: 1800,
    location: 'Le Marais, Paris',
    city: 'Paris',
    description: 'A meticulously restored 18th-century loft in the heart of Le Marais, where exposed limestone walls meet contemporary minimalism. The double-height living space is bathed in natural light from a restored glass atrium. Original oak parquet floors run throughout. The chef\'s kitchen opens onto a private courtyard garden, a rare sanctuary in central Paris. Walking distance to Place des Vosges and the Seine.',
    features: ['Courtyard Garden', 'Exposed Stone Walls', 'Herringbone Floors', 'Atrium', 'Walk-in Closet', 'Bike Storage', 'Concierge', 'Cellar'],
    images: [
      'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=1200',
      'https://images.unsplash.com/photo-1600585154084-4e5fe7c39198?w=1200',
      'https://images.unsplash.com/photo-1600573472561-d6bb3e2e9a2f?w=1200',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200',
    ],
    featured: false,
  },
  {
    slug: 'aspen-mountain-lodge',
    title: 'Aspen Mountain Lodge',
    type: 'house',
    status: 'rent',
    price: 12000,
    bedrooms: 6,
    bathrooms: 5,
    area: 5500,
    location: 'Aspen, Colorado',
    city: 'Aspen',
    description: 'A ski-in/ski-out lodge with direct access to Aspen Mountain, this timber-frame residence blends rustic elegance with alpine luxury. The great room features a towering two-story stone fireplace and walls of glass framing the Elk Mountain Range. A private hot tub on the snow-covered deck, a home theater, and a game room complete the après-ski experience. Ski valet and heated driveway included.',
    features: ['Ski-in/Ski-out', 'Hot Tub', 'Home Theater', 'Game Room', 'Ski Valet', 'Heated Driveway', 'Mountain Views', 'Fire Pit'],
    images: [
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200',
      'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=1200',
      'https://images.unsplash.com/photo-1600607687644-aac4c3eac7b6?w=1200',
      'https://images.unsplash.com/photo-1600573471969-8c6ea0538e5f?w=1200',
    ],
    featured: false,
  },
  {
    slug: 'tokyo-minato-ward-tower',
    title: 'Tokyo Minato Tower Residence',
    type: 'apartment',
    status: 'sale',
    price: 2800000,
    bedrooms: 3,
    bathrooms: 2,
    area: 2200,
    location: 'Minato Ward, Tokyo',
    city: 'Tokyo',
    description: 'A serene sanctuary on the 35th floor of a landmark tower in Minato Ward, offering panoramic views of Tokyo Tower and Mount Fuji on clear days. The interior, designed by a renowned Japanese studio, features shoji-inspired sliding panels, a tatami meditation room, and an ofuro soaking tub with city views. Building amenities include a 24-hour concierge, rooftop garden, and private dining room.',
    features: ['Mount Fuji View', 'Tatami Room', 'Ofuro Tub', 'Concierge', 'Rooftop Garden', 'Private Dining', 'Earthquake Resistant', 'Parking'],
    images: [
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1200',
      'https://images.unsplash.com/photo-1600210491369-e753d80a41f3?w=1200',
      'https://images.unsplash.com/photo-1600566753086-00f18f6b0058?w=1200',
      'https://images.unsplash.com/photo-1600585153490-76fb20a32601?w=1200',
    ],
    featured: false,
  },
  {
    slug: 'dubai-palm-jumeirah-villa',
    title: 'Dubai Palm Jumeirah Villa',
    type: 'villa',
    status: 'sale',
    price: 8900000,
    bedrooms: 7,
    bathrooms: 8,
    area: 8200,
    location: 'Palm Jumeirah, Dubai',
    city: 'Dubai',
    description: 'An extraordinary beachfront villa on the iconic Palm Jumeirah, featuring a private 25m infinity pool and direct beach access. The double-height entrance foyer with a Swarovski crystal chandelier sets the tone for unparalleled luxury. Each of the seven bedroom suites offers sea views. The basement level houses a 12-seat cinema, a spa with hammam, and a temperature-controlled wine display for 1,500 bottles.',
    features: ['Private Beach', 'Infinity Pool', 'Cinema', 'Hammam Spa', 'Wine Display', 'Elevator', 'Staff Quarters', 'Helipad'],
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200',
      'https://images.unsplash.com/photo-1600566753086-00f18f6b0058?w=1200',
    ],
    video: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    featured: true,
  },
  {
    slug: 'lake-como-waterfront',
    title: 'Lake Como Waterfront Estate',
    type: 'villa',
    status: 'sale',
    price: 6500000,
    bedrooms: 6,
    bathrooms: 6,
    area: 6000,
    location: 'Bellagio, Lake Como',
    city: 'Como',
    description: 'A historic 19th-century villa on the shores of Lake Como, restored to its original splendor with modern sensibilities. Terraced gardens cascade down to a private boat dock. The frescoed ballroom, original Venetian chandeliers, and hand-painted ceilings have been preserved by master artisans. A glass-walled conservatory opens onto a lakeside terrace, perfect for al fresco dining with views of the Italian Alps.',
    features: ['Private Dock', 'Terraced Gardens', 'Boat House', 'Frescoed Ballroom', 'Conservatory', 'Lake Views', 'Historic Landmark', 'Gated'],
    images: [
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb144?w=1200',
      'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=1200',
      'https://images.unsplash.com/photo-1600585153490-76fb20a32601?w=1200',
      'https://images.unsplash.com/photo-1600047509782-20d39509f26d?w=1200',
    ],
    featured: false,
  },
  {
    slug: 'london-mayfair-townhouse',
    title: 'London Mayfair Townhouse',
    type: 'house',
    status: 'rent',
    price: 15000,
    bedrooms: 5,
    bathrooms: 4,
    area: 3500,
    location: 'Mayfair, London',
    city: 'London',
    description: 'A Grade II listed Georgian townhouse on a quiet garden square in Mayfair. The home has been extensively renovated while preserving original features including ornate cornicing, marble fireplaces, and a sweeping central staircase. The lower ground floor houses a climate-controlled wine cellar, a private screening room, and a fully equipped gym. Moments from Hyde Park and the boutiques of Mount Street.',
    features: ['Garden Square', 'Wine Cellar', 'Screening Room', 'Gym', 'Period Features', 'Study', 'Staff Room', 'Parking'],
    images: [
      'https://images.unsplash.com/photo-1600585154084-4e5fe7c39198?w=1200',
      'https://images.unsplash.com/photo-1600210492498-0946911120f2?w=1200',
      'https://images.unsplash.com/photo-1600573471969-8c6ea0538e5f?w=1200',
      'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=1200',
    ],
    featured: false,
  },
]

export function getPropertyBySlug(slug: string): Property | undefined {
  return properties.find((p) => p.slug === slug)
}

export function getFeaturedProperties(): Property[] {
  return properties.filter((p) => p.featured)
}

export function searchProperties(query: string): Property[] {
  const q = query.toLowerCase()
  return properties.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q) ||
      p.type.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q),
  )
}

export function filterProperties(filters: {
  type?: string
  status?: string
  minPrice?: number
  maxPrice?: number
  minBedrooms?: number
  city?: string
}): Property[] {
  return properties.filter((p) => {
    if (filters.type && p.type !== filters.type) return false
    if (filters.status && p.status !== filters.status) return false
    if (filters.minPrice && p.price < filters.minPrice) return false
    if (filters.maxPrice && p.price > filters.maxPrice) return false
    if (filters.minBedrooms && p.bedrooms < filters.minBedrooms) return false
    if (filters.city && p.city.toLowerCase() !== filters.city.toLowerCase()) return false
    return true
  })
}

export function getCities(): string[] {
  return [...new Set(properties.map((p) => p.city))].sort()
}

export function getPropertyTypes(): string[] {
  return [...new Set(properties.map((p) => p.type))].sort()
}

export function formatPrice(price: number, status: 'sale' | 'rent'): string {
  if (status === 'rent') {
    return `$${price.toLocaleString()}/mo`
  }
  if (price >= 1000000) {
    return `$${(price / 1000000).toFixed(price % 1000000 === 0 ? 0 : 1)}M`
  }
  return `$${price.toLocaleString()}`
}
