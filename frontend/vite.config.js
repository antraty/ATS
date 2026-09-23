import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Configuration Vite standard, avec un port fixe pour le dev serveur.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
