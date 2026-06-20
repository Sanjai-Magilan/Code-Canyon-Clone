import { defineConfig } from 'vite';

export default defineConfig({
  // Set relative base path so resources are loaded relatively
  base: './',
  build: {
    // Inline all assets as base64 data URLs if they are under 5MB.
    // This allows the build to run directly on the file:// protocol (e.g. double clicking index.html)
    // without encountering browser Same-Origin Policy (CORS) errors.
    assetsInlineLimit: 5000000,
  },
});
