'use client'

import { AlignLeft, AlignCenter, AlignRight, AlignJustify, Bold, Italic, Underline } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'

interface TextBlock {
  id: string
  visible: boolean
  type: 'text'
  content: string
  align: 'left' | 'center' | 'right' | 'justify'
  bold: boolean
  italic: boolean
  underline: boolean
  fontSize: 'sm' | 'md' | 'lg'
}

interface TextSettingsProps {
  block: TextBlock
  onChange: (partial: Partial<TextBlock>) => void
}

export default function TextSettings({ block, onChange }: TextSettingsProps) {
  const { t } = useI18n()
  const alignMap = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
    justify: 'text-justify',
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 p-2 bg-gray-100 rounded-lg border border-gray-300">
        {/* Alignment */}
        <div className="flex gap-1 border-r border-gray-300 pr-2">
          <button
            onClick={() => onChange({ align: 'left' })}
            className={`p-2 rounded ${block.align === 'left' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
            title={t('design.settings.common.alignLeft')}
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onChange({ align: 'center' })}
            className={`p-2 rounded ${block.align === 'center' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
            title={t('design.settings.common.alignCenter')}
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            onClick={() => onChange({ align: 'right' })}
            className={`p-2 rounded ${block.align === 'right' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
            title={t('design.settings.common.alignRight')}
          >
            <AlignRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onChange({ align: 'justify' })}
            className={`p-2 rounded ${block.align === 'justify' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
            title={t('design.settings.common.justify')}
          >
            <AlignJustify className="w-4 h-4" />
          </button>
        </div>

        {/* Format */}
        <div className="flex gap-1 border-r border-gray-300 pr-2">
          <button
            onClick={() => onChange({ bold: !block.bold })}
            className={`p-2 rounded font-bold ${block.bold ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
            title={t('design.settings.common.bold')}
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => onChange({ italic: !block.italic })}
            className={`p-2 rounded italic ${block.italic ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
            title={t('design.settings.common.italic')}
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => onChange({ underline: !block.underline })}
            className={`p-2 rounded underline ${block.underline ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
            title={t('design.settings.common.underline')}
          >
            <Underline className="w-4 h-4" />
          </button>
        </div>

        {/* Font Size */}
        <div className="flex gap-1">
          {['sm', 'md', 'lg'].map((size) => (
            <button
              key={size}
              onClick={() => onChange({ fontSize: size as 'sm' | 'md' | 'lg' })}
              className={`px-2 py-1 rounded text-xs font-medium ${
                block.fontSize === size ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
              }`}
            >
              {size === 'sm' ? 'S' : size === 'md' ? 'M' : 'L'}
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div>
        <label className="text-xs font-medium text-gray-700 block mb-2">{t('design.settings.text.content')}</label>
        <textarea
          value={block.content}
          onChange={(e) => onChange({ content: e.target.value })}
          className={`w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            alignMap[block.align]
          } ${block.bold ? 'font-bold' : ''} ${block.italic ? 'italic' : ''} ${block.underline ? 'underline' : ''} ${
            block.fontSize === 'sm' ? 'text-sm' : block.fontSize === 'md' ? 'text-base' : 'text-lg'
          }`}
          style={{ minHeight: '200px' }}
          placeholder={t('design.settings.text.contentPlaceholder')}
        />
      </div>

      {/* Preview */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-xs font-medium text-gray-600 mb-2">{t('design.settings.common.preview')}</p>
        <div
          className={`${alignMap[block.align]} ${block.bold ? 'font-bold' : ''} ${block.italic ? 'italic' : ''} ${
            block.underline ? 'underline' : ''
          } ${
            block.fontSize === 'sm' ? 'text-sm' : block.fontSize === 'md' ? 'text-base' : 'text-lg'
          }`}
        >
          {block.content || t('design.settings.text.contentEmpty')}
        </div>
      </div>
    </div>
  )
}
