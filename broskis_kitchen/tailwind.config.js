/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  safelist: [
    'bg-[#0B0B0B]',
    'bg-[#111214]',
    'text-white',
    'text-[#F5F6F7]'
  ],
  theme: {
    extend: {
      colors: {
        // New color system
        "matte-black": "var(--color-matte-black)",
        "gold-foil": "var(--color-gold-foil)",
        "blood-red": "var(--color-blood-red)",
        "emerald-green": "var(--color-emerald-green)",
        "royal-purple": "var(--color-royal-purple)",
        "citrus-orange": "var(--color-citrus-orange)",
        "ai-blue": "var(--color-ai-blue)",
        "harvest-gold": "var(--color-harvest-gold)",

        // Legacy colors for compatibility
        primary: "var(--primary)",
        secondary: "var(--secondary)",
        surface: "var(--surface)",
        background: "var(--background)",
        text: "var(--text)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "gold-red-gradient": "linear-gradient(to right, var(--color-gold-foil), var(--color-blood-red))",
      },
      animation: {
        "fade-in": "fadeIn 0.8s forwards",
        shimmer: "shimmer 1.5s infinite",
        soundbar: "soundbar 1s ease-in-out infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        soundbar: {
          "0%, 100%": { height: "0.5rem" },
          "50%": { height: "1.5rem" },
        },
      },
      boxShadow: {
        gold: "0 0 10px rgba(212, 175, 55, 0.5)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
