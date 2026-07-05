'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { FileText, Download, Calendar, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useI18n } from '@/lib/i18n/context'

interface ReportGeneratorProps {
  catalogId: string
}

export function ReportGenerator({ catalogId }: ReportGeneratorProps) {
  const { t } = useI18n()
  const [loading, setLoading] = useState(false)
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  })
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0])

  async function downloadReport(format: 'excel' | 'pdf') {
    setLoading(true)
    try {
      const url = `/api/reports/${format}?catalogId=${catalogId}&from=${fromDate}&to=${toDate}`
      const response = await fetch(url)

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || t('reports.toastGenError'))
        setLoading(false)
        return
      }

      const blob = await response.blob()
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)

      const filename =
        response.headers.get('content-disposition')?.split('filename="')[1]?.split('"')[0] ||
        `${t('reports.defaultFilename')}.${format}`

      link.download = filename
      link.click()
      URL.revokeObjectURL(link.href)

      toast.success(`${t('reports.toastDownloadedPre')}${filename}`)
    } catch (err: any) {
      toast.error(err.message || t('reports.toastDownloadError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-night-800">
          <FileText className="h-5 w-5" />
          {t('reports.generate')}
        </h3>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="from" className="text-sm font-medium text-night-700">
                {t('reports.from')}
              </Label>
              <Input
                id="from"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                disabled={loading}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="to" className="text-sm font-medium text-night-700">
                {t('reports.to')}
              </Label>
              <Input
                id="to"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                disabled={loading}
                className="mt-2"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button
              onClick={() => downloadReport('excel')}
              disabled={loading}
              variant="default"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              {t('reports.downloadExcel')}
            </Button>
            <Button
              onClick={() => downloadReport('pdf')}
              disabled={loading}
              variant="outline"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              {t('reports.downloadPdf')}
            </Button>
          </div>

          <p className="text-xs text-warm-500">
            {fromDate} a {toDate}
          </p>
        </div>
      </Card>

      <Card className="border-lime-200 bg-lime-50 p-6">
        <h4 className="mb-2 font-semibold text-lime-900">{t('reports.includesTitle')}</h4>
        <ul className="space-y-1 text-sm text-lime-800">
          <li>{t('reports.inc1')}</li>
          <li>{t('reports.inc2')}</li>
          <li>{t('reports.inc3')}</li>
          <li>{t('reports.inc4')}</li>
          <li>{t('reports.inc5')}</li>
        </ul>
      </Card>
    </div>
  )
}
