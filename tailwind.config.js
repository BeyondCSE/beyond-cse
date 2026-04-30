/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        fadeSlide: {
          "0%": {
            opacity: 0,
            transform: "translateY(30px) scale(0.97)",
          },
          "100%": {
            opacity: 1,
            transform: "translateY(0px) scale(1)",
          },
        },

        // ✨ NEW: Shine sweep animation
        shine: {
          "0%": {
            transform: "translateX(-100%)",
          },
          "100%": {
            transform: "translateX(100%)",
          },
        },
      },

      animation: {
        fadeSlide: "fadeSlide 0.6s ease-out",

        // ✨ NEW: Shine animation
        shine: "shine 3s linear infinite",
      },
    },
  },
  plugins: [],
};