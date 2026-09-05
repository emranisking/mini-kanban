import type { Config } from 'tailwindcss';

/**
 * Design tokens for the Mini Kanban UI — a dark, Fluent-inspired
 * surface language: acrylic/mica-style translucent panels, an
 * elevation-based shadow scale (not one flat drop-shadow everywhere),
 * a vibrant indigo -> cyan accent spent deliberately (primary actions,
 * focus rings, the active drag state), and Segoe UI as the system
 * typeface so it renders as genuinely native-Fluent on Windows.
 */
const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#0B0B10',
        surface: {
          DEFAULT: '#15151C',
          raised: '#1B1B24',
          overlay: '#20202B',
        },
        border: {
          subtle: 'rgba(255,255,255,0.08)',
          strong: 'rgba(255,255,255,0.16)',
        },
        ink: {
          primary: '#F2F2F5',
          secondary: '#A7A7B4',
          tertiary: '#6E6E7C',
        },
        accent: {
          from: '#6D5EF5',
          to: '#33C2E0',
          DEFAULT: '#6D5EF5',
          soft: 'rgba(109,94,245,0.16)',
        },
        column: {
          blue: '#5B8DEF',
          amber: '#F5A623',
          violet: '#A66DF5',
          green: '#34D399',
          rose: '#F5678C',
          teal: '#2DD4BF',
        },
        danger: '#F5697B',
        success: '#34D399',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI Variable"',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
      },
      boxShadow: {
        'depth-2': '0 1px 2px rgba(0,0,0,0.36)',
        'depth-4': '0 2px 6px rgba(0,0,0,0.38)',
        'depth-8': '0 4px 12px rgba(0,0,0,0.40)',
        'depth-16': '0 10px 24px rgba(0,0,0,0.44)',
        'depth-28': '0 20px 44px rgba(0,0,0,0.50)',
      },
      backgroundImage: {
        'accent-gradient': 'linear-gradient(135deg, #6D5EF5 0%, #33C2E0 100%)',
        'canvas-glow':
          'radial-gradient(60% 50% at 15% 0%, rgba(109,94,245,0.16) 0%, rgba(11,11,16,0) 60%), radial-gradient(50% 40% at 100% 10%, rgba(51,194,224,0.10) 0%, rgba(11,11,16,0) 60%)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'rise-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 160ms ease-out',
        'rise-in': 'rise-in 200ms cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
