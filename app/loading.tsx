export default function LoadingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-warm-50">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-warm-200 border-t-primary-500" />
        </div>
        <p className="text-sm font-medium text-warm-400">Cargando…</p>
      </div>
    </div>
  )
}
