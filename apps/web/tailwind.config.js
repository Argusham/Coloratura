/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#07955F",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#2A2C34",
          foreground: "#FFFFFF",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Neo-brutalist color palette
        brutal: {
          cream: "#FFF8E7",
          yellow: "#FFEB3B",
          pink: "#FF6B9D",
          blue: "#4CC9F0",
          green: "#06FFA5",
          orange: "#FF6B35",
          purple: "#7209B7",
          black: "#0A0A0A",
          white: "#FFFFFF",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        brutal: "0px",
      },
      boxShadow: {
        brutal: "6px 6px 0px 0px #0A0A0A",
        "brutal-sm": "4px 4px 0px 0px #0A0A0A",
        "brutal-lg": "8px 8px 0px 0px #0A0A0A",
        "brutal-xl": "12px 12px 0px 0px #0A0A0A",
        "brutal-color-pink": "6px 6px 0px 0px #FF6B9D",
        "brutal-color-blue": "6px 6px 0px 0px #4CC9F0",
        "brutal-color-green": "6px 6px 0px 0px #06FFA5",
        "brutal-color-yellow": "6px 6px 0px 0px #FFEB3B",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-2deg)" },
          "50%": { transform: "rotate(2deg)" },
        },
        slide: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        bounce: {
          "0%, 100%": { transform: "translateY(-5%)", animationTimingFunction: "cubic-bezier(0.8, 0, 1, 1)" },
          "50%": { transform: "translateY(0)", animationTimingFunction: "cubic-bezier(0, 0, 0.2, 1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        wiggle: "wiggle 0.5s ease-in-out infinite",
        slide: "slide 2s linear infinite",
        "bounce-slow": "bounce 2s infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

module.exports = config;
