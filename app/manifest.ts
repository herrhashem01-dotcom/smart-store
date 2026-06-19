import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Smart Store Assistant',
    short_name: 'Smart Store',
    description: 'AI-powered inventory and business assistant for small store owners',
    start_url: '/',
    display: 'standalone',
    background_color: '#F5F4EF',
    theme_color: '#166534',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
  }
}
