import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        poppins: ['var(--font-poppins)', 'system-ui', 'sans-serif'],
        inter: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        lato: ['var(--font-lato)', 'system-ui', 'sans-serif'],
        raleway: ['var(--font-raleway)', 'system-ui', 'sans-serif'],
        nunito: ['var(--font-nunito)', 'system-ui', 'sans-serif'],
        manrope: ['var(--font-manrope)', 'system-ui', 'sans-serif'],
        dmSans: ['var(--font-dmSans)', 'system-ui', 'sans-serif'],
        arial: ['Arial', 'system-ui', 'sans-serif'],
        helvetica: ['Helvetica', 'system-ui', 'sans-serif'],
        georgia: ['Georgia', 'system-ui', 'serif'],
        timesNewRoman: ['Times New Roman', 'system-ui', 'serif'],
        playfairDisplay: ['var(--font-playfairDisplay)', 'system-ui', 'serif'],
        cormorantGaramond: ['var(--font-cormorantGaramond)', 'system-ui', 'serif'],
        cinzel: ['var(--font-cinzel)', 'system-ui', 'serif'],
        tenorSans: ['system-ui', 'serif'],
      },
      animation: {
        scale: 'scale 0.6s ease-in-out infinite',
      },
      keyframes: {
        scale: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.15)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
