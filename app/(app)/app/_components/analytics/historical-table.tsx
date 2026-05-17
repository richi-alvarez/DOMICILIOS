'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown, Download } from 'lucide-react'

interface ScanRecord {
  id: string
  date: string
  time: string
  catalog: string
  files: number
  productsDetected: number
  productsAfterDedup: number
  processingTime: number
  cost: number
  quality: number
  ocrProvider: string
  aiProvider: string
}

// Datos de ejemplo
const mockRecords: ScanRecord[] = [
  {
    id: '1',
    date: '2026-05-16',
    time: '14:32',
    catalog: 'Panadería Artesanal Pro',
    files: 5,
    productsDetected: 45,
    productsAfterDedup: 42,
    processingTime: 28.5,
    cost: 0.0315,
    quality: 94,
    ocrProvider: 'tesseract',
    aiProvider: 'claude',
  },
  {
    id: '2',
    date: '2026-05-16',
    time: '12:15',
    catalog: 'Café La Esquina',
    files: 3,
    productsDetected: 28,
    productsAfterDedup: 26,
    processingTime: 19.2,
    cost: 0.0195,
    quality: 91,
    ocrProvider: 'paddleocr',
    aiProvider: 'claude',
  },
  {
    id: '3',
    date: '2026-05-15',
    time: '16:45',
    catalog: 'Restaurante Central',
    files: 8,
    productsDetected: 72,
    productsAfterDedup: 68,
    processingTime: 35.8,
    cost: 0.051,
    quality: 92,
    ocrProvider: 'tesseract',
    aiProvider: 'claude',
  },
  {
    id: '4',
    date: '2026-05-15',
    time: '10:22',
    catalog: 'Pizzería Milano',
    files: 4,
    productsDetected: 35,
    productsAfterDedup: 33,
    processingTime: 23.1,
    cost: 0.0247,
    quality: 89,
    ocrProvider: 'tesseract',
    aiProvider: 'openai',
  },
]

type SortField = keyof ScanRecord
type SortOrder = 'asc' | 'desc'

export function HistoricalTable() {
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const sortedRecords = [...mockRecords].sort((a, b) => {
    const aVal = a[sortField]
    const bVal = b[sortField]

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
    }

    const aStr = String(aVal).toLowerCase()
    const bStr = String(bVal).toLowerCase()
    return sortOrder === 'asc'
      ? aStr.localeCompare(bStr)
      : bStr.localeCompare(aStr)
  })

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null
    return sortOrder === 'asc' ? (
      <ChevronUp className="h-4 w-4 inline ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 inline ml-1" />
    )
  }

  return (
    <div className="border border-warm-200 rounded-lg overflow-hidden bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-warm-200 bg-warm-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-night-800">
            Histórico de Escaneos
          </h3>
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-warm-200 text-sm text-warm-600 hover:bg-warm-50">
            <Download className="h-4 w-4" />
            Descargar CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-warm-200 bg-warm-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-warm-600 w-12">
                →
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-semibold text-warm-600 cursor-pointer hover:text-night-800"
                onClick={() => handleSort('date')}
              >
                Fecha {renderSortIcon('date')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-semibold text-warm-600 cursor-pointer hover:text-night-800"
                onClick={() => handleSort('catalog')}
              >
                Catálogo {renderSortIcon('catalog')}
              </th>
              <th
                className="px-6 py-3 text-center text-xs font-semibold text-warm-600 cursor-pointer hover:text-night-800"
                onClick={() => handleSort('productsAfterDedup')}
              >
                Productos {renderSortIcon('productsAfterDedup')}
              </th>
              <th
                className="px-6 py-3 text-center text-xs font-semibold text-warm-600 cursor-pointer hover:text-night-800"
                onClick={() => handleSort('quality')}
              >
                Calidad {renderSortIcon('quality')}
              </th>
              <th
                className="px-6 py-3 text-center text-xs font-semibold text-warm-600 cursor-pointer hover:text-night-800"
                onClick={() => handleSort('cost')}
              >
                Costo {renderSortIcon('cost')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-warm-100">
            {sortedRecords.map((record, idx) => (
              <tbody key={record.id}>
                <tr
                  className="hover:bg-warm-50 cursor-pointer"
                  onClick={() =>
                    setExpandedRow(
                      expandedRow === record.id ? null : record.id
                    )
                  }
                >
                  <td className="px-6 py-4 text-warm-500">
                    {expandedRow === record.id ? '−' : '+'}
                  </td>
                  <td className="px-6 py-4 text-night-800">
                    {record.date} {record.time}
                  </td>
                  <td className="px-6 py-4 text-night-800 font-medium">
                    {record.catalog}
                  </td>
                  <td className="px-6 py-4 text-center text-night-800">
                    {record.productsAfterDedup}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                        record.quality >= 92
                          ? 'bg-lime-100 text-lime-700'
                          : record.quality >= 85
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {record.quality}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-warm-600">
                    ${record.cost.toFixed(4)}
                  </td>
                </tr>

                {/* Expanded Row */}
                {expandedRow === record.id && (
                  <tr className="bg-warm-50">
                    <td colSpan={6} className="px-6 py-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-warm-600 font-semibold">
                            Archivos
                          </p>
                          <p className="text-sm text-night-800 font-medium">
                            {record.files}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-warm-600 font-semibold">
                            Detectados
                          </p>
                          <p className="text-sm text-night-800 font-medium">
                            {record.productsDetected}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-warm-600 font-semibold">
                            Tiempo
                          </p>
                          <p className="text-sm text-night-800 font-medium">
                            {record.processingTime.toFixed(1)}s
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-warm-600 font-semibold">
                            Proveedores
                          </p>
                          <p className="text-sm text-night-800 font-medium">
                            {record.ocrProvider} / {record.aiProvider}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-warm-200 bg-warm-50 text-xs text-warm-600">
        <p>Mostrando {sortedRecords.length} registros. Click en una fila para ver detalles.</p>
      </div>
    </div>
  )
}
