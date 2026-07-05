'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, Monitor, Smartphone, Globe, Loader2, Check } from 'lucide-react'
import Link from 'next/link'
import { saveDesign } from '@/lib/actions/design'
import { saveTheme } from '@/lib/actions/design'
import { saveTheme as saveThemeSettings } from '@/lib/actions/theme'
import type { BlockConfig } from '@/lib/design/blocks'
import { THEME_DEFAULTS as THEME_SETTINGS_DEFAULTS, type ThemeConfig } from '@/lib/design/theme'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import GlobalPanel from './global-panel'
import BlocksPanel from './blocks-panel'
import PreviewPanel from './preview-panel'
import AddBlockModal from './add-block-modal'
import { useI18n } from '@/lib/i18n/context'

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
  buttonPrimaryColor: string
  buttonSecondaryColor: string
  buttonTertiaryColor: string
  categoryPrimaryColor: string
  categorySecondaryColor: string
  categoryTertiaryColor: string
  cartPrimaryColor: string
  cartSecondaryColor: string
  cartTertiaryColor: string
  buttonTextColor: string
  categoryTextColor: string
  cartTextColor: string
  cartCountColor: string
  cartTotalColor: string
  productNameColor: string
  productPriceColor: string
  filterTextColor: string
  buttonCustomMode: boolean
  categoryCustomMode: boolean
  cartCustomMode: boolean
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
  buttonType?: 'cart' | 'appointment'
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

// Paletas predefinidas
const BUTTON_PALETTES = {
  Modern: { primary: '#ff6b57', secondary: '#f8f9fa', tertiary: '#212529' },
  Elegant: { primary: '#8b6914', secondary: '#fdf8f0', tertiary: '#3d2b1f' },
  Minimal: { primary: '#000000', secondary: '#ffffff', tertiary: '#333333' },
  Sakura: { primary: '#e8a0b4', secondary: '#fff0f3', tertiary: '#5c2d40' },
}

const CATEGORY_PALETTES = {
  Matcha: { primary: '#4a7c59', secondary: '#f4f9f0', tertiary: '#1e3a2f' },
  Milano: { primary: '#c0392b', secondary: '#fff8f0', tertiary: '#2c1810' },
  Santorini: { primary: '#0077b6', secondary: '#f0f8ff', tertiary: '#023e8a' },
  Brooklyn: { primary: '#6c757d', secondary: '#f8f9fa', tertiary: '#212529' },
}

const CART_PALETTES = {
  Alexandra: { primary: '#9b59b6', secondary: '#faf5ff', tertiary: '#4a235a' },
  Coastal: { primary: '#17a589', secondary: '#e8f8f5', tertiary: '#0e6655' },
  Nordic: { primary: '#5dade2', secondary: '#f0f8ff', tertiary: '#1b4f72' },
  Bistro: { primary: '#e67e22', secondary: '#fef9f0', tertiary: '#784212' },
  'Tech Noir': { primary: '#00d2ff', secondary: '#0d1117', tertiary: '#c9d1d9' },
  'Dark Elegance': { primary: '#d4af37', secondary: '#1a1a2e', tertiary: '#eaeaea' },
  'Midnight Blue': { primary: '#4fc3f7', secondary: '#0a1628', tertiary: '#e3f2fd' },
}

const PALETTES = {
  ...BUTTON_PALETTES,
  ...CATEGORY_PALETTES,
  ...CART_PALETTES,
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
  buttonPrimaryColor: '#ff6b57',
  buttonSecondaryColor: '#f8f9fa',
  buttonTertiaryColor: '#212529',
  categoryPrimaryColor: '#4a7c59',
  categorySecondaryColor: '#f4f9f0',
  categoryTertiaryColor: '#1e3a2f',
  cartPrimaryColor: '#9b59b6',
  cartSecondaryColor: '#faf5ff',
  cartTertiaryColor: '#4a235a',
  buttonTextColor: '#ffffff',
  categoryTextColor: '#ffffff',
  cartTextColor: '#ffffff',
  cartCountColor: '#ef4444',
  cartTotalColor: '#1f2937',
  productNameColor: '#1f2937',
  productPriceColor: '#111827',
  filterTextColor: '#4b5563',
  buttonCustomMode: false,
  categoryCustomMode: false,
  cartCustomMode: false,
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
    showPriceFilter: false,
    showAvailabilityFilter: false,
    showRatingFilter: false,
    showBrandFilter: false,
    showDiscountFilter: false,
    showTitle: true,
    showPrice: true,
    showDescription: false,
    showExternalLink: false,
    enableCart: true,
    buttonType: 'cart',
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
  cart: { icon: '🛒', label: 'Botón de carrito de compras', color: 'red' },
  text: { icon: '📝', label: 'Texto', color: 'yellow' },
  carousel: { icon: '🎠', label: 'Carrusel', color: 'blue' },
  benefits: { icon: '⭐', label: 'Beneficios y Características', color: 'green' },
  socialproof: { icon: '💬', label: 'Prueba Social', color: 'indigo' },
  'cta-reinforcement': { icon: '🎬', label: 'CTA de Refuerzo', color: 'pink' },
  footer: { icon: '🏛️', label: 'Pie de Página', color: 'slate' },
}

interface Category {
  id: string
  name: string
}

interface DesignEditorProps {
  catalogId: string
  catalogSlug: string
  initialBlocks?: Block[]
  initialTheme?: Partial<ThemeState>
  initialThemeSettings?: ThemeConfig
  categories?: Category[]
}

interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  compareAt: number | null
  stock: number | null
  categoryId: string | null
  images: { url: string }[]
  variants: any[]
}

export default function DesignEditor({
  catalogId,
  catalogSlug,
  initialBlocks,
  initialTheme,
  initialThemeSettings = THEME_SETTINGS_DEFAULTS,
  categories = [],
}: DesignEditorProps) {
  const { t } = useI18n()
  const [theme, setTheme] = useState<ThemeState>(
    initialTheme ? { ...THEME_DEFAULTS, ...initialTheme } : THEME_DEFAULTS
  )
  const [blocks, setBlocks] = useState<Block[]>(
    initialBlocks?.length ? initialBlocks : DEFAULT_BLOCKS
  )
  const [expandedId, setExpandedId] = useState<string | null>('1')
  const [activeTab, setActiveTab] = useState<'blocks' | 'global' | 'preview'>('blocks')
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showHelpBox, setShowHelpBox] = useState(true)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [products, setProducts] = useState<Product[]>([])

  // Tema (themeSchema): colores/marca movidos al panel Global. Se edita aquí y se
  // guarda con el botón "Guardar" superior (no tiene su propio botón).
  const [themeSettings, setThemeSettings] = useState<ThemeConfig>(initialThemeSettings)
  // Sincroniza las claves compartidas con el estado del editor (ThemeState) para
  // que ambos sistemas no se pisen al guardar (primaryColor, bgColor).
  const updateThemeSettings = (next: ThemeConfig) => {
    setThemeSettings(next)
    setTheme((t) => ({ ...t, primaryColor: next.primaryColor, bgColor: next.bgColor }))
  }

  // Indicador "Sin guardar": se activa ante cualquier cambio de bloques o tema.
  const [dirty, setDirty] = useState(false)
  const skipFirstDirty = useRef(true)
  useEffect(() => {
    if (skipFirstDirty.current) {
      skipFirstDirty.current = false
      return
    }
    setDirty(true)
  }, [blocks, theme, themeSettings])

  // Fetch products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`/api/v1/catalogs/${catalogSlug}/products`)
        if (response.ok) {
          const data = await response.json()
          // La API v1 devuelve precios en centavos; el preview muestra unidades enteras.
          const normalized = (data.data || []).map((p: Product) => ({
            ...p,
            price: p.price / 100,
            compareAt: p.compareAt != null ? p.compareAt / 100 : p.compareAt,
          }))
          setProducts(normalized)
        }
      } catch (err) {
        console.error('Error fetching products:', err)
      }
    }

    fetchProducts()
  }, [catalogSlug])

  // Prevent preview tab on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && activeTab === 'preview') {
        setActiveTab('blocks')
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [activeTab])

  const updateBlock = (id: string, partial: Partial<Block>) => {
    setBlocks(blocks.map(b => (b.id === id ? ({ ...b, ...partial } as Block) : b)))
  }

  const addBlock = (type: Block['type']) => {
    const baseId = `block-${Date.now()}`
    let newBlock: Block

    if (type === 'presentation') {
      newBlock = {
        id: baseId,
        visible: true,
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
      }
    } else if (type === 'catalog') {
      newBlock = {
        id: baseId,
        visible: true,
        type: 'catalog',
        template: 'grid',
        showCategoryFilter: true,
        showSearch: false,
        showSortFilter: false,
        showPriceFilter: false,
        showAvailabilityFilter: false,
        showRatingFilter: false,
        showBrandFilter: false,
        showDiscountFilter: false,
        showTitle: true,
        showPrice: true,
        showDescription: false,
        showExternalLink: false,
        enableCart: true,
        buttonType: 'cart',
      }
    } else if (type === 'cart') {
      newBlock = {
        id: baseId,
        visible: true,
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
      }
    } else if (type === 'carousel') {
      newBlock = {
        id: baseId,
        visible: true,
        type: 'carousel',
        items: [
          {
            id: 'item-1',
            image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=400&fit=crop',
            title: 'Slide 1',
            description: 'Descripción del primer slide',
            link: '',
          },
          {
            id: 'item-2',
            image: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=800&h=400&fit=crop',
            title: 'Slide 2',
            description: 'Descripción del segundo slide',
            link: '',
          },
        ],
        autoplay: true,
        autoplaySpeed: 5,
        showDots: true,
        showArrows: true,
        height: 'md',
        transition: 'slide',
      }
    } else if (type === 'benefits') {
      newBlock = {
        id: baseId,
        visible: true,
        type: 'benefits',
        title: 'Beneficios y Características',
        subtitle: 'Descubre lo que nos hace especiales',
        columns: 3,
        items: [
          {
            id: `benefit-1`,
            icon: '✨',
            title: 'Beneficio 1',
            description: 'Descripción del beneficio',
          },
          {
            id: `benefit-2`,
            icon: '🚀',
            title: 'Beneficio 2',
            description: 'Descripción del beneficio',
          },
          {
            id: `benefit-3`,
            icon: '💎',
            title: 'Beneficio 3',
            description: 'Descripción del beneficio',
          },
        ],
        bgColor: '#ffffff',
        textColor: '#000000',
        iconColor: '#ff6b57',
        iconSize: 'md',
        padding: 'lg',
      }
    } else if (type === 'socialproof') {
      newBlock = {
        id: baseId,
        visible: true,
        type: 'socialproof',
        title: 'Lo que dicen nuestros clientes',
        subtitle: 'Testimonios reales de clientes satisfechos',
        layout: 'grid',
        columns: 3,
        items: [
          {
            id: `testimonial-1`,
            name: 'Juan Pérez',
            role: 'CEO',
            company: 'Tech Solutions',
            text: 'Excelente servicio, muy recomendado. Superó nuestras expectativas.',
            rating: 5,
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Juan',
          },
          {
            id: `testimonial-2`,
            name: 'María García',
            role: 'Emprendedora',
            company: 'StartUp Latina',
            text: 'El mejor equipo con el que hemos trabajado. Profesionales y atentos.',
            rating: 5,
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
          },
          {
            id: `testimonial-3`,
            name: 'Carlos López',
            role: 'Gerente de Proyectos',
            company: 'Constructora Global',
            text: 'Impresionante calidad. Definitivamente volveríamos a trabajar.',
            rating: 4,
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos',
          },
        ],
        showRating: true,
        showAvatar: true,
        showRole: true,
        bgColor: '#f9fafb',
        textColor: '#000000',
        ratingColor: '#fbbf24',
        padding: 'lg',
      }
    } else if (type === 'cta-reinforcement') {
      newBlock = {
        id: baseId,
        visible: true,
        type: 'cta-reinforcement',
        title: '¿Listo para comenzar?',
        subtitle: 'Toma acción ahora y únete a nuestros clientes satisfechos',
        buttonText: 'Comprar Ahora',
        buttonAction: 'url',
        buttonUrl: '#',
        buttonPhone: '',
        buttonEmail: '',
        scrollTarget: '',
        buttonColor: '#ff6b57',
        textColor: '#000000',
        bgColor: '#ffffff',
        fontSize: 'md',
        buttonSize: 'md',
        alignment: 'center',
        padding: 'lg',
        showBorder: false,
        borderColor: '#000000',
        borderWidth: 'none',
      }
    } else if (type === 'footer') {
      newBlock = {
        id: baseId,
        visible: true,
        type: 'footer',
        companyName: 'Mi Empresa',
        companyDescription: 'Descripción breve de tu empresa aquí',
        address: 'Calle 123 #45, Bogotá, Colombia',
        phone: '+57 1 123 4567',
        email: 'contacto@empresa.com',
        website: 'https://www.empresa.com',
        socialLinks: [
          { id: 'social-1', name: 'Facebook', url: 'https://facebook.com' },
          { id: 'social-2', name: 'Instagram', url: 'https://instagram.com' },
          { id: 'social-3', name: 'LinkedIn', url: 'https://linkedin.com' },
        ],
        copyrightText: '© 2026 Mi Empresa. Todos los derechos reservados.',
        bgColor: '#1f2937',
        textColor: '#ffffff',
        accentColor: '#ff6b57',
        layout: 'standard',
        showSocialLinks: true,
        showDescription: true,
        showAddress: true,
        showPhone: true,
        showEmail: true,
        showWebsite: true,
        showCopyright: true,
        showCompanyInfo: true,
        showContactInfo: true,
        alignment: 'left',
      }
    } else {
      newBlock = {
        id: baseId,
        visible: true,
        type: 'text',
        content: '',
        align: 'left',
        bold: false,
        italic: false,
        underline: false,
        fontSize: 'md',
      }
    }

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
    setTheme((t) => ({ ...t, ...partial }))
    // borderRadius existe en ambos sistemas (preview = ThemeState, storefront =
    // themeSchema). Lo sincronizamos para que no se pisen al guardar.
    if (partial.borderRadius !== undefined) {
      setThemeSettings((ts) => ({ ...ts, borderRadius: partial.borderRadius as string }))
    }
  }

  const handleSaveDesign = async () => {
    setSaving(true)
    try {
      const blockConfigs = blocks.map((block) => ({
        id: block.id,
        type: block.type,
        active: block.visible,
        config: { ...block },
      }))

      // Los dos guardados de tema escriben en la misma columna (themeJson), así
      // que van en secuencia para que el segundo fusione sobre el primero y no
      // se pisen. saveDesign (bloques) sí puede ir en paralelo.
      const [designResult, themeResult] = await Promise.all([
        saveDesign(catalogId, blockConfigs as any),
        saveTheme(catalogId, theme as unknown as Record<string, unknown>),
      ])
      const themeSettingsResult = await saveThemeSettings(catalogId, themeSettings)

      const ok =
        ('ok' in designResult && designResult.ok) ||
        ('ok' in themeResult && themeResult.ok) ||
        ('ok' in themeSettingsResult && themeSettingsResult.ok)

      if (ok) {
        setDirty(false)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      } else if ('error' in designResult) {
        alert(designResult.error || t('design.editor.saveError'))
      } else if ('error' in themeResult) {
        alert(themeResult.error || t('design.editor.saveThemeError'))
      } else if ('error' in themeSettingsResult) {
        alert(themeSettingsResult.error || t('design.editor.saveThemeError'))
      }
    } catch (err) {
      console.error('Save error:', err)
      alert(t('design.editor.saveDesignError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-gray-200 bg-white">
        <div className="px-6 py-3 flex items-center justify-between">
          <Link href={`/app/catalogs/${catalogId}`} className="flex items-center gap-2 hover:text-gray-600">
            <ChevronLeft className="w-5 h-5" />
            <h1 className="text-xl font-semibold">{t('design.editor.title')}</h1>
          </Link>

          <div className="flex items-center gap-4">
            {/* Desktop/Mobile Toggle - hidden on mobile */}
            <div className="hidden md:flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setPreviewMode('desktop')}
                className={`p-2 rounded ${previewMode === 'desktop' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
                title={t('design.editor.viewDesktop')}
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewMode('mobile')}
                className={`p-2 rounded ${previewMode === 'mobile' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
                title={t('design.editor.viewMobile')}
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {dirty && !saving && !saved && (
                <span className="text-xs font-medium text-amber-500">{t('design.editor.unsaved')}</span>
              )}
              <button
                onClick={handleSaveDesign}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition"
              >
                {saved ? (
                  <>
                    <Check className="w-4 h-4" />
                    {t('design.editor.saved')}
                  </>
                ) : saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('design.editor.saving')}
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4" />
                    {t('design.editor.save')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {activeTab === 'preview' ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200 px-4 py-3 md:hidden">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'blocks' | 'global' | 'preview')}>
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="blocks" className="text-xs">
                  {t('design.editor.tabBlocks')}
                </TabsTrigger>
                <TabsTrigger value="preview" className="text-xs">
                  {t('design.editor.tabPreview')}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex-1 overflow-auto bg-gray-100">
            <PreviewPanel
              blocks={blocks}
              theme={theme}
              previewMode="mobile"
              catalogSlug={catalogSlug}
              products={products}
              categories={categories}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-gray-200 overflow-y-auto bg-gray-50">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'blocks' | 'global' | 'preview')} className="h-full">
              <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200 px-4 py-3">
                <TabsList className="w-full grid md:grid-cols-2 grid-cols-3">
                  <TabsTrigger value="blocks" className="text-xs">
                    {t('design.editor.tabBlocks')}
                  </TabsTrigger>
                  <TabsTrigger value="global" className="text-xs">
                    {t('design.editor.tabGlobal')}
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="text-xs md:hidden">
                    {t('design.editor.tabPreview')}
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
                <GlobalPanel
                  buttonPalettes={BUTTON_PALETTES}
                  categoryPalettes={CATEGORY_PALETTES}
                  cartPalettes={CART_PALETTES}
                  fonts={FONTS}
                  theme={theme}
                  onUpdateTheme={updateTheme}
                  catalogId={catalogId}
                  catalogSlug={catalogSlug}
                  themeSettings={themeSettings}
                  onUpdateThemeSettings={updateThemeSettings}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Panel - Preview (hidden on mobile, visible on desktop) */}
          <div className="hidden md:flex flex-1 overflow-auto bg-gray-100">
            <PreviewPanel
              blocks={blocks}
              theme={theme}
              previewMode={previewMode}
              catalogSlug={catalogSlug}
              products={products}
              categories={categories}
            />
          </div>
        </div>
      )}

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
