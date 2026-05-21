'use client'

import { Copy, Eye, EyeOff, Trash2, Plus } from 'lucide-react'
import PresentationSettings from './block-settings/presentation-settings'
import CatalogSettings from './block-settings/catalog-settings'
import CartSettings from './block-settings/cart-settings'
import TextSettings from './block-settings/text-settings'
import CarouselSettings from './block-settings/carousel-settings'
import BenefitsSettings from './block-settings/benefits-settings'
import SocialProofSettings from './block-settings/socialproof-settings'
import CTAReinforcementSettings from './block-settings/cta-reinforcement-settings'
import FooterSettings from './block-settings/footer-settings'

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

interface CarouselItem {
  id: string
  image: string
  title: string
  description: string
  link?: string
}

interface CarouselBlock extends BaseBlock {
  type: 'carousel'
  items: CarouselItem[]
  autoplay: boolean
  autoplaySpeed: number
  showDots: boolean
  showArrows: boolean
  height: 'sm' | 'md' | 'lg' | 'xl'
  transition: 'slide' | 'fade'
}

interface BenefitItem {
  id: string
  icon: string
  title: string
  description: string
}

interface BenefitsBlock extends BaseBlock {
  type: 'benefits'
  title: string
  subtitle: string
  columns: 1 | 2 | 3 | 4
  items: BenefitItem[]
  bgColor: string
  textColor: string
  iconColor: string
  iconSize: 'sm' | 'md' | 'lg'
  padding: 'sm' | 'md' | 'lg' | 'xl'
}

interface TestimonialItem {
  id: string
  name: string
  role: string
  company: string
  text: string
  rating: number
  avatar?: string
}

interface SocialProofBlock extends BaseBlock {
  type: 'socialproof'
  title: string
  subtitle: string
  layout: 'carousel' | 'grid' | 'list'
  items: TestimonialItem[]
  columns: 1 | 2 | 3
  showRating: boolean
  showAvatar: boolean
  showRole: boolean
  bgColor: string
  textColor: string
  ratingColor: string
  padding: 'sm' | 'md' | 'lg' | 'xl'
}

interface CTAReinforcementBlock extends BaseBlock {
  type: 'cta-reinforcement'
  title: string
  subtitle: string
  buttonText: string
  buttonAction: 'url' | 'phone' | 'email' | 'scroll'
  buttonUrl: string
  buttonPhone: string
  buttonEmail: string
  scrollTarget: string
  buttonColor: string
  textColor: string
  bgColor: string
  fontSize: 'sm' | 'md' | 'lg'
  buttonSize: 'sm' | 'md' | 'lg'
  alignment: 'left' | 'center' | 'right'
  padding: 'sm' | 'md' | 'lg' | 'xl'
  showBorder: boolean
  borderColor: string
  borderWidth: 'none' | 'thin' | 'medium' | 'thick'
}

interface SocialLink {
  id: string
  name: string
  url: string
}

interface FooterBlock extends BaseBlock {
  type: 'footer'
  companyName: string
  companyDescription: string
  address: string
  phone: string
  email: string
  website: string
  socialLinks: SocialLink[]
  copyrightText: string
  bgColor: string
  textColor: string
  accentColor: string
  layout: 'minimal' | 'standard' | 'full'
  showSocialLinks: boolean
  showDescription: boolean
  showAddress: boolean
  showPhone: boolean
  showEmail: boolean
  showWebsite: boolean
  showCopyright: boolean
  showCompanyInfo: boolean
  showContactInfo: boolean
  alignment: 'left' | 'center'
}

type Block = PresentationBlock | CatalogBlock | CartBlock | TextBlock | CarouselBlock | BenefitsBlock | SocialProofBlock | CTAReinforcementBlock | FooterBlock

const BLOCK_META: Record<string, { icon: string; label: string }> = {
  presentation: { icon: '🎯', label: 'Sección de Presentación' },
  catalog: { icon: '📦', label: 'Catálogo de Productos' },
  cart: { icon: '🛒', label: 'Bolsón de Carrito' },
  text: { icon: '📝', label: 'Texto' },
  carousel: { icon: '🎠', label: 'Carrusel' },
  benefits: { icon: '⭐', label: 'Beneficios y Características' },
  socialproof: { icon: '💬', label: 'Prueba Social' },
  'cta-reinforcement': { icon: '🎬', label: 'CTA de Refuerzo' },
  footer: { icon: '🏛️', label: 'Pie de Página' },
}

interface BlocksPanelProps {
  blocks: Block[]
  expandedId: string | null
  showHelpBox: boolean
  onExpandBlock: (id: string | null) => void
  onDismissHelp: () => void
  onAddBlock: () => void
  onUpdateBlock: (id: string, partial: Partial<Block>) => void
  onDeleteBlock: (id: string) => void
  onDuplicateBlock: (id: string) => void
  onToggleVisibility: (id: string) => void
  onDragStart: (index: number) => void
  onDragEnd: (toIndex: number) => void
}

export default function BlocksPanel({
  blocks,
  expandedId,
  showHelpBox,
  onExpandBlock,
  onDismissHelp,
  onAddBlock,
  onUpdateBlock,
  onDeleteBlock,
  onDuplicateBlock,
  onToggleVisibility,
  onDragStart,
  onDragEnd,
}: BlocksPanelProps) {
  return (
    <div className="space-y-4">
      {showHelpBox && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2 mb-2">
            <span className="text-lg">❓</span>
            <div className="flex-1">
              <p className="font-medium text-sm">¿Necesitas ayuda con el editor?</p>
              <p className="text-xs text-gray-600 mt-1">Tutorial paso a paso para aprender a crear páginas increíbles.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onDismissHelp}
              className="flex-1 text-xs px-2 py-1 text-gray-600 hover:bg-white rounded"
            >
              No mostrar de nuevo
            </button>
            <button className="flex-1 text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
              Ver video tutorial
            </button>
          </div>
        </div>
      )}

      <button
        onClick={onAddBlock}
        className="w-full flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
      >
        <Plus className="w-4 h-4" />
        Agregar Bloque
      </button>

      <div className="space-y-2">
        {blocks.map((block, index) => (
          <div key={block.id}>
            <div
              draggable
              onDragStart={() => onDragStart(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDragEnd(index)}
              onClick={() => onExpandBlock(expandedId === block.id ? null : block.id)}
              className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 cursor-move transition"
            >
              <span className="text-gray-400 text-lg">⠿</span>
              <span className="text-lg">{BLOCK_META[block.type].icon}</span>
              <div className="flex-1">
                <p className="text-sm font-medium">{BLOCK_META[block.type].label}</p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleVisibility(block.id)
                }}
                className="p-1 hover:bg-gray-100 rounded"
                title={block.visible ? 'Ocultar' : 'Mostrar'}
              >
                {block.visible ? (
                  <Eye className="w-4 h-4 text-gray-600" />
                ) : (
                  <EyeOff className="w-4 h-4 text-gray-400" />
                )}
              </button>

              <div className="relative group">
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 hover:bg-gray-100 rounded text-gray-600"
                >
                  ⋮
                </button>
                <div className="absolute right-0 top-8 hidden group-hover:block bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[140px]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDuplicateBlock(block.id)
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-50 text-left"
                  >
                    <Copy className="w-4 h-4" />
                    Duplicar
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleVisibility(block.id)
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-50 text-left"
                  >
                    {block.visible ? (
                      <>
                        <EyeOff className="w-4 h-4" />
                        Ocultar
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        Mostrar
                      </>
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteBlock(block.id)
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-red-50 text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </button>
                </div>
              </div>
            </div>

            {expandedId === block.id && (
              <div className="bg-white border border-t-0 border-gray-200 rounded-b-lg p-4">
                {block.type === 'presentation' && (
                  <PresentationSettings
                    block={block as PresentationBlock}
                    onChange={(partial) => onUpdateBlock(block.id, partial)}
                  />
                )}
                {block.type === 'catalog' && (
                  <CatalogSettings
                    block={block as CatalogBlock}
                    onChange={(partial) => onUpdateBlock(block.id, partial)}
                  />
                )}
                {block.type === 'cart' && (
                  <CartSettings
                    block={block as CartBlock}
                    onChange={(partial) => onUpdateBlock(block.id, partial)}
                  />
                )}
                {block.type === 'text' && (
                  <TextSettings
                    block={block as TextBlock}
                    onChange={(partial) => onUpdateBlock(block.id, partial)}
                  />
                )}
                {block.type === 'carousel' && (
                  <CarouselSettings
                    block={block as CarouselBlock}
                    onChange={(partial) => onUpdateBlock(block.id, partial)}
                  />
                )}
                {block.type === 'benefits' && (
                  <BenefitsSettings
                    block={block as BenefitsBlock}
                    onChange={(partial) => onUpdateBlock(block.id, partial)}
                  />
                )}
                {block.type === 'socialproof' && (
                  <SocialProofSettings
                    block={block as SocialProofBlock}
                    onChange={(partial) => onUpdateBlock(block.id, partial)}
                  />
                )}
                {block.type === 'cta-reinforcement' && (
                  <CTAReinforcementSettings
                    block={block as CTAReinforcementBlock}
                    onChange={(partial) => onUpdateBlock(block.id, partial)}
                  />
                )}
                {block.type === 'footer' && (
                  <FooterSettings
                    block={block as FooterBlock}
                    onChange={(partial) => onUpdateBlock(block.id, partial)}
                  />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
