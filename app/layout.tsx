import type { Metadata } from 'next'
import {
  Inter,
  Sora,
  Poppins,
  Lato,
  Raleway,
  Nunito,
  Manrope,
  DM_Sans,
  Playfair_Display,
  Cormorant_Garamond,
  Cinzel,
} from 'next/font/google'
import { Providers } from '@/components/shared/providers'
import { APP_NAME } from '@/lib/brand'
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

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-poppins',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

const lato = Lato({
  subsets: ['latin'],
  variable: '--font-lato',
  weight: ['400', '700', '900'],
  display: 'swap',
})

const raleway = Raleway({
  subsets: ['latin'],
  variable: '--font-raleway',
  weight: ['400', '600', '700', '800'],
  display: 'swap',
})

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  weight: ['400', '600', '700', '800'],
  display: 'swap',
})

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  weight: ['400', '600', '700', '800'],
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dmSans',
  weight: ['400', '500', '700'],
  display: 'swap',
})

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfairDisplay',
  weight: ['400', '700', '900'],
  display: 'swap',
})

const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorantGaramond',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-cinzel',
  weight: ['400', '700', '900'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — Catálogos Inteligentes para Negocios`,
    template: `%s | ${APP_NAME}`,
  },
  description:
    'Crea catálogos inteligentes para tu negocio y automatiza ventas por WhatsApp. Commerce conversacional para restaurantes, tiendas y emprendimientos.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    siteName: APP_NAME,
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
    <html
      lang="es"
      suppressHydrationWarning
      className={`${inter.variable} ${sora.variable} ${poppins.variable} ${lato.variable} ${raleway.variable} ${nunito.variable} ${manrope.variable} ${dmSans.variable} ${playfairDisplay.variable} ${cormorantGaramond.variable} ${cinzel.variable}`}
    >
      <body className="min-h-screen antialiased">
        <Providers session={null}>{children}</Providers>
      </body>
    </html>
  )
}
