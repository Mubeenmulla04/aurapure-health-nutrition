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
        admin: {
          bg: '#F8FAFC',
          card: '#FFFFFF',
          sidebar: '#0F172A',
          border: '#E2E8F0',
          dark: '#0F172A',
          muted: '#64748B',
          primary: '#4F46E5', // Professional Indigo SaaS Accent
          'primary-hover': '#4338CA',
          accent: '#2563EB',
          emerald: '#10B981',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
        },
      },
      fontFamily: {
        sans: [
          'Plus Jakarta Sans',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
} satisfies Config;
