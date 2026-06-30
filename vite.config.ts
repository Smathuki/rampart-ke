import { defineConfig } from "vite";

// The demo lives in demo/ and imports the library straight from src/.
export default defineConfig({
  root: "demo",
  build: { outDir: "../dist-demo", emptyOutDir: true },
  // transformers.js pulls in onnxruntime-web (wasm); let Vite serve it as-is
  // rather than trying to pre-bundle the wasm/worker assets.
  optimizeDeps: { exclude: ["@huggingface/transformers"] },
});
