export interface Agent {
  id: number
  slug: string
  name: string
  title: string
  bio: string
  imageUrl: string
  email: string
  phone: string
  specialties: string[]
  propertiesSold: number
  experience: number
  rating: number
  featured: boolean
}

export const agents: Agent[] = [
  { id: 1, slug: 'alexander-voss', name: 'Alexander Voss', title: 'Founder & CEO', imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80', bio: 'With over 20 years in luxury real estate, Alexander founded LuxEstate with a vision to redefine the standard of excellence.', email: 'alexander@luxestate.com', phone: '+1 (310) 555-0101', specialties: ['Luxury Residential', 'International Investments', 'Portfolio Management'], propertiesSold: 340, experience: 20, rating: 5, featured: true },
  { id: 2, slug: 'isabella-chen', name: 'Isabella Chen', title: 'Head of Luxury Sales', imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&q=80', bio: 'Isabella brings a decade of experience in high-net-worth client relations across Asia Pacific and North America.', email: 'isabella@luxestate.com', phone: '+1 (310) 555-0102', specialties: ['International Buyers', 'Condominiums', 'Pre-Construction'], propertiesSold: 215, experience: 12, rating: 5, featured: true },
  { id: 3, slug: 'marcus-rivera', name: 'Marcus Rivera', title: 'Senior Property Advisor', imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&q=80', bio: 'Marcus specializes in luxury residential and commercial real estate throughout Southern California.', email: 'marcus@luxestate.com', phone: '+1 (310) 555-0103', specialties: ['Residential', 'Commercial', 'Luxury Estates'], propertiesSold: 180, experience: 10, rating: 5, featured: true },
  { id: 4, slug: 'sophie-laurent', name: 'Sophie Laurent', title: 'International Client Relations', imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&q=80', bio: 'Sophie oversees LuxEstate\'s European and Middle Eastern client relationships.', email: 'sophie@luxestate.com', phone: '+1 (310) 555-0104', specialties: ['International Sales', 'European Properties', 'Luxury Rentals'], propertiesSold: 150, experience: 8, rating: 5, featured: true },
  { id: 5, slug: 'james-okonkwo', name: 'James Okonkwo', title: 'Property Consultant', imageUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&q=80', bio: 'James brings deep knowledge of emerging luxury markets across Africa and the Middle East.', email: 'james@luxestate.com', phone: '+1 (310) 555-0105', specialties: ['Emerging Markets', 'Luxury Development', 'Investment Properties'], propertiesSold: 95, experience: 6, rating: 5, featured: false },
  { id: 6, slug: 'emily-foster', name: 'Emily Foster', title: 'Luxury Rental Specialist', imageUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&q=80', bio: 'Emily heads our luxury rental division, curating the finest temporary residences.', email: 'emily@luxestate.com', phone: '+1 (310) 555-0106', specialties: ['Luxury Rentals', 'Short-Term Leasing', 'Concierge Services'], propertiesSold: 120, experience: 7, rating: 5, featured: false },
]

export function getAgentBySlug(slug: string): Agent | undefined {
  return agents.find((a) => a.slug === slug)
}

export function getFeaturedAgents(): Agent[] {
  return agents.filter((a) => a.featured)
}

export function getSpecialties(): string[] {
  return [...new Set(agents.flatMap((a) => a.specialties))].sort()
}
