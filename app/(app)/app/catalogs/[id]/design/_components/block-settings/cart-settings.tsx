'use client'

import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { useI18n } from '@/lib/i18n/context'

interface CartBlock {
  id: string
  visible: boolean
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

interface CartSettingsProps {
  block: CartBlock
  onChange: (partial: Partial<CartBlock>) => void
}

export default function CartSettings({ block, onChange }: CartSettingsProps) {
  const { t } = useI18n()
  const [expandedSection, setExpandedSection] = useState('options')

  const positions = [
    { value: 'top-left', label: '↖', position: 'top-left' },
    { value: 'top-right', label: '↗', position: 'top-right' },
    { value: 'center-left', label: '←', position: 'center-left' },
    { value: 'center-right', label: '→', position: 'center-right' },
    { value: 'bottom-left', label: '↙', position: 'bottom-left' },
    { value: 'bottom-right', label: '↘', position: 'bottom-right' },
  ]

  return (
    <div className="space-y-4">
      {/* Options */}
      <div className="border border-gray-200 rounded-lg">
        <button
          onClick={() => setExpandedSection(expandedSection === 'options' ? '' : 'options')}
          className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
        >
          <h4 className="font-semibold text-sm">{t('design.settings.common.options')}</h4>
          <ChevronDown className={`w-4 h-4 transition ${expandedSection === 'options' ? 'rotate-180' : ''}`} />
        </button>

        {expandedSection === 'options' && (
          <div className="px-3 pb-3 space-y-3 border-t border-gray-200 pt-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={block.showItemCount}
                onChange={(e) => onChange({ showItemCount: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-xs font-medium">{t('design.settings.cart.showItemCount')}</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={block.showTotalPrice}
                onChange={(e) => onChange({ showTotalPrice: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-xs font-medium">{t('design.settings.cart.showTotalPrice')}</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={block.showPreviewFirst}
                onChange={(e) => onChange({ showPreviewFirst: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-xs font-medium">{t('design.settings.cart.previewFirst')}</span>
            </label>
          </div>
        )}
      </div>

      {/* Position */}
      <div className="border border-gray-200 rounded-lg">
        <button
          onClick={() => setExpandedSection(expandedSection === 'position' ? '' : 'position')}
          className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
        >
          <h4 className="font-semibold text-sm">{t('design.settings.common.position')}</h4>
          <ChevronDown className={`w-4 h-4 transition ${expandedSection === 'position' ? 'rotate-180' : ''}`} />
        </button>

        {expandedSection === 'position' && (
          <div className="px-3 pb-3 border-t border-gray-200 pt-3">
            <div className="grid grid-cols-3 gap-2">
              {positions.map((pos) => (
                <button
                  key={pos.value}
                  onClick={() => onChange({ position: pos.value as any })}
                  className={`p-3 rounded-lg border-2 transition text-lg font-bold ${
                    block.position === pos.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Size */}
      <div className="border border-gray-200 rounded-lg">
        <button
          onClick={() => setExpandedSection(expandedSection === 'size' ? '' : 'size')}
          className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
        >
          <h4 className="font-semibold text-sm">{t('design.settings.common.size')}</h4>
          <ChevronDown className={`w-4 h-4 transition ${expandedSection === 'size' ? 'rotate-180' : ''}`} />
        </button>

        {expandedSection === 'size' && (
          <div className="px-3 pb-3 space-y-2 border-t border-gray-200 pt-3">
            <div className="flex gap-2">
              {['sm', 'md', 'lg'].map((s) => (
                <button
                  key={s}
                  onClick={() => onChange({ size: s as 'sm' | 'md' | 'lg' })}
                  className={`flex-1 px-2 py-2 text-xs rounded font-medium ${
                    block.size === s ? 'bg-blue-600 text-white' : 'bg-gray-100'
                  }`}
                >
                  {s === 'sm' ? t('design.settings.common.sizeSmall') : s === 'md' ? t('design.settings.common.sizeMedium') : t('design.settings.common.sizeLarge')}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Animation */}
      <div className="border border-gray-200 rounded-lg">
        <button
          onClick={() => setExpandedSection(expandedSection === 'animation' ? '' : 'animation')}
          className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
        >
          <h4 className="font-semibold text-sm">{t('design.settings.common.animation')}</h4>
          <ChevronDown className={`w-4 h-4 transition ${expandedSection === 'animation' ? 'rotate-180' : ''}`} />
        </button>

        {expandedSection === 'animation' && (
          <div className="px-3 pb-3 space-y-2 border-t border-gray-200 pt-3">
            <div className="grid grid-cols-2 gap-2">
              {['none', 'pulse', 'bounce', 'scale'].map((anim) => (
                <button
                  key={anim}
                  onClick={() => onChange({ animation: anim as 'none' | 'pulse' | 'bounce' | 'scale' })}
                  className={`px-2 py-2 text-xs rounded font-medium ${
                    block.animation === anim ? 'bg-blue-600 text-white' : 'bg-gray-100'
                  }`}
                >
                  {anim === 'none' ? t('design.settings.cart.animNone') : anim === 'pulse' ? t('design.settings.cart.animPulse') : anim === 'bounce' ? t('design.settings.cart.animBounce') : t('design.settings.cart.animScale')}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Colors */}
      <div className="border border-gray-200 rounded-lg">
        <button
          onClick={() => setExpandedSection(expandedSection === 'colors' ? '' : 'colors')}
          className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
        >
          <h4 className="font-semibold text-sm">{t('design.settings.common.colors')}</h4>
          <ChevronDown className={`w-4 h-4 transition ${expandedSection === 'colors' ? 'rotate-180' : ''}`} />
        </button>

        {expandedSection === 'colors' && (
          <div className="px-3 pb-3 space-y-3 border-t border-gray-200 pt-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={block.useCustomColors}
                onChange={(e) => onChange({ useCustomColors: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-xs font-medium">{t('design.settings.common.customizeColors')}</span>
            </label>

            {block.useCustomColors && (
              <>
                <div>
                  <label className="text-xs font-medium text-gray-700">{t('design.settings.common.bgColor')}</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={block.bgColor}
                      onChange={(e) => onChange({ bgColor: e.target.value })}
                      className="w-10 h-8 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={block.bgColor}
                      onChange={(e) => onChange({ bgColor: e.target.value })}
                      className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700">{t('design.settings.common.iconColor')}</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={block.iconColor}
                      onChange={(e) => onChange({ iconColor: e.target.value })}
                      className="w-10 h-8 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={block.iconColor}
                      onChange={(e) => onChange({ iconColor: e.target.value })}
                      className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded font-mono"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
