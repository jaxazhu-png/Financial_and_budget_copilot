import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Riyadh / Arabia Standard Time (UTC+3)
const BUILD = new Date().toLocaleString("en-CA", { timeZone: "Asia/Riyadh",
  year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })
  .replace(", ", " ") + " AST";

export default defineConfig({
  plugins: [react()],
  base: "/",
  define: { BUILD_STAMP: JSON.stringify(BUILD) },
  build: { outDir: "dist" },
});
