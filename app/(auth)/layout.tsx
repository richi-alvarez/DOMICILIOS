import Link from 'next/link'
import Image from 'next/image'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 px-4 py-12">
      <div className="mb-8">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/wastore-logo.png"
            alt="WaStore"
            width={45}
            height={45}
            className="h-auto w-auto"
          />
          <span className="font-display text-2xl font-bold bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">WaStore</span>
        </Link>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
