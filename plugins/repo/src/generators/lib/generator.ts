// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// =============================================================================

import {
  formatFiles,
  generateFiles,
  readProjectConfiguration,
  Tree,
  updateJson,
  updateProjectConfiguration,
  visitNotIgnoredFiles,
} from "@nx/devkit";
import { Linter } from "@nx/eslint";
import { libraryGenerator as jsLibraryGenerator } from "@nx/js";
import { libraryGenerator as reactLibraryGenerator } from "@nx/react";
import { assertNever } from "assert-never";
import { join } from "path";

import { LibGeneratorSchema } from "./schema";

export async function libGenerator(tree: Tree, options: LibGeneratorSchema) {
  // constants used in steps
  const PROJECT_ROOT = `libs/${options.name}`;

  // steps to execute. should be one-liners if possible
  await createLibrary();
  extendProjectConfig();
  updateTsconfig();
  updateEslintConfig();
  updateViteConfig();
  makeFilesFromTemplates();
  addLicenseHeaders();
  await formatFiles(tree);

  // ========================================
  // step functions below this line
  // ========================================
  async function createLibrary() {
    const delegatedOptions = {
      name: options.name,
      bundler: "none",
      unitTestRunner: "vitest",
      directory: PROJECT_ROOT,
      linter: Linter.EsLint,
      importPath: `~${options.name}`,
      projectNameAndRootFormat: "as-provided",
      strict: true,
    } as const;

    switch (options.libType) {
      case "vanilla":
        await jsLibraryGenerator(tree, {
          ...delegatedOptions,
          testEnvironment: "jsdom",
        });
        // we can't stop it from creating this directory but we do not want it
        tree.delete(`${PROJECT_ROOT}/src/lib`);
        break;
      case "react":
        await reactLibraryGenerator(tree, {
          ...delegatedOptions,
          style: "styled-components",
          component: false,
        });
        break;
      default:
        return assertNever(options.libType);
    }

    tree.write(
      `${PROJECT_ROOT}/src/index.ts`,
      "// export public library API here",
    );
  }

  function extendProjectConfig() {
    updateProjectConfiguration(tree, options.name, {
      ...readProjectConfiguration(tree, options.name),
      targets: {
        // unlike the Nx default lint command, this will accept a list of files,
        // e.g. from lint-staged
        "lint-files": {
          executor: "nx:run-commands",
          options: {
            command: "eslint",
            cwd: "{projectRoot}",
          },
        },
        typecheck: {
          executor: "nx:run-commands",
          options: {
            commands: [
              "tsc -p ./tsconfig.lib.json",
              "tsc -p ./tsconfig.spec.json",
            ],
            cwd: "{projectRoot}",
          },
        },
        // unlike the default test command, this implements default Vitest behavior
        // (defaults to watch in dev mode and run in CI mode)
        test: {
          executor: "nx:run-commands",
          outputs: [`{workspaceRoot}/coverage/${PROJECT_ROOT}`],
          cache: true,
          options: {
            command: "vitest",
            cwd: "{projectRoot}",
          },
        },
      },
    });
  }

  function updateTsconfig() {
    updateJson(tree, `${PROJECT_ROOT}/tsconfig.json`, (config) => {
      // we have added common options to base tsconfig; no overrides by default ...
      delete config.compilerOptions;
      if (options.libType === "react") {
        // ... except for react libraries
        config.compilerOptions = { jsx: "react-jsx" };
      }
      return config;
    });

    updateJson(tree, `${PROJECT_ROOT}/tsconfig.lib.json`, (config) => {
      config.compilerOptions.types.push("vite/client");

      return config;
    });
  }

  function updateEslintConfig() {
    if (options.libType === "react") {
      updateJson(tree, `${PROJECT_ROOT}/.eslintrc.json`, (config) => {
        // these settings together let the linter recognize components wrapped in Mobx observers
        // and require they be named functions (which is helpful for debugging)
        config.rules = { "react/display-name": ["error"] };
        config.settings = { componentWrapperFunctions: ["observer"] };

        return config;
      });
    }
  }

  function updateViteConfig() {
    const configPath = `${PROJECT_ROOT}/vite.config.ts`;
    let configSource = tree.read(configPath)?.toString();

    if (!configSource) {
      throw new Error(`Unable to read Vitest config file at ${configPath}`);
    }

    // this vitest option is now deprecated
    configSource = configSource.replace(/^\s*cache: .*$/m, "");

    // add some additional options we don't get by default
    configSource = configSource.replace(
      /test: {$/m,
      `test: {
        mockReset: true,
        unstubEnvs: true,
        globalSetup: ["src/setupTestsGlobal.ts"],
        setupFiles: ["src/setupTests.ts"],`,
    );

    // react requires a babel plugin
    if (options.libType === "react") {
      configSource = configSource.replace(
        /react\(\)/,
        `react({ babel: { plugins: ["babel-plugin-macros"] } })`,
      );
    }

    // renaming to mts clears warnings while sourcetype is not set to "module" in package.json
    tree.delete(configPath);
    tree.write(`${PROJECT_ROOT}/vite.config.mts`, configSource);

    // these are generated from ./files
    const testSetupFiles = ["src/setupTests.ts", "src/setupTestsGlobal.ts"];

    updateJson(tree, `${PROJECT_ROOT}/tsconfig.lib.json`, (config) => {
      config.exclude.push("vite.config.mts", ...testSetupFiles);
      return config;
    });

    updateJson(tree, `${PROJECT_ROOT}/tsconfig.spec.json`, (config) => {
      config.include.push("vite.config.mts", ...testSetupFiles);
      return config;
    });
  }

  function makeFilesFromTemplates() {
    generateFiles(tree, join(__dirname, "./files"), PROJECT_ROOT, {
      isReact: options.libType === "react",
    });
  }

  function addLicenseHeaders() {
    const headerComment = `// Recidiviz - a data platform for criminal justice reform
// Copyright (C) ${new Date().getFullYear()} Recidiviz, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// =============================================================================

`;
    const fileMatcher = /\.(?!(m.*x))m?(j|t)sx?$/;
    visitNotIgnoredFiles(tree, PROJECT_ROOT, (filepath) => {
      if (fileMatcher.test(filepath)) {
        const contents = tree.read(filepath)?.toString();
        if (typeof contents !== "string") {
          throw new Error(`Unable to read file at ${filepath}`);
        }
        tree.write(filepath, `${headerComment}${contents}`);
      }
    });
  }
}

export default libGenerator;
