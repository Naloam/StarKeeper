/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Natural paper-texture color system
        primary: {
          DEFAULT: 'var(--color-primary)', // 橄榄灰 - 自然主色
          50: 'var(--color-primary-50)',
          100: 'var(--color-primary-100)',
          200: 'var(--color-primary-200)',
          300: 'var(--color-primary-300)',
          400: 'var(--color-primary-400)',
          500: 'var(--color-primary-500)',
          600: 'var(--color-primary-600)',
          700: 'var(--color-primary-700)',
          800: 'var(--color-primary-800)',
          900: 'var(--color-primary-900)',
        },
        surface: {
          DEFAULT: 'var(--color-surface)', // 浅米色纸张
          darker: 'var(--color-surface-darker)', // 稍深米色
          card: 'var(--color-surface-card)', // 卡片纸张白
        },
        text: {
          primary: 'var(--color-text-primary)', // 柔和黑
          secondary: 'var(--color-text-secondary)', // 柔灰
          tertiary: 'var(--color-text-tertiary)', // 淡灰
          muted: 'var(--color-text-muted)', // 极淡灰
        },
        border: {
          DEFAULT: 'var(--color-border)', // 纸张边缘
          light: 'var(--color-border-light)',
          dark: 'var(--color-border-dark)',
        },
        // Natural accent colors
        accent: {
          sand: 'var(--color-accent-sand)', // 沙色
          olive: 'var(--color-accent-olive)', // 橄榄
          smoke: 'var(--color-accent-smoke)', // 烟蓝
          wheat: 'var(--color-accent-wheat)', // 浅卡其
          stone: 'var(--color-accent-stone)', // 石灰
        },
        // Semantic colors (natural, low saturation)
        success: {
          DEFAULT: 'var(--color-success)', // 自然绿
          light: 'var(--color-success-light)',
          text: 'var(--color-success-text)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)', // 自然黄
          light: 'var(--color-warning-light)',
          text: 'var(--color-warning-text)',
        },
        danger: {
          DEFAULT: 'var(--color-danger)', // 柔和红
          light: 'var(--color-danger-light)',
          text: 'var(--color-danger-text)',
        },
        info: {
          DEFAULT: 'var(--color-info)', // 烟蓝
          light: 'var(--color-info-light)',
          text: 'var(--color-info-text)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      fontSize: {
        // Desktop typography scale
        'display-1': ['4rem', { lineHeight: '1.05', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-2': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.01em', fontWeight: '700' }],
        'h1': ['2.25rem', { lineHeight: '1.2', letterSpacing: '0', fontWeight: '600' }],
        'h2': ['1.5rem', { lineHeight: '1.3', letterSpacing: '0', fontWeight: '600' }],
        'h3': ['1.25rem', { lineHeight: '1.4', letterSpacing: '0', fontWeight: '600' }],
        'h4': ['1rem', { lineHeight: '1.4', letterSpacing: '0', fontWeight: '600' }],
        'body': ['1rem', { lineHeight: '1.6', letterSpacing: '0', fontWeight: '400' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5', letterSpacing: '0', fontWeight: '400' }],
        'caption': ['0.75rem', { lineHeight: '1.4', letterSpacing: '0', fontWeight: '400' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.03), 0 1px 2px rgba(0, 0, 0, 0.04)', // 纸张浮起感
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.06), 0 2px 6px rgba(0, 0, 0, 0.04)', // 轻柔提升
        'subtle': '0 1px 3px rgba(0, 0, 0, 0.02)',
        'paper': '0 4px 12px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.03)', // 纸张层叠
        'soft': '0 2px 16px rgba(0, 0, 0, 0.05)', // 柔软投影
      },
      animation: {
        'fade-in': 'fadeIn 0.18s ease-out',
        'slide-up': 'slideUp 0.15s ease-out',
        'scale-in': 'scaleIn 0.12s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(4px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.98)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      transitionDuration: {
        '120': '120ms',
        '180': '180ms',
      },
      borderRadius: {
        'soft': '16px', // 柔软圆角
        'gentle': '20px', // 温柔圆角
        'paper': '8px', // 纸张边缘
      },
      backgroundImage: {
        'paper-texture': "url('data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.03' /%3E%3C/svg%3E')",
      },
    },
  },
  plugins: [],
}

