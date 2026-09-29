import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
    plugins: [react(), tailwindcss()],
    build: { assetsInlineLimit: 0 },
    server: { proxy: { '/api': { target: process.env.API_PROXY_TARGET ?? 'http://127.0.0.1:4000', changeOrigin: true } } },
    resolve: {
        alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
});
