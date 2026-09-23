/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        theme: {
          primary: 'var(--theme-primary, #ef4444)',
          glow: 'var(--theme-glow, rgba(239, 68, 68, 0.4))',
          bgStart: 'var(--theme-bg-start, #0f0f13)',
          bgEnd: 'var(--theme-bg-end, #050507)',
          surface: 'rgba(255, 255, 255, 0.06)',
          surfaceHover: 'rgba(255, 255, 255, 0.12)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
