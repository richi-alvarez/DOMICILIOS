/** Tabs de la sección Configuración (fuente única para todas las sub-páginas). */
export function getSettingsTabs(id: string) {
  return [
    { href: `/app/catalogs/${id}/settings/sales-type`, labelKey: 'settings.tabs.salesType' },
    { href: `/app/catalogs/${id}/settings`, labelKey: 'settings.tabs.delivery' },
    { href: `/app/catalogs/${id}/settings/domain`, labelKey: 'settings.tabs.domain' },
    { href: `/app/catalogs/${id}/settings/payments`, labelKey: 'settings.tabs.payments' },
    { href: `/app/catalogs/${id}/settings/whatsapp`, labelKey: 'settings.tabs.whatsapp' },
  ]
}
