/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#ff6b6b", 
        secondary: "#feca57",
        dark: "#2d3436",
        "dream-pink": "#ff9a9e",
        "dream-purple": "#a18cd1",
        "dream-gold": "#fbc2eb",
        "glass": "rgba(255, 255, 255, 0.25)",
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['"Inter"', 'sans-serif'],
      },
      backgroundImage: {
        'dream-gradient': "linear-gradient(120deg, #a18cd1 0%, #fbc2eb 100%)",
      },
    },
  },
  plugins: [],
}
