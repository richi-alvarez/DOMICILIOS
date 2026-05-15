import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-warm-50 via-white to-primary-50 px-4 py-12">
      <div className="mb-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500">
            <span className="text-lg font-black text-white">D</span>
          </div>
          <span className="font-display text-2xl font-bold text-night-800">Domicilios</span>
        </Link>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
