module.exports = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui']
      },
      colors: {
        accent: {
          500: '#3b82f6',
          600: '#2563eb',
        }
      }
    }
  },
  plugins: []
}
