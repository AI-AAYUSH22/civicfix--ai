/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // CivicFix Core Theme Tokens
        civic: {
          green: '#0F766E',       // Primary Civic Green
          'green-dark': '#115E59', // Deep Teal
          teal: '#0F766E',
          'deep-teal': '#115E59',
          navy: '#172033',        // Navy
          'soft-navy': '#334155', // Soft Navy
          bg: '#F8FAFC',          // Background
          surface: '#FFFFFF',     // Surface
          'surface-muted': '#F1F5F9', // Surface Muted
          border: '#E2E8F0',      // Border
        },
        primary: {
          DEFAULT: '#0F766E',
          hover: '#115E59',
          light: '#E6F4F1',
          50: '#F0FDFA',
          100: '#CCFBF1',
          500: '#0F766E',
          600: '#115E59',
          700: '#134E4A',
        },
        navy: {
          DEFAULT: '#172033',     // Navy (Headings/Structure)
          soft: '#334155',        // Soft Navy
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#334155',
          700: '#1E293B',
          800: '#172033',
          900: '#0F172A',
        },
        surface: {
          DEFAULT: '#FFFFFF',     // Surface
          muted: '#F1F5F9',       // Surface Muted
        },
        border: {
          DEFAULT: '#E2E8F0',     // Border
          civic: '#E2E8F0',
        },
        background: {
          DEFAULT: '#F8FAFC',     // Background
          civic: '#F8FAFC',
        },
        status: {
          success: '#16A34A',     // Success / Verified
          warning: '#D97706',     // Warning / Needs Review
          danger: '#DC2626',      // Danger / Rejected
          info: '#2563EB',        // Info / Active
        },
        civicText: {
          primary: '#172033',     // Text Primary
          secondary: '#64748B',   // Text Secondary
          muted: '#94A3B8',       // Text Muted
        },
        // Existing compatibility tokens
        base: {
          bg: '#F8FAFC',
          surface: '#FFFFFF',
          border: '#E2E8F0',
        },
        teal: {
          DEFAULT: '#0F766E',
          50: '#F0FDFA',
          100: '#CCFBF1',
          500: '#0F766E',
          600: '#115E59',
        },
        amber: {
          DEFAULT: '#D97706',
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#D97706',
          600: '#B45309',
        },
        crit: {
          DEFAULT: '#DC2626',
          50: '#FEF2F2',
          100: '#FEE2E2',
          500: '#DC2626',
          600: '#B91C1C',
        },
        success: {
          DEFAULT: '#16A34A',
          50: '#F0FDF4',
          100: '#DCFCE7',
          500: '#16A34A',
          600: '#15803D',
        },
      },
      borderRadius: {
        'civic-sm': '8px',
        'civic-md': '12px',
        'civic-lg': '16px',
        'civic-modal': '20px',
        lg: '8px',
        xl: '12px',
        '2xl': '16px',
      },
      fontFamily: {
        sans: ['Inter', 'Manrope', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'Space Grotesk', 'sans-serif'],
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgba(23, 32, 51, 0.05), 0 1px 2px -1px rgba(23, 32, 51, 0.05)',
        lift: '0 4px 6px -1px rgba(23, 32, 51, 0.08), 0 2px 4px -2px rgba(23, 32, 51, 0.06)',
        card: '0 10px 15px -3px rgba(23, 32, 51, 0.05), 0 4px 6px -4px rgba(23, 32, 51, 0.05)',
        modal: '0 20px 25px -5px rgba(23, 32, 51, 0.1), 0 8px 10px -6px rgba(23, 32, 51, 0.1)',
      },
    },
  },
  plugins: [],
};
