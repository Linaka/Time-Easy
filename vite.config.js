import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { createSharedWorkspacePlugin } from "./server/sharedWorkspacePlugin.js";

export default defineConfig({
  plugins: [
    react(),
    createSharedWorkspacePlugin()
  ]
});
