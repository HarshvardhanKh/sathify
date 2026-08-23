import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev server proxies API/WS calls to the FastAPI backend so the avatar app
// can be developed with `npm run dev` (port 5173) while the backend runs on
// 8000, exactly like the original simple-frontend spec's dev flow.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // bind all interfaces (IPv4 + IPv6) — Node's default "localhost" bind was IPv6-only here
    port: 5174,
    proxy: {
      "/api": "http://127.0.0.1:8000",
      "/ws": {
        target: "ws://127.0.0.1:8000",
        ws: true,
      },
    },
  },
});
