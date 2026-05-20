import { db, customReports, orders, catalogs } from '@/db'
import { eq, and, inArray, gte, lte } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/monitoring/logger'

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    // Find report by share token
    const report = await db.query.customReports.findFirst({
      where: eq(customReports.shareToken, params.token),
    })

    if (!report) {
      return NextResponse.json(
        { error: 'Share link not found or expired' },
        { status: 404 },
      )
    }

    // Check if token is expired
    if (
      report.shareTokenExpiresAt &&
      new Date(report.shareTokenExpiresAt) < new Date()
    ) {
      return NextResponse.json(
        { error: 'Share link has expired' },
        { status: 403 },
      )
    }

    // Check if report is archived
    if (report.archivedAt) {
      return NextResponse.json(
        { error: 'Report has been archived' },
        { status: 403 },
      )
    }

    // Get organization catalogs
    const orgCatalogs = await db.query.catalogs.findMany({
      where: eq(catalogs.orgId, report.organizationId),
      columns: { id: true },
    })

    if (orgCatalogs.length === 0) {
      return NextResponse.json(
        { error: 'No data available' },
        { status: 400 },
      )
    }

    const catalogIds = orgCatalogs.map((c) => c.id)
    const filters = report.filters as any

    // Prepare date range
    const startDate = filters?.startDate
      ? new Date(filters.startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const endDate = filters?.endDate
      ? new Date(filters.endDate)
      : new Date()

    // Generate CSV based on report type
    let csvData = ''

    if (report.queryType === 'sales') {
      csvData = await generateSalesCSV(catalogIds, startDate, endDate)
    } else if (report.queryType === 'customers') {
      csvData = await generateCustomersCSV(catalogIds)
    } else if (report.queryType === 'products') {
      csvData = await generateProductsCSV(catalogIds)
    } else if (report.queryType === 'overview') {
      csvData = await generateOverviewCSV(catalogIds)
    }

    const fileBuffer = Buffer.from(csvData, 'utf-8')
    const filename = `${report.name}-${Date.now()}.csv`

    logger.info('Report accessed via share link', {
      reportId: report.id,
      token: params.token.substring(0, 8) + '...',
    })

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    })
  } catch (error: any) {
    logger.error('[Reports Share Token Error]', error)
    return NextResponse.json(
      { error: 'Failed to access shared report' },
      { status: 500 },
    )
  }
}

async function generateSalesCSV(
  catalogIds: string[],
  startDate: Date,
  endDate: Date
): Promise<string> {
  const salesOrders = await db.query.orders.findMany({
    where: and(
      inArray(orders.catalogId, catalogIds),
      eq(orders.status, 'delivered'),
      gte(orders.createdAt, startDate),
      lte(orders.createdAt, endDate),
    ),
    columns: { createdAt: true, totalsJson: true },
  })

  let csv = 'Fecha,Ingresos\n'
  const byDate: Record<string, number> = {}

  salesOrders.forEach((order) => {
    const date = order.createdAt.toISOString().split('T')[0]
    const totals = order.totalsJson as any
    const revenue = totals?.total || 0
    byDate[date] = (byDate[date] || 0) + revenue
  })

  Object.entries(byDate)
    .sort()
    .forEach(([date, revenue]) => {
      csv += `${date},$${revenue}\n`
    })

  return csv
}

async function generateCustomersCSV(catalogIds: string[]): Promise<string> {
  const customerOrders = await db.query.orders.findMany({
    where: and(
      inArray(orders.catalogId, catalogIds),
      eq(orders.status, 'delivered'),
    ),
    columns: { customerJson: true, totalsJson: true },
  })

  const customerMap = new Map<string, { revenue: number; orders: number }>()

  customerOrders.forEach((order) => {
    const customer = order.customerJson as any
    const key = customer?.phone || customer?.email || 'unknown'
    const totals = order.totalsJson as any
    const revenue = totals?.total || 0

    const existing = customerMap.get(key) || { revenue: 0, orders: 0 }
    customerMap.set(key, {
      revenue: existing.revenue + revenue,
      orders: existing.orders + 1,
    })
  })

  let csv = 'Cliente,Órdenes,Ingresos\n'
  Array.from(customerMap.entries())
    .sort(([, a], [, b]) => b.revenue - a.revenue)
    .forEach(([customer, data]) => {
      csv += `${customer},${data.orders},$${data.revenue}\n`
    })

  return csv
}

async function generateProductsCSV(catalogIds: string[]): Promise<string> {
  const productOrders = await db.query.orders.findMany({
    where: and(
      inArray(orders.catalogId, catalogIds),
      eq(orders.status, 'delivered'),
    ),
    columns: { itemsJson: true },
  })

  const productMap = new Map<
    string,
    { count: number; revenue: number }
  >()

  productOrders.forEach((order) => {
    const items = order.itemsJson as any[]
    items?.forEach((item) => {
      const name = item.name || 'Unknown'
      const price = item.price || 0
      const qty = item.qty || 1

      const existing = productMap.get(name) || { count: 0, revenue: 0 }
      productMap.set(name, {
        count: existing.count + qty,
        revenue: existing.revenue + price * qty,
      })
    })
  })

  let csv = 'Producto,Vendidos,Ingresos\n'
  Array.from(productMap.entries())
    .sort(([, a], [, b]) => b.revenue - a.revenue)
    .slice(0, 50)
    .forEach(([name, data]) => {
      csv += `"${name}",${data.count},$${data.revenue}\n`
    })

  return csv
}

async function generateOverviewCSV(catalogIds: string[]): Promise<string> {
  const overviewOrders = await db.query.orders.findMany({
    where: and(
      inArray(orders.catalogId, catalogIds),
      eq(orders.status, 'delivered'),
    ),
    columns: { totalsJson: true, customerJson: true },
  })

  let totalRevenue = 0
  const customers = new Set<string>()

  overviewOrders.forEach((order) => {
    const totals = order.totalsJson as any
    totalRevenue += totals?.total || 0

    const customer = order.customerJson as any
    const key = customer?.phone || customer?.email || 'unknown'
    customers.add(key)
  })

  const avgOrderValue =
    overviewOrders.length > 0 ? totalRevenue / overviewOrders.length : 0

  let csv = 'Métrica,Valor\n'
  csv += `Total Órdenes,${overviewOrders.length}\n`
  csv += `Ingresos Totales,$${totalRevenue}\n`
  csv += `Promedio por Orden,$${avgOrderValue.toFixed(2)}\n`
  csv += `Clientes Únicos,${customers.size}\n`

  return csv
}
