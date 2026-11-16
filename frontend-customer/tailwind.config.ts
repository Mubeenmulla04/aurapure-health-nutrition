import type { Config } from 'tailwindcss';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  content: [
    path.resolve(__dirname, 'index.html').replace(/\\/g, '/'),
    path.resolve(__dirname, 'src/**/*.{js,ts,jsx,tsx}').replace(/\\/g, '/'),
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#FAF9F5',         // Oat Silk luxury light background
          surface: '#FFFFFF',    // Pure White Card surface
          secondary: '#F4EFEA',  // Warm Sand neutral
          muted: '#EAE6E1',      // Subtle Border & Separator
          dark: '#1C1C1E',       // Apple-grade Deep Charcoal Text
          subtext: '#5C5C60',    // Muted Charcoal body text
          primary: '#1B4332',    // Deep Forest Emerald accent
          'primary-hover': '#143326',
          sage: '#2D6A4F',       // Fresh Sage Green
          glow: '#D8F3DC',       // Gentle Herbal Glow
          gold: '#C89D42',       // Clean Botanical Gold/Ochre
          'gold-light': '#FBF6EB',
          error: '#E63946',
          success: '#2A9D8F',
        },
      },
      fontFamily: {
        sans: [
          'Plus Jakarta Sans',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        serif: [
          'Playfair Display',
          'Cormorant Garamond',
          'Georgia',
          'serif',
        ],
      },
      boxShadow: {
        subtle: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
        card: '0 4px 20px -2px rgba(27, 67, 50, 0.05), 0 2px 6px -1px rgba(0,0,0,0.03)',
        floating: '0 12px 32px -4px rgba(27, 67, 50, 0.08), 0 4px 12px -2px rgba(0,0,0,0.04)',
      },
      screens: {
        xs: '400px',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
} satisfies Config;
