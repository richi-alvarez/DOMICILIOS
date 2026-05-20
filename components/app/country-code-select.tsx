'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const COUNTRIES = [
  { code: '+57', name: 'Colombia 🇨🇴', flag: '🇨🇴' },
  { code: '+1', name: 'USA/Canada 🇺🇸', flag: '🇺🇸' },
  { code: '+34', name: 'España 🇪🇸', flag: '🇪🇸' },
  { code: '+56', name: 'Chile 🇨🇱', flag: '🇨🇱' },
  { code: '+55', name: 'Brasil 🇧🇷', flag: '🇧🇷' },
  { code: '+52', name: 'México 🇲🇽', flag: '🇲🇽' },
  { code: '+51', name: 'Perú 🇵🇪', flag: '🇵🇪' },
  { code: '+54', name: 'Argentina 🇦🇷', flag: '🇦🇷' },
  { code: '+58', name: 'Venezuela 🇻🇪', flag: '🇻🇪' },
  { code: '+591', name: 'Bolivia 🇧🇴', flag: '🇧🇴' },
  { code: '+593', name: 'Ecuador 🇪🇨', flag: '🇪🇨' },
  { code: '+595', name: 'Paraguay 🇵🇾', flag: '🇵🇾' },
  { code: '+598', name: 'Uruguay 🇺🇾', flag: '🇺🇾' },
]

interface CountryCodeSelectProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function CountryCodeSelect({ value, onChange, disabled }: CountryCodeSelectProps) {
  const selectedCountry = COUNTRIES.find(c => c.code === value) || COUNTRIES[0]

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-40">
        <SelectValue>
          <div className="flex items-center gap-2">
            <span>{selectedCountry.flag}</span>
            <span className="font-mono font-semibold">{selectedCountry.code}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {COUNTRIES.map((country) => (
          <SelectItem key={country.code} value={country.code}>
            <div className="flex items-center gap-2">
              <span>{country.flag}</span>
              <span>{country.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
