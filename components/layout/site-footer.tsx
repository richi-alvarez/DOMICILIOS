import Link from 'next/link'
import { MessageCircle, Instagram, Twitter, Youtube, Mail } from 'lucide-react'
import { APP_NAME } from '@/lib/brand'

const footerLinks = {
  Producto: [
    { href: '/plans', label: 'Planes y precios' },
    { href: '/agencies', label: 'Para agencias' },
    { href: '/digitalcatalog', label: 'Catálogo digital' },
    { href: '/digitalmenu', label: 'Menú digital' },
    { href: '/signup', label: 'Crear cuenta gratis' },
  ],
  Herramientas: [
    { href: '/tools/whatsapp-link-generator', label: 'Generador WhatsApp' },
    { href: '/tools/product-description-generator', label: 'Descripciones con IA' },
    { href: '/tools/profit-margin-calculator', label: 'Calculadora margen' },
    { href: '/tools/qr-code-menu-generator', label: 'Generador QR' },
    { href: '/tools/business-name-generator', label: 'Nombres de negocio' },
  ],
  Guías: [
    { href: '/como-vender', label: 'Guías por industria' },
    { href: '/como-vender/ropa', label: 'Vender ropa' },
    { href: '/como-vender/comida', label: 'Vender comida' },
    { href: '/guides', label: 'Comparativas' },
    { href: '/blog', label: 'Blog' },
  ],
  Información: [
    { href: '/terms', label: 'Términos de uso' },
    { href: '/privacy', label: 'Privacidad' },
    { href: '/aup', label: 'Uso aceptable' },
  ],
}

const socials = [
  { href: '#', label: 'Instagram', icon: Instagram },
  { href: '#', label: 'Twitter / X', icon: Twitter },
  { href: '#', label: 'YouTube', icon: Youtube },
  { href: 'mailto:hola@domicilios.app', label: 'Email', icon: Mail },
  { href: '#', label: 'WhatsApp', icon: MessageCircle },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-warm-200 bg-night-800">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-500">
                <span className="text-lg font-black text-white">D</span>
              </div>
              <span className="font-display text-xl font-bold text-white">{APP_NAME}</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-night-100/60">
              Crea tu catálogo digital y recibe pedidos por WhatsApp. Sin comisiones sobre ventas.
            </p>
            <div className="mt-6 flex items-center gap-3">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-night-700 text-night-100/60 transition-colors hover:bg-primary-500 hover:text-white"
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-night-100/40">
                {section}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-night-100/60 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-night-700 pt-8 sm:flex-row">
          <p className="text-xs text-night-100/40">
            © {new Date().getFullYear()} {APP_NAME}. Todos los derechos reservados.
          </p>
          <p className="text-xs text-night-100/40">
            Hecho con ♥ para comerciantes de Latinoamérica
          </p>
        </div>
      </div>
    </footer>
  )
}
