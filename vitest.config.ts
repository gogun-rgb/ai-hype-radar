import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/tests/setup.ts"],
    include: ["src/tests/**/*.test.ts", "src/tests/**/*.test.tsx"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "lcov"],
      reportsDirectory: "coverage",
      include: ["src/lib/**/*.{ts,tsx}", "src/config/**/*.ts"],
      exclude: [
        "src/lib/openai/schema.ts",
        "src/lib/github/demo.ts",
        "src/lib/storage/repository.ts",
        "src/lib/supabase/client.ts",
        "src/**/*.d.ts"
      ],
      thresholds: {
        statements: 70,
        lines: 70,
        functions: 65,
        branches: 60
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    }
  }
});
