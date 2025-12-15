/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#E11D48", // Rose-600 (Romantic & Premium)
        secondary: "#475569", // Slate-600
        dark: "#0F172A", // Slate-900
        light: "#F8FAFC", // Slate-50
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        serif: ["Merriweather", "serif"],
      },
      backgroundImage: {
        'dream-gradient': "linear-gradient(120deg, #a18cd1 0%, #fbc2eb 100%)",
      },
    },
  },
  plugins: [],
}
