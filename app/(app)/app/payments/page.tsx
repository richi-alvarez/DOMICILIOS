import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { db, transactions, memberships } from '@/db'
import { eq } from 'drizzle-orm'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowUpRight, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function PaymentsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  // Get user's organization
  const membership = await db.query.memberships.findFirst({
    where: eq(memberships.userId, session.user.id),
  })

  if (!membership) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Organización no encontrada</h1>
        </div>
      </div>
    )
  }

  // Get transactions for this organization
  const userTransactions = await db.query.transactions.findMany({
    where: eq(transactions.organizationId, membership.organizationId),
    orderBy: (t) => [t.createdAt],
    limit: 50,
  })

  const statusBadgeColor = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const statusLabel = (status: string) => {
    switch (status) {
      case 'succeeded':
        return '✅ Exitoso'
      case 'pending':
        return '⏳ Pendiente'
      case 'failed':
        return '❌ Fallido'
      default:
        return status
    }
  }

  const typeLabel = (type: string) => {
    switch (type) {
      case 'order_payment':
        return '🛒 Pago de Pedido'
      case 'subscription':
        return '📅 Suscripción'
      case 'refund':
        return '↩️ Reembolso'
      default:
        return type
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-night-800">Historial de Pagos</h1>
        <p className="text-warm-600 mt-2">
          Administra y descarga tus comprobantes de pago
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-warm-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-warm-600">Total Pagado</p>
              <p className="text-3xl font-bold text-night-800 mt-2">
                ${(
                  userTransactions
                    .filter((t) => t.status === 'succeeded')
                    .reduce((sum, t) => sum + t.amount, 0) / 100
                ).toFixed(2)}
              </p>
            </div>
            <ArrowUpRight className="h-8 w-8 text-primary-500" />
          </div>
        </div>

        <div className="rounded-lg border border-warm-200 bg-white p-6">
          <div>
            <p className="text-sm text-warm-600">Transacciones Exitosas</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {userTransactions.filter((t) => t.status === 'succeeded').length}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-warm-200 bg-white p-6">
          <div>
            <p className="text-sm text-warm-600">Último Pago</p>
            <p className="text-lg font-semibold text-night-800 mt-2">
              {userTransactions.length > 0 && userTransactions[0].createdAt
                ? format(new Date(userTransactions[0].createdAt), 'dd MMM yyyy', {
                    locale: es,
                  })
                : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-lg border border-warm-200 bg-white overflow-hidden">
        {userTransactions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-warm-600">No hay transacciones registradas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-warm-200 bg-warm-50">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-night-700">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-night-700">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-night-700">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-night-700">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-night-700">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {userTransactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-b border-warm-100 hover:bg-warm-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-night-700">
                      {format(new Date(transaction.createdAt), 'dd MMM yyyy HH:mm', {
                        locale: es,
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm text-night-700">
                      {typeLabel(transaction.type)}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-night-800">
                      ${(transaction.amount / 100).toFixed(2)} {transaction.currency}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusBadgeColor(
                          transaction.status
                        )}`}
                      >
                        {statusLabel(transaction.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary-600 hover:text-primary-700"
                        disabled={!transaction.metadata?.receiptUrl}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Recibo
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
