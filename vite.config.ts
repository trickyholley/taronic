import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  // Served at the custom domain's root (taronic.pyxietarot.live/), not as a
  // GitHub Pages project page subpath, so asset URLs need no prefix.
  base: "/",
  server: {
    port: 5190,
  },
});
