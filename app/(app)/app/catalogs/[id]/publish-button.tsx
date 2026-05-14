'use client'
import { useTransition } from 'react'
import { Globe, Loader2, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { publishCatalog, unpublishCatalog } from '@/lib/actions/catalogs'

export function PublishButton({ catalogId, status }: { catalogId: string; status: 'draft' | 'published' }) {
  const [isPending, startTransition] = useTransition()

  const toggle = () => startTransition(async () => {
    if (status === 'published') {
      await unpublishCatalog(catalogId)
    } else {
      await publishCatalog(catalogId)
    }
  })

  return (
    <Button
      onClick={toggle}
      disabled={isPending}
      variant={status === 'published' ? 'outline' : 'default'}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : status === 'published' ? (
        <EyeOff className="h-4 w-4" />
      ) : (
        <Globe className="h-4 w-4" />
      )}
      {status === 'published' ? 'Despublicar' : 'Publicar'}
    </Button>
  )
}
