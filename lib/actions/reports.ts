'use server'

import { db } from '@/db'
import { orders, catalogs, memberships } from '@/db/schema'
import { eq, and, gte, lte } from 'drizzle-orm'
import { auth } from '@/auth'

export interface OrderReport {
  date: string
  orders: number
  revenue: number
  avgOrderValue: number
}

export interface ProductReport {
  name: string
  slug: string
  sold: number
  revenue: number
  stock: number
}

export async function getReportData(
  catalogId: string,
  fromDate: Date,
  toDate: Date,
) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'No autenticado' }

  const membership = await db.query.memberships.findFirst({
    where: eq(memberships.userId, session.user.id as string),
  })

  if (!membership) return { error: 'Sin organización' }

  const catalog = await db.query.catalogs.findFirst({
    where: eq(catalogs.id, catalogId),
  })

  if (!catalog || catalog.orgId !== membership.organizationId) {
    return { error: 'No tienes permisos' }
  }

  // Obtener órdenes en el rango
  const allOrders = await db.query.orders.findMany({
    where: and(
      eq(orders.catalogId, catalogId),
      gte(orders.createdAt, fromDate),
      lte(orders.createdAt, toDate),
    ),
  })

  // Agrupar por fecha
  const ordersByDate: Record<string, any[]> = {}
  allOrders.forEach((order) => {
    const date = order.createdAt?.toISOString().split('T')[0] || ''
    if (!ordersByDate[date]) ordersByDate[date] = []
    ordersByDate[date].push(order)
  })

  // Calcular métricas por fecha
  const dailyReport: OrderReport[] = Object.entries(ordersByDate)
    .sort()
    .map(([date, dayOrders]) => {
      const revenue = dayOrders.reduce((sum, o) => {
        const totals = (o.totalsJson ?? {}) as Record<string, any>
        return sum + (totals.total || 0)
      }, 0)

      return {
        date,
        orders: dayOrders.length,
        revenue,
        avgOrderValue: dayOrders.length > 0 ? revenue / dayOrders.length : 0,
      }
    })

  // Productos más vendidos
  const productSales: Record<string, any> = {}
  allOrders.forEach((order) => {
    const items = (order.itemsJson ?? []) as Array<{
      name: string
      price: number
      qty: number
    }>
    items.forEach((item) => {
      if (!productSales[item.name]) {
        productSales[item.name] = { qty: 0, revenue: 0 }
      }
      productSales[item.name].qty += item.qty
      productSales[item.name].revenue += item.price * item.qty
    })
  })

  const topProducts = Object.entries(productSales)
    .map(([name, data]: any) => ({
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      sold: data.qty,
      revenue: data.revenue,
      stock: 0, // No tenemos stock en el reporte de órdenes
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  // Totales
  const totalRevenue = allOrders.reduce((sum, o) => {
    const totals = (o.totalsJson ?? {}) as Record<string, any>
    return sum + (totals.total || 0)
  }, 0)

  return {
    catalog: {
      id: catalog.id,
      name: catalog.name,
      slug: catalog.slug,
    },
    summary: {
      period: {
        from: fromDate.toISOString().split('T')[0],
        to: toDate.toISOString().split('T')[0],
      },
      totalOrders: allOrders.length,
      totalRevenue,
      avgOrderValue: allOrders.length > 0 ? totalRevenue / allOrders.length : 0,
      conversionRate: 0, // Requeriría analytics
    },
    dailyReport,
    topProducts,
  }
}

export async function generateExcelReport(
  catalogId: string,
  fromDate: Date,
  toDate: Date,
) {
  const reportData = await getReportData(catalogId, fromDate, toDate)

  if ('error' in reportData) {
    return { error: reportData.error }
  }

  // Usar xlsx para generar Excel
  const XLSX = (await import('xlsx')).default

  const ws_data = [
    [reportData.catalog.name, 'Reporte de ventas'],
    [
      `${reportData.summary.period.from} a ${reportData.summary.period.to}`,
    ],
    [],
    ['Total Órdenes', reportData.summary.totalOrders],
    ['Ingresos Totales', `$${reportData.summary.totalRevenue}`],
    ['Promedio por Orden', `$${reportData.summary.avgOrderValue.toFixed(2)}`],
    [],
    ['Fecha', 'Órdenes', 'Ingresos', 'Promedio'],
    ...reportData.dailyReport.map((day) => [
      day.date,
      day.orders,
      `$${day.revenue}`,
      `$${day.avgOrderValue.toFixed(2)}`,
    ]),
    [],
    ['Top 10 Productos', 'Vendidos', 'Ingresos'],
    ...reportData.topProducts.map((p) => [
      p.name,
      p.sold,
      `$${p.revenue}`,
    ]),
  ]

  const ws = XLSX.utils.aoa_to_sheet(ws_data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Reporte')

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' })

  return {
    buffer: excelBuffer,
    filename: `reporte-${reportData.catalog.slug}-${reportData.summary.period.from}.xlsx`,
  }
}

export async function generatePDFReport(
  catalogId: string,
  fromDate: Date,
  toDate: Date,
): Promise<{ buffer: Buffer; filename: string } | { error: string }> {
  const reportData = await getReportData(catalogId, fromDate, toDate)

  if ('error' in reportData) {
    return { error: (reportData as any).error }
  }

  // Usar pdfkit para generar PDF
  const PDFDocument = (await import('pdfkit')).default
  const doc = new PDFDocument()

  const buffers: Buffer[] = []
  doc.on('data', (chunk: Buffer) => buffers.push(chunk))

  // Título
  doc
    .fontSize(20)
    .font('Helvetica-Bold')
    .text(reportData.catalog.name, 50, 50)
    .fontSize(12)
    .font('Helvetica')
    .text(
      `Reporte: ${reportData.summary.period.from} a ${reportData.summary.period.to}`,
      50,
      80,
    )

  // Resumen
  doc
    .fontSize(14)
    .font('Helvetica-Bold')
    .text('Resumen', 50, 130)
    .fontSize(11)
    .font('Helvetica')
    .text(`Total Órdenes: ${reportData.summary.totalOrders}`, 50, 160)
    .text(`Ingresos Totales: $${reportData.summary.totalRevenue}`, 50, 185)
    .text(
      `Promedio por Orden: $${reportData.summary.avgOrderValue.toFixed(2)}`,
      50,
      210,
    )

  // Top productos
  doc
    .fontSize(14)
    .font('Helvetica-Bold')
    .text('Top 10 Productos', 50, 260)

  let y = 290
  doc.fontSize(10).font('Helvetica')
  reportData.topProducts.slice(0, 10).forEach((product, i) => {
    doc.text(
      `${i + 1}. ${product.name} - ${product.sold} vendidos - $${product.revenue}`,
      50,
      y,
    )
    y += 25
  })

  doc.end()

  return {
    buffer: await new Promise((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(buffers))
      })
    }),
    filename: `reporte-${reportData.catalog.slug}-${reportData.summary.period.from}.pdf`,
  }
}
