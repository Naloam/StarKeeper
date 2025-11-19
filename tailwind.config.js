/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Natural paper-texture color system
        primary: {
          DEFAULT: '#7A8B7F', // 橄榄灰 - 自然主色
          50: '#F5F7F6',
          100: '#E8EBE9',
          200: '#D1D7D3',
          300: '#BAC3BD',
          400: '#A3AFA7',
          500: '#7A8B7F',
          600: '#627066',
          700: '#49544D',
          800: '#313833',
          900: '#181C1A',
        },
        surface: {
          DEFAULT: '#FAF9F7', // 浅米色纸张
          darker: '#F5F3F0', // 稍深米色
          card: '#FEFDFB', // 卡片纸张白
        },
        text: {
          primary: '#2B2B2B', // 柔和黑
          secondary: '#6B6B6B', // 柔灰
          tertiary: '#9B9B9B', // 淡灰
          muted: '#B8B8B8', // 极淡灰
        },
        border: {
          DEFAULT: '#E8E6E3', // 纸张边缘
          light: '#F0EEEB',
          dark: '#D6D4D1',
        },
        // Natural accent colors
        accent: {
          sand: '#D4C5B3', // 沙色
          olive: '#A8B5A0', // 橄榄
          smoke: '#B8C5D0', // 烟蓝
          wheat: '#E8D8C0', // 浅卡其
          stone: '#C8BFBA', // 石灰
        },
        // Semantic colors (natural, low saturation)
        success: {
          DEFAULT: '#6B8E6F', // 自然绿
          light: '#E8F0E9',
          text: '#4A6B4D',
        },
        warning: {
          DEFAULT: '#C9A66B', // 自然黄
          light: '#F7F0E6',
          text: '#8B7447',
        },
        danger: {
          DEFAULT: '#B87A7A', // 柔和红
          light: '#F5EDED',
          text: '#8B5656',
        },
        info: {
          DEFAULT: '#7A8B9F', // 烟蓝
          light: '#E9EDF1',
          text: '#5A6B7F',
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

