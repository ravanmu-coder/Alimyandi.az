/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'heading': ['Poppins', 'sans-serif'],
        'body': ['Inter', 'sans-serif'],
      },
      colors: {
        // Exact colors from design images
        'dark': {
          'bg-primary': '#111827',      // Main background from images
          'bg-secondary': '#1F2937',    // Sidebar background
          'bg-tertiary': '#374151',     // Card/modal backgrounds
          'bg-quaternary': '#4B5563',   // Hover states
          'text-primary': '#FFFFFF',    // Headings
          'text-secondary': '#D1D5DB',  // Body text
          'text-muted': '#9CA3AF',      // Muted text
          'border': '#374151',          // Borders
          'border-light': '#4B5563',    // Light borders
        },
        // Accent colors from design
        'accent': {
          'primary': '#10B981',         // Green/teal accent
          'secondary': '#14B8A6',       // Alternative teal
          'success': '#10B981',         // Success states
          'warning': '#F59E0B',         // Warning states
          'error': '#EF4444',           // Error states
          'info': '#3B82F6',            // Info states
        },
        // Legacy brand colors for compatibility
        brand: {
          blue: '#10B981',
          purple: '#14B8A6',
          'blue-light': '#34D399',
          'purple-light': '#5EEAD4',
          'blue-dark': '#059669',
          'purple-dark': '#0F766E',
        },
        card: {
          bg: '#374151',
          'bg-light': '#4B5563',
          'bg-dark': '#1F2937',
        },
        muted: {
          text: '#9CA3AF',
          'text-light': '#D1D5DB',
          'text-dark': '#6B7280',
        },
      },
      fontSize: {
        'h1': ['2.25rem', { lineHeight: '2.75rem', fontWeight: '700' }],
        'h2': ['1.875rem', { lineHeight: '2.25rem', fontWeight: '600' }],
        'h3': ['1.5rem', { lineHeight: '2rem', fontWeight: '600' }],
        'h4': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        'body-lg': ['1.125rem', { lineHeight: '1.75rem', fontWeight: '400' }],
        'body-md': ['1rem', { lineHeight: '1.5rem', fontWeight: '400' }],
        'body-sm': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '400' }],
        'body-xs': ['0.75rem', { lineHeight: '1rem', fontWeight: '400' }],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #10B981 0%, #14B8A6 100%)',
        'brand-gradient-hover': 'linear-gradient(135deg, #059669 0%, #0F766E 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(55, 65, 81, 0.95) 0%, rgba(75, 85, 99, 0.9) 100%)',
        'dark-gradient': 'linear-gradient(135deg, #111827 0%, #1F2937 100%)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      boxShadow: {
        'dark': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'dark-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'dark-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'slide-down': 'slideDown 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
