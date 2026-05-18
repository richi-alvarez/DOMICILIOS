'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface StripePaymentFormProps {
  orderId: string
  amount: number
  currency?: string
  onSuccess?: (transactionId: string) => void
  onError?: (error: string) => void
  disabled?: boolean
}

export function StripePaymentForm({
  orderId,
  amount,
  currency = 'usd',
  onSuccess,
  onError,
  disabled = false,
}: StripePaymentFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form')

  // For MVP: This is a placeholder form
  // In production, integrate with @stripe/react-stripe-js
  // For now, show the structure

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      try {
        setStep('processing')

        // Step 1: Create payment intent
        const intentResponse = await fetch('/api/payments/intents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            amount: Math.round(amount * 100), // Convert to cents
            currency,
          }),
        })

        if (!intentResponse.ok) {
          throw new Error('Error al crear intención de pago')
        }

        const intentData = await intentResponse.json()

        if (!intentData.clientSecret) {
          throw new Error('No se recibió cliente secreto')
        }

        // Step 2: In production, use Stripe.js to confirm payment
        // For MVP, we'll simulate successful payment
        // Real implementation would use:
        // const { error, paymentIntent } = await stripe.confirmCardPayment(
        //   intentData.clientSecret,
        //   { payment_method: paymentMethodId }
        // )

        // Simulate Stripe payment processing
        await new Promise(resolve => setTimeout(resolve, 2000))

        // Step 3: Confirm payment
        const confirmResponse = await fetch('/api/payments/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentIntentId: intentData.paymentIntentId,
            orderId,
          }),
        })

        if (!confirmResponse.ok) {
          throw new Error('Error al confirmar pago')
        }

        const confirmData = await confirmResponse.json()

        setSuccess(true)
        setStep('success')
        toast.success('¡Pago completado exitosamente!')

        if (onSuccess) {
          onSuccess(confirmData.transactionId)
        }
      } catch (err: any) {
        const errorMessage = err.message || 'Error al procesar el pago'
        setError(errorMessage)
        setStep('form')
        toast.error(errorMessage)

        if (onError) {
          onError(errorMessage)
        }
      }
    })
  }

  if (step === 'success') {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-green-900">Pago exitoso</h3>
            <p className="mt-1 text-sm text-green-800">
              Tu pago de ${(amount / 100).toFixed(2)} {currency.toUpperCase()} ha sido procesado correctamente.
            </p>
            {success && (
              <Button
                className="mt-4"
                onClick={() => {
                  setStep('form')
                  setSuccess(false)
                }}
              >
                Realizar otro pago
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900">Error de pago</h3>
              <p className="mt-1 text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Amount Summary */}
      <div className="rounded-lg bg-gray-50 p-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-700">Monto a pagar:</span>
          <span className="text-2xl font-bold text-gray-900">
            ${(amount / 100).toFixed(2)} {currency.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Card Details Section */}
      <div className="space-y-4">
        <div>
          <Label className="block mb-2">Nombre del titular</Label>
          <Input
            type="text"
            placeholder="Juan Pérez"
            required
            disabled={isPending || disabled}
          />
        </div>

        <div>
          <Label className="block mb-2">Número de tarjeta</Label>
          {/* TODO: Replace with Stripe CardElement */}
          <Input
            type="text"
            placeholder="4242 4242 4242 4242"
            required
            disabled={isPending || disabled}
            maxLength={19}
          />
          <p className="text-xs text-gray-500 mt-1">
            Tarjeta de prueba: 4242 4242 4242 4242 | CVC: 424 | Fecha: 12/26
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="block mb-2">Vencimiento</Label>
            <Input
              type="text"
              placeholder="12/26"
              disabled={isPending || disabled}
              maxLength={5}
            />
          </div>
          <div>
            <Label className="block mb-2">CVC</Label>
            <Input
              type="text"
              placeholder="424"
              disabled={isPending || disabled}
              maxLength={4}
            />
          </div>
          <div>
            <Label className="block mb-2">CP</Label>
            <Input
              type="text"
              placeholder="28001"
              disabled={isPending || disabled}
            />
          </div>
        </div>

        <div>
          <Label className="block mb-2">Email de confirmación</Label>
          <Input
            type="email"
            placeholder="juan@ejemplo.com"
            required
            disabled={isPending || disabled}
          />
        </div>
      </div>

      {/* Terms */}
      <div className="text-xs text-gray-600">
        <p>
          Al hacer clic en "Pagar", aceptas nuestros términos de servicio y autorizas el cargo a tu tarjeta.
        </p>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isPending || disabled}
        className="w-full"
        size="lg"
      >
        {step === 'processing' && (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Procesando...
          </>
        )}
        {step === 'form' && `Pagar $${(amount / 100).toFixed(2)}`}
      </Button>

      {/* Security Note */}
      <div className="text-xs text-gray-500 text-center">
        🔒 Pago seguro con encriptación SSL. Tus datos de tarjeta no se almacenan.
      </div>
    </form>
  )
}
