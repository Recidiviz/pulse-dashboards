/// <reference types='vitest' />
import { nxViteTsPaths } from "@nx/vite/plugins/nx-tsconfig-paths.plugin";
import { defineConfig } from "vite";

export default defineConfig({
  root: __dirname,
  cacheDir: "../../node_modules/.vite/apps/sentencing-server",

  plugins: [nxViteTsPaths()],

  test: {
    // TODO(https://github.com/Recidiviz/recidiviz-data/issues/30276): Renable once we have a way to run tests in the CI.
    // setupFiles: ["src/test/setup/index.ts"],
    globals: true,
    cache: { dir: "../../node_modules/.vitest" },
    environment: "node",
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    reporters: ["default"],
    coverage: {
      reportsDirectory: "../../coverage/apps/sentencing-server",
      provider: "v8",
    },
  },
});
