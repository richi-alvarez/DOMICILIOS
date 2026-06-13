/** Tabs de la sección Configuración (fuente única para todas las sub-páginas). */
export function getSettingsTabs(id: string) {
  return [
    { href: `/app/catalogs/${id}/settings/sales-type`, label: 'Tipo de venta' },
    { href: `/app/catalogs/${id}/settings`, label: 'Entregas' },
    { href: `/app/catalogs/${id}/settings/theme`, label: 'Tema visual' },
    { href: `/app/catalogs/${id}/settings/domain`, label: 'Dominio' },
    { href: `/app/catalogs/${id}/settings/payments`, label: 'Pagos' },
    { href: `/app/catalogs/${id}/settings/whatsapp`, label: 'WhatsApp' },
  ]
}
