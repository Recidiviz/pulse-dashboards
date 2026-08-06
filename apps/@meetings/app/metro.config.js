// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

const path = require("path");
const { getSentryExpoConfig } = require("@sentry/react-native/metro");
const { mergeConfig } = require("metro-config");
const { withNativeWind } = require("nativewind/metro");
const {
  wrapWithReanimatedMetroConfig,
} = require("react-native-reanimated/metro-config");
const { createMatchPath, loadConfig } = require("tsconfig-paths");

const defaultConfig = getSentryExpoConfig(__dirname);
const { assetExts, sourceExts } = defaultConfig.resolver;

const monorepoRoot = path.resolve(__dirname, "../../..");
const tsConfig = loadConfig(__dirname);
// tsconfig.base.json no longer sets `baseUrl` (TS7 forbids it), so tsconfig-paths
// defaults absoluteBaseUrl to this app's directory. The `paths` values are
// repo-root-relative (e.g. "./libs/...", "./apps/@meetings/app/src/*"), so match
// them against the monorepo root or every `~` alias resolves to nothing.
const matchPath =
  tsConfig.resultType === "success"
    ? createMatchPath(monorepoRoot, tsConfig.paths)
    : null;

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const customConfig = {
  cacheVersion: "@meetings/app",
  watchFolders: [...defaultConfig.watchFolders, monorepoRoot],
  transformer: {
    babelTransformerPath: require.resolve("react-native-svg-transformer"),
  },
  resolver: {
    assetExts: assetExts.filter((ext) => ext !== "svg"),
    sourceExts: [...sourceExts, "svg"],
    // Fixes 'import.meta' errors on web (for example for zustand lib) by enabling proper ESM resolution for browser
    // https://github.com/expo/expo/issues/30323
    unstable_conditionNames: ["browser", "require", "react-native"],
    resolveRequest: (context, moduleName, platform) => {
      if (matchPath) {
        // tsconfig-paths doesn't understand platform-suffixed files (e.g. a
        // module that only exists as foo.web.ts / foo.native.ts with no plain
        // foo.ts), so offer it the current platform's suffixes first — ordered
        // so it never returns another platform's file. matchPath resolves the
        // `~` alias to a real base path; Metro then re-resolves it for the
        // actual platform.
        const suffixes = platform === "web" ? ["web"] : [platform, "native"];
        const exts = [];
        for (const base of [".ts", ".tsx", ".js", ".jsx"]) {
          for (const suffix of suffixes) {
            if (suffix) exts.push(`.${suffix}${base}`);
          }
          exts.push(base);
        }
        const resolved = matchPath(moduleName, undefined, undefined, exts);
        if (resolved) {
          return context.resolveRequest(context, resolved, platform);
        }
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = wrapWithReanimatedMetroConfig(
  withNativeWind(mergeConfig(defaultConfig, customConfig), {
    input: "./global.css",
  }),
);
