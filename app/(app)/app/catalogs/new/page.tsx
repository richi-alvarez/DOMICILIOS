'use client'

import { useEffect, useState } from 'react'
import { CatalogWizard } from '@/components/app/catalog-wizard'

export default function NewCatalogPage() {
  const [userName, setUserName] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getUserName() {
      try {
        const res = await fetch('/api/auth/session')
        if (res.ok) {
          const data = await res.json()
          setUserName(data?.user?.name || 'usuario')
        }
      } catch (error) {
        console.error('Error fetching user:', error)
        setUserName('usuario')
      } finally {
        setLoading(false)
      }
    }
    getUserName()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-warm-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-warm-50">
      <CatalogWizard userName={userName} />
    </div>
  )
}
