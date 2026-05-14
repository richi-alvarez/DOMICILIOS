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
    default: 'Domicilios — Catálogos digitales con pedidos por WhatsApp',
    template: '%s | Domicilios',
  },
  description:
    'Crea tu catálogo o menú digital y recibe pedidos por WhatsApp. Sin comisiones. Para restaurantes, tiendas y negocios de toda Latinoamérica.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    siteName: 'Domicilios',
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
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
