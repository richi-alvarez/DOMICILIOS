import {
  exportToCSV,
  exportToJSON,
  exportToTXT,
  type ExportOptions,
} from '@/lib/analytics/export'

export function useAnalyticsExport() {
  const downloadCSV = (data: Record<string, any>[], options?: ExportOptions) => {
    exportToCSV(data, options)
  }

  const downloadJSON = (data: Record<string, any>, options?: ExportOptions) => {
    exportToJSON(data, options)
  }

  const downloadReport = (data: Record<string, any>, options?: ExportOptions) => {
    exportToTXT(data, options)
  }

  return {
    downloadCSV,
    downloadJSON,
    downloadReport,
  }
}
