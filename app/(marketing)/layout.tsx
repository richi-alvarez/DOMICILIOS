import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { CookieBanner } from '@/components/shared/cookie-banner'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
      <CookieBanner />
    </>
  )
}
