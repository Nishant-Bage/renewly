import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vitest/config";
import adapter from "@sveltejs/adapter-static";
export default defineConfig({
  plugins: [sveltekit({ adapter: adapter() })],
  test: { include: ["src/**/*.test.ts"] },
});
