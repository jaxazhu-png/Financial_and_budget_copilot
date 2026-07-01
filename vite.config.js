import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { execFileSync } from "node:child_process";
import path from "node:path";

const presentationWorkbook = path.resolve("config/MOMAH_Demo_Presentation_Data.xlsx");

function presentationConfigPlugin() {
  return {
    name: "momah-presentation-config",
    configureServer(server) {
      server.watcher.add(presentationWorkbook);
      server.watcher.on("change", (file) => {
        if (path.resolve(file) !== presentationWorkbook) return;
        try {
          execFileSync(process.execPath, ["scripts/compile-presentation-config.mjs"], {
            cwd: process.cwd(),
            stdio: "inherit",
          });
          server.ws.send({ type: "full-reload" });
        } catch (error) {
          server.config.logger.error("Excel 配置校验失败，页面继续使用上一个有效版本。");
        }
      });
    },
  };
}

// Riyadh / Arabia Standard Time (UTC+3)
const BUILD = new Date().toLocaleString("en-CA", { timeZone: "Asia/Riyadh",
  year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })
  .replace(", ", " ") + " AST";

export default defineConfig({
  plugins: [react(), presentationConfigPlugin()],
  base: "/",
  define: { BUILD_STAMP: JSON.stringify(BUILD) },
  build: { outDir: "dist" },
});
