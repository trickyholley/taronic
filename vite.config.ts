import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  // Served as a GitHub Pages project page (trickyholley.github.io/taronic/), not
  // from a domain root, so every built asset URL needs this prefix.
  base: "/taronic/",
  server: {
    port: 5190,
  },
});
