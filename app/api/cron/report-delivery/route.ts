import { db, reportSchedules, customReports, orders, catalogs, reportExports, memberships } from '@/db'
import { eq, and, inArray, gte, lte, le, isNotNull } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/monitoring/logger'
import { sendReportEmail } from '@/lib/email'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'test-secret'

    if (authHeader !== `Bearer ${cronSecret}`) {
      logger.warn('[Cron] Unauthorized access attempt')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Find all active schedules due for execution
    const now = new Date()
    const dueSchedules = await db.query.reportSchedules.findMany({
      where: and(
        eq(reportSchedules.isActive, true),
        le(reportSchedules.nextRunAt, now)
      ),
    })

    logger.info(`[Cron] Found ${dueSchedules.length} schedules to process`)

    let successCount = 0
    let errorCount = 0

    for (const schedule of dueSchedules) {
      try {
        // Get report
        const report = await db.query.customReports.findFirst({
          where: eq(customReports.id, schedule.reportId),
        })

        if (!report) {
          logger.warn(`[Cron] Report ${schedule.reportId} not found`)
          errorCount++
          continue
        }

        // Get organization catalogs
        const orgCatalogs = await db.query.catalogs.findMany({
          where: eq(catalogs.orgId, schedule.organizationId),
          columns: { id: true },
        })

        if (orgCatalogs.length === 0) {
          logger.warn(`[Cron] No catalogs found for org ${schedule.organizationId}`)
          errorCount++
          continue
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

        // Generate file based on format
        let fileBuffer: Buffer
        let filename: string

        if (schedule.exportFormat === 'csv') {
          fileBuffer = Buffer.from(csvData, 'utf-8')
          filename = `reporte-${report.queryType}-${Date.now()}.csv`
        } else if (schedule.exportFormat === 'xlsx') {
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

        // Send email
        await sendReportEmail(
          schedule.recipientEmail,
          report.name,
          schedule.exportFormat as 'csv' | 'xlsx' | 'pdf',
          fileBuffer,
          filename
        )

        // Record export in history
        const csvLines = csvData.split('\n').filter(line => line.trim())
        const rowCount = csvLines.length > 0 ? csvLines.length - 1 : 0

        await db.insert(reportExports).values({
          reportId: report.id,
          organizationId: schedule.organizationId,
          exportFormat: schedule.exportFormat,
          fileSize: fileBuffer.length,
          rowCount,
          createdBy: null,
          metadata: { deliveryType: 'scheduled', email: schedule.recipientEmail },
        })

        // Calculate next run time
        let nextRunAt = new Date()
        if (schedule.frequency === 'daily') {
          nextRunAt.setDate(nextRunAt.getDate() + 1)
          nextRunAt.setHours(6, 0, 0, 0)
        } else if (schedule.frequency === 'weekly') {
          nextRunAt.setDate(nextRunAt.getDate() + (8 - nextRunAt.getDay()))
          nextRunAt.setHours(6, 0, 0, 0)
        } else if (schedule.frequency === 'monthly') {
          nextRunAt.setMonth(nextRunAt.getMonth() + 1)
          nextRunAt.setDate(1)
          nextRunAt.setHours(6, 0, 0, 0)
        }

        // Update schedule
        await db
          .update(reportSchedules)
          .set({
            lastRunAt: now,
            nextRunAt,
          })
          .where(eq(reportSchedules.id, schedule.id))

        logger.info(`[Cron] Successfully sent report ${report.id} to ${schedule.recipientEmail}`)
        successCount++
      } catch (error: any) {
        logger.error(`[Cron] Error processing schedule ${schedule.id}:`, error)
        errorCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${dueSchedules.length} schedules: ${successCount} succeeded, ${errorCount} failed`,
      processed: successCount,
      failed: errorCount,
    })
  } catch (error: any) {
    logger.error('[Cron Report Delivery Error]', error)
    return NextResponse.json(
      { error: 'Cron job failed' },
      { status: 500 }
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
