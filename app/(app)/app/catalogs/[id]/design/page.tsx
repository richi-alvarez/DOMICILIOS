'use client'

import { useState } from 'react'
import { ChevronLeft, Monitor, Smartphone, Globe } from 'lucide-react'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import GlobalPanel from './_components/global-panel'
import BlocksPanel from './_components/blocks-panel'
import PreviewPanel from './_components/preview-panel'
import AddBlockModal from './_components/add-block-modal'

// Types
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

// Paletas predefinidas
const PALETTES = {
  Modern: { primary: '#ff6b57', secondary: '#f8f9fa', tertiary: '#212529' },
  Elegant: { primary: '#8b6914', secondary: '#fdf8f0', tertiary: '#3d2b1f' },
  Minimal: { primary: '#000000', secondary: '#ffffff', tertiary: '#333333' },
  Sakura: { primary: '#e8a0b4', secondary: '#fff0f3', tertiary: '#5c2d40' },
  Matcha: { primary: '#4a7c59', secondary: '#f4f9f0', tertiary: '#1e3a2f' },
  Milano: { primary: '#c0392b', secondary: '#fff8f0', tertiary: '#2c1810' },
  Santorini: { primary: '#0077b6', secondary: '#f0f8ff', tertiary: '#023e8a' },
  Brooklyn: { primary: '#6c757d', secondary: '#f8f9fa', tertiary: '#212529' },
  Alexandra: { primary: '#9b59b6', secondary: '#faf5ff', tertiary: '#4a235a' },
  Coastal: { primary: '#17a589', secondary: '#e8f8f5', tertiary: '#0e6655' },
  Nordic: { primary: '#5dade2', secondary: '#f0f8ff', tertiary: '#1b4f72' },
  Bistro: { primary: '#e67e22', secondary: '#fef9f0', tertiary: '#784212' },
  'Tech Noir': { primary: '#00d2ff', secondary: '#0d1117', tertiary: '#c9d1d9' },
  'Dark Elegance': { primary: '#d4af37', secondary: '#1a1a2e', tertiary: '#eaeaea' },
  'Midnight Blue': { primary: '#4fc3f7', secondary: '#0a1628', tertiary: '#e3f2fd' },
}

const FONTS = {
  'Sans-serif modernas': ['poppins', 'inter', 'lato', 'raleway', 'nunito', 'manrope', 'dmSans', 'arial', 'helvetica'],
  'Serif y elegantes': ['georgia', 'timesNewRoman', 'playfairDisplay', 'cormorantGaramond', 'cinzel', 'tenorSans'],
}

const THEME_DEFAULTS: ThemeState = {
  selectedPalette: null,
  primaryColor: '#ff6b57',
  secondaryColor: '#f8f9fa',
  tertiaryColor: '#212529',
  font: 'poppins',
  borderRadius: 'sm',
  bgType: 'color',
  bgColor: '#ffffff',
  bgImage: null,
  bgVideoUrl: '',
}

const DEFAULT_BLOCKS: Block[] = [
  {
    id: '1',
    type: 'presentation',
    visible: true,
    bgType: 'image',
    bgColor: '#ffffff',
    bgImage: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&h=600&fit=crop',
    bgVideoUrl: '',
    overlayOpacity: 40,
    overlayType: 'dark',
    title: 'MDE Burgers',
    subtitle: 'En MDE burgers preparamos hamburguesas, perros calientes y pizzas pensadas para disfrutar con tu familia. Realiza tu pedido ahora.',
    textAlign: 'center',
    textColor: '#ffffff',
    presentationImage: null,
    showCta: true,
    ctaText: 'Ordenar ahora',
    ctaActionType: 'url',
    ctaUrl: '#',
    sectionSize: 'md',
    fullHeight: false,
  },
  {
    id: '2',
    type: 'catalog',
    visible: true,
    template: 'grid',
    showCategoryFilter: true,
    showSearch: false,
    showSortFilter: false,
    showTitle: true,
    showPrice: true,
    showDescription: false,
    showExternalLink: false,
    enableCart: true,
  },
  {
    id: '3',
    type: 'cart',
    visible: true,
    showItemCount: true,
    showTotalPrice: true,
    showPreviewFirst: false,
    position: 'bottom-right',
    size: 'md',
    animation: 'none',
    useCustomColors: false,
    bgColor: '#ff6b57',
    iconColor: '#ffffff',
  },
  {
    id: '4',
    type: 'text',
    visible: true,
    content: '',
    align: 'left',
    bold: false,
    italic: false,
    underline: false,
    fontSize: 'md',
  },
]

const BLOCK_META: Record<string, { icon: string; label: string; color: string }> = {
  presentation: { icon: '🎯', label: 'Sección de Presentación', color: 'purple' },
  catalog: { icon: '📦', label: 'Catálogo de Productos', color: 'orange' },
  cart: { icon: '🛒', label: 'Bolsón de Carrito', color: 'red' },
  text: { icon: '📝', label: 'Texto', color: 'yellow' },
}

export default function DesignPage({ params }: { params: { id: string } }) {
  const [theme, setTheme] = useState<ThemeState>(THEME_DEFAULTS)
  const [blocks, setBlocks] = useState<Block[]>(DEFAULT_BLOCKS)
  const [expandedId, setExpandedId] = useState<string | null>('1')
  const [activeTab, setActiveTab] = useState<'blocks' | 'global'>('blocks')
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showHelpBox, setShowHelpBox] = useState(true)
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  // Handlers
  const updateBlock = (id: string, partial: Partial<Block>) => {
    setBlocks(blocks.map(b => (b.id === id ? { ...b, ...partial } : b)))
  }

  const addBlock = (type: Block['type']) => {
    const newBlock: Block = {
      id: `block-${Date.now()}`,
      visible: true,
      ...(type === 'presentation' && {
        type: 'presentation',
        bgType: 'color',
        bgColor: '#ffffff',
        bgImage: null,
        bgVideoUrl: '',
        overlayOpacity: 40,
        overlayType: 'dark',
        title: 'New Section',
        subtitle: '',
        textAlign: 'center',
        textColor: '#000000',
        presentationImage: null,
        showCta: false,
        ctaText: '',
        ctaActionType: 'url',
        ctaUrl: '',
        sectionSize: 'md',
        fullHeight: false,
      }),
      ...(type === 'catalog' && {
        type: 'catalog',
        template: 'grid',
        showCategoryFilter: true,
        showSearch: false,
        showSortFilter: false,
        showTitle: true,
        showPrice: true,
        showDescription: false,
        showExternalLink: false,
        enableCart: true,
      }),
      ...(type === 'cart' && {
        type: 'cart',
        showItemCount: true,
        showTotalPrice: true,
        showPreviewFirst: false,
        position: 'bottom-right',
        size: 'md',
        animation: 'none',
        useCustomColors: false,
        bgColor: '#ff6b57',
        iconColor: '#ffffff',
      }),
      ...(type === 'text' && {
        type: 'text',
        content: '',
        align: 'left',
        bold: false,
        italic: false,
        underline: false,
        fontSize: 'md',
      }),
    } as Block

    setBlocks([...blocks, newBlock])
    setExpandedId(newBlock.id)
  }

  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  const duplicateBlock = (id: string) => {
    const block = blocks.find(b => b.id === id)
    if (!block) return

    const newBlock = {
      ...block,
      id: `block-${Date.now()}`,
    }
    setBlocks([...blocks, newBlock])
  }

  const toggleBlockVisibility = (id: string) => {
    updateBlock(id, { visible: !blocks.find(b => b.id === id)?.visible })
  }

  const reorderBlocks = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return
    const newBlocks = [...blocks]
    const [item] = newBlocks.splice(fromIndex, 1)
    newBlocks.splice(toIndex, 0, item)
    setBlocks(newBlocks)
    setDragIndex(null)
  }

  const updateTheme = (partial: Partial<ThemeState>) => {
    setTheme({ ...theme, ...partial })
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-gray-200 bg-white">
        <div className="px-6 py-3 flex items-center justify-between">
          <Link href={`/app/catalogs/${params.id}`} className="flex items-center gap-2 hover:text-gray-600">
            <ChevronLeft className="w-5 h-5" />
            <h1 className="text-xl font-semibold">Diseño de Página</h1>
          </Link>

          <div className="flex items-center gap-4">
            {/* Desktop/Mobile Toggle */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setPreviewMode('desktop')}
                className={`p-2 rounded ${previewMode === 'desktop' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
                title="Vista Desktop"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewMode('mobile')}
                className={`p-2 rounded ${previewMode === 'mobile' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
                title="Vista Móvil"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>

            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
              <Globe className="w-4 h-4" />
              Publicar
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <div className="w-80 border-r border-gray-200 overflow-y-auto bg-gray-50">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'blocks' | 'global')} className="h-full">
            <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200 px-4 py-3">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="blocks" className="text-xs">
                  Bloques
                </TabsTrigger>
                <TabsTrigger value="global" className="text-xs">
                  Global
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="blocks" className="p-4 space-y-4">
              <BlocksPanel
                blocks={blocks}
                expandedId={expandedId}
                showHelpBox={showHelpBox}
                onExpandBlock={setExpandedId}
                onDismissHelp={() => setShowHelpBox(false)}
                onAddBlock={() => setShowAddModal(true)}
                onUpdateBlock={updateBlock}
                onDeleteBlock={deleteBlock}
                onDuplicateBlock={duplicateBlock}
                onToggleVisibility={toggleBlockVisibility}
                onDragStart={(index) => setDragIndex(index)}
                onDragEnd={(toIndex) => dragIndex !== null && reorderBlocks(dragIndex, toIndex)}
              />
            </TabsContent>

            <TabsContent value="global" className="p-4">
              <GlobalPanel palettes={PALETTES} fonts={FONTS} theme={theme} onUpdateTheme={updateTheme} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Panel - Preview */}
        <div className="flex-1 overflow-auto bg-gray-100">
          <PreviewPanel
            blocks={blocks}
            theme={theme}
            previewMode={previewMode}
            catalogSlug="test-restaurant"
          />
        </div>
      </div>

      {/* Add Block Modal */}
      <AddBlockModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onAddBlock={(type) => {
          addBlock(type)
          setShowAddModal(false)
        }}
      />
    </div>
  )
}
