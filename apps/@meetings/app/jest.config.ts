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

process.env.TZ = "Etc/GMT+5";

module.exports = {
  displayName: "@meetings/app",
  resolver: require.resolve("./jest.resolver.js"),
  preset: "jest-expo",
  moduleFileExtensions: ["ts", "js", "html", "tsx", "jsx"],
  testMatch: [
    "<rootDir>/src/**/*.test.ts",
    "<rootDir>/src/**/*.test.tsx",
    "<rootDir>/src/**/*.spec.ts",
    "<rootDir>/src/**/*.spec.tsx",
  ],
  setupFilesAfterEnv: ["<rootDir>/src/tests/setup/test-setup.ts"],
  moduleNameMapper: {
    "\\.svg$": "@nx/expo/plugins/jest/svg-mock",
    // Fixes https://stackoverflow.com/questions/57749271/fbbatchedbridgeconfig-is-not-set-when-running-jest-tests
    "^react-native$": require.resolve("react-native"),
    "^~@meetings/app/(.*)$": "<rootDir>/src/$1",
    "@react-native-community/netinfo":
      "@react-native-community/netinfo/jest/netinfo-mock.js",
    "^@paralleldrive/cuid2$": "<rootDir>/src/__mocks__/@paralleldrive/cuid2.js",
  },
  transformIgnorePatterns: [
    "node_modules/(?!(jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/|@expo-google-fonts/|react-navigation|@react-navigation/|@unimodules/|unimodules|sentry-expo|native-base|react-native-svg|@rneui/|@paralleldrive/cuid2)",
  ],
  transform: {
    "\\.[jt]sx?$": [
      "babel-jest",
      {
        configFile: __dirname + "/.babelrc.js",
      },
    ],
    "^.+\\.(bmp|gif|jpg|jpeg|mp4|png|psd|svg|webp|ttf|otf|m4v|mov|mp4|mpeg|mpg|webm|aac|aiff|caf|m4a|mp3|wav|html|pdf|obj)$":
      require.resolve("jest-expo/src/preset/assetFileTransformer.js"),
  },
  coverageDirectory: "../../../coverage/apps/@meetings/app",
  testTimeout: 10000,
};
