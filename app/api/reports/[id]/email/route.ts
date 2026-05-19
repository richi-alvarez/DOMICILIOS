import { auth } from '@/auth'
import { db, memberships, customReports, orders, catalogs } from '@/db'
import { eq, inArray, and, gte, lte } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { logger } from '@/lib/monitoring/logger'
import { checkRateLimit, rateLimitConfig } from '@/lib/api/rate-limit'
import { getClientIP } from '@/lib/api/get-client-ip'
import { sendReportEmail } from '@/lib/email'

export const runtime = 'nodejs'

const emailSchema = z.object({
  email: z.string().email(),
  format: z.enum(['csv', 'xlsx', 'pdf']).default('csv'),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ip = getClientIP(request)
    const rateLimitResult = await checkRateLimit(ip, rateLimitConfig.sensitive.limit, rateLimitConfig.sensitive.windowMs)

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitConfig.sensitive.message },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter || 60),
          },
        }
      )
    }

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const membership = await db.query.memberships.findFirst({
      where: eq(memberships.userId, session.user.id),
      columns: { organizationId: true },
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 },
      )
    }

    const report = await db.query.customReports.findFirst({
      where: and(
        eq(customReports.id, params.id),
        eq(customReports.organizationId, membership.organizationId),
      ),
    })

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 },
      )
    }

    const body = await request.json()
    const validated = emailSchema.parse(body)

    // Get data based on query type
    const orgCatalogs = await db.query.catalogs.findMany({
      where: eq(catalogs.orgId, membership.organizationId),
      columns: { id: true },
    })

    if (orgCatalogs.length === 0) {
      return NextResponse.json(
        { error: 'No catalogs found for organization' },
        { status: 400 },
      )
    }

    const catalogIds = orgCatalogs.map((c) => c.id)
    const filters = report.filters as any

    const startDate = filters?.startDate
      ? new Date(filters.startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const endDate = filters?.endDate
      ? new Date(filters.endDate)
      : new Date()

    // Query data based on report type
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

    // Generate file based on format
    let fileBuffer: Buffer
    let filename: string

    if (validated.format === 'csv') {
      fileBuffer = Buffer.from(csvData, 'utf-8')
      filename = `reporte-${report.queryType}-${Date.now()}.csv`
    } else if (validated.format === 'xlsx') {
      const XLSX = (await import('xlsx')).default
      const lines = csvData.trim().split('\n')
      const headers = lines[0].split(',')
      const data = lines.slice(1).map((line) => {
        const values = line.split(',')
        const obj: any = {}
        headers.forEach((header, i) => {
          obj[header] = values[i]
        })
        return obj
      })

      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Reporte')

      fileBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' }) as Buffer
      filename = `reporte-${report.queryType}-${Date.now()}.xlsx`
    } else {
      const PDFDocument = (await import('pdfkit')).default
      const doc = new PDFDocument()

      const buffers: Buffer[] = []
      doc.on('data', (chunk: Buffer) => buffers.push(chunk))

      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .text(`Reporte: ${report.name}`, 50, 50)
        .fontSize(10)
        .font('Helvetica')
        .text(`Generado: ${new Date().toLocaleDateString()}`, 50, 80)
        .moveDown()
        .text(csvData)

      doc.end()

      fileBuffer = await new Promise((resolve) => {
        doc.on('end', () => {
          resolve(Buffer.concat(buffers))
        })
      })
      filename = `reporte-${report.queryType}-${Date.now()}.pdf`
    }

    // Send email with attachment
    await sendReportEmail(validated.email, report.name, validated.format, fileBuffer, filename)

    logger.info('Report sent by email', {
      reportId: params.id,
      email: validated.email,
      format: validated.format,
    })

    return NextResponse.json({ ok: true, message: 'Email enviado correctamente' })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 },
      )
    }

    logger.error('[Reports Email Error]', error)
    return NextResponse.json(
      { error: 'Failed to send report email' },
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
