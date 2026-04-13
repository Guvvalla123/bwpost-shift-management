/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        bwpost: {
          sidebar: "#0f2042",
          navy: "#1B3F8B",
          accent: "#2563EB",
          light: "#93C5FD",
          tint: "#EFF6FF",
          border: "#e2e8f0",
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
