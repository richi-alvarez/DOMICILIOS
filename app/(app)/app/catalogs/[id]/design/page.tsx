import { db, catalogs } from '@/db'
import { eq } from 'drizzle-orm'
import { getBlocksForCatalog } from '@/lib/actions/design'
import DesignEditor from './_components/design-editor'

interface ThemeState {
  selectedPalette: string | null
  primaryColor: string
  secondaryColor: string
  tertiaryColor: string
  font: string
  borderRadius: 'none' | 'sm' | 'full'
  bgType: 'color' | 'image' | 'video'
  bgColor: string
  bgImage: string | null
  bgVideoUrl: string
  buttonPrimaryColor: string
  buttonSecondaryColor: string
  buttonTertiaryColor: string
  categoryPrimaryColor: string
  categorySecondaryColor: string
  categoryTertiaryColor: string
  cartPrimaryColor: string
  cartSecondaryColor: string
  cartTertiaryColor: string
}

interface BaseBlock {
  id: string
  visible: boolean
}

interface PresentationBlock extends BaseBlock {
  type: 'presentation'
  bgType: 'color' | 'image' | 'video'
  bgColor: string
  bgImage: string | null
  bgVideoUrl: string
  overlayOpacity: number
  overlayType: 'dark' | 'light'
  title: string
  subtitle: string
  textAlign: 'left' | 'center' | 'right'
  textColor: string
  presentationImage: string | null
  showCta: boolean
  ctaText: string
  ctaActionType: 'url' | 'scroll'
  ctaUrl: string
  sectionSize: 'sm' | 'md' | 'lg' | 'xl'
  fullHeight: boolean
}

interface CatalogBlock extends BaseBlock {
  type: 'catalog'
  template: 'list' | 'grid' | 'glassmorphism' | 'classic'
  showCategoryFilter: boolean
  showSearch: boolean
  showSortFilter: boolean
  showPriceFilter: boolean
  showAvailabilityFilter: boolean
  showRatingFilter: boolean
  showBrandFilter: boolean
  showDiscountFilter: boolean
  showTitle: boolean
  showPrice: boolean
  showDescription: boolean
  showExternalLink: boolean
  enableCart: boolean
}

interface CartBlock extends BaseBlock {
  type: 'cart'
  showItemCount: boolean
  showTotalPrice: boolean
  showPreviewFirst: boolean
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center-right' | 'center-left'
  size: 'sm' | 'md' | 'lg'
  animation: 'none' | 'pulse' | 'bounce' | 'scale'
  useCustomColors: boolean
  bgColor: string
  iconColor: string
}

interface TextBlock extends BaseBlock {
  type: 'text'
  content: string
  align: 'left' | 'center' | 'right' | 'justify'
  bold: boolean
  italic: boolean
  underline: boolean
  fontSize: 'sm' | 'md' | 'lg'
}

type Block = PresentationBlock | CatalogBlock | CartBlock | TextBlock

export default async function DesignPage({ params }: { params: { id: string } }) {
  // Load catalog from database
  const catalog = await db.query.catalogs.findFirst({
    where: eq(catalogs.id, params.id),
  })

  if (!catalog) {
    return <div>Catálogo no encontrado</div>
  }

  // Load blocks from database
  const dbBlocks = await getBlocksForCatalog(params.id)

  // Convert blocks from DB format to Block type, filtering for valid types
  const initialBlocks: Block[] = dbBlocks
    .filter((block) => ['presentation', 'catalog', 'cart', 'text'].includes(block.type))
    .map((block) => (({
      id: block.id,
      visible: block.active,
      ...block.config,
      type: block.type as 'presentation' | 'catalog' | 'cart' | 'text',
    } as unknown) as Block))

  // Load theme from database
  const initialTheme: Partial<ThemeState> = catalog.themeJson as any

  return (
    <DesignEditor
      catalogId={params.id}
      catalogSlug={catalog.slug}
      initialBlocks={initialBlocks}
      initialTheme={initialTheme}
    />
  )
}
