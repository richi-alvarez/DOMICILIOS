import type { Metadata } from 'next'
import { Inter, Sora } from 'next/font/google'
import { Providers } from '@/components/shared/providers'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  weight: ['400', '600', '700', '800'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'WaStore — Catálogos Inteligentes para Negocios',
    template: '%s | WaStore',
  },
  description:
    'Crea catálogos inteligentes para tu negocio y automatiza ventas por WhatsApp. Commerce conversacional para restaurantes, tiendas y emprendimientos.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    siteName: 'WaStore',
  },
  twitter: {
    card: 'summary_large_image',
  },
  keywords: [
    'catálogo digital',
    'menú digital',
    'pedidos por WhatsApp',
    'tienda online',
    'cartas digitales',
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning className={`${inter.variable} ${sora.variable}`}>
      <body className="min-h-screen antialiased">
        <Providers session={null}>{children}</Providers>
      </body>
    </html>
  )
}
