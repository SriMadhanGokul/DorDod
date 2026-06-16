import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
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
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        heading: ["Poppins", "system-ui", "sans-serif"],
      },
      fontSize: {
        xs: ["12px", { lineHeight: "16px", letterSpacing: "0.4px" }],
        sm: ["13px", { lineHeight: "20px", letterSpacing: "0.3px" }],
        base: ["14px", { lineHeight: "22px", letterSpacing: "0.2px" }],
        lg: ["16px", { lineHeight: "24px", letterSpacing: "0.2px" }],
        xl: ["18px", { lineHeight: "28px", letterSpacing: "0.1px" }],
        "2xl": ["20px", { lineHeight: "32px" }],
        "3xl": ["24px", { lineHeight: "36px" }],
        "4xl": ["32px", { lineHeight: "40px" }],
      },
      colors: {
        // Primary Blue Theme (Premium SaaS)
        primary: {
          DEFAULT: "#4f46e5", // ✅ Base color for @apply bg-primary
          50: "#f0f4ff",
          100: "#e0e9ff",
          200: "#c7d5ff",
          300: "#a4b9ff",
          400: "#7a8fff",
          500: "#5a67d8",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          foreground: "#ffffff",
        },
        // Neutral grays for modern look
        background: {
          DEFAULT: "#ffffff",
          alt: "#f9fafb",
          secondary: "#f3f4f6",
        },
        foreground: {
          DEFAULT: "#111827",
          muted: "#6b7280",
        },
        border: "#e5e7eb",
        input: "#f3f4f6",
        ring: "#5a67d8",
        // Secondary Color (Yellow/Gold)
        secondary: {
          DEFAULT: "#fbbf24", // Gold 400
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
          foreground: "#111827",
        },
        // Semantic colors
        success: "#10b981",
        warning: "#f59e0b",
        error: "#ef4444",
        info: "#3b82f6",
        // Card styling
        card: {
          DEFAULT: "#ffffff",
          foreground: "#111827",
        },
        muted: {
          DEFAULT: "#f3f4f6",
          foreground: "#6b7280",
        },
        accent: "#5a67d8",
      },
      borderRadius: {
        xs: "6px",
        sm: "8px",
        md: "10px",
        lg: "12px",
        xl: "14px",
        "2xl": "16px",
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
        "2xl": "32px",
        "3xl": "48px",
        "4xl": "64px",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        sm: "0 1px 3px 0 rgb(0 0 0 / 0.08)",
        md: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
        lg: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
        xl: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
        elevation: "0 8px 16px -2px rgb(0 0 0 / 0.08)",
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
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          from: { opacity: "0", transform: "translateX(-8px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
      },
      transitionDuration: {
        fast: "150ms",
        normal: "200ms",
        slow: "300ms",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
