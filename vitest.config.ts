import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["__tests__/**/*.test.ts"],
    // The full-model integration test downloads the ONNX weights on first run;
    // give it room. Pure recognizer/premask tests are fast and offline.
    testTimeout: 120_000,
  },
});
