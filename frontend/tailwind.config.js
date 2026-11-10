/** Brand tokens for NARANG TEXTILE. Change colours and fonts here only. */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  corePlugins: { preflight: false }, // Ant Design ships its own reset; base styles live in styles/global.css
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#142B3B', light: '#1F4258', dark: '#0C1B26' },
        secondary: '#F8F6F1',
        accent: { DEFAULT: '#B89A65', dark: '#8F7647', light: '#D9C6A0' },
        ink: '#252525',
        line: '#E4DFD3',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
      },
      screens: { xs: '360px', sm: '390px', md: '768px', lg: '1024px', xl: '1440px', '2xl': '1920px' },
      boxShadow: {
        card: '0 1px 2px rgba(20,43,59,.06), 0 8px 24px -12px rgba(20,43,59,.18)',
        lift: '0 2px 4px rgba(20,43,59,.08), 0 18px 36px -16px rgba(20,43,59,.28)',
      },
      borderRadius: { fabric: '2px' },
    },
  },
};
