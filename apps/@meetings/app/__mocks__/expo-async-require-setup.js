// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

// No-op stand-in for expo/src/async-require/setup and
// expo/src/async-require/messageSocket.
//
// `setup` is imported by expo/src/winter/runtime.ts and `messageSocket` also
// directly by expo/src/Expo.fx.tsx (whenever `globalThis.expo` is defined,
// which jest-expo's preset polyfills). Both are dev-server-only blocks guarded
// by `__DEV__`, which is true under Jest. They wire up Fast Refresh, the Metro
// HMR client, and the dev-tools message socket, none of which exist in a unit
// test run. As of SDK 55 both throw during setup:
//
//   * setupHMR calls `HMRClient.setup({ isEnabled: true })`, the web-only
//     object form. hmr.ts only accepts it when `process.env.EXPO_OS === "web"`.
//     EXPO_OS is inlined by babel from jest-expo's `caller.platform`, which
//     this app's jest.config.ts drops because it overrides `transform` to point
//     at ./.babelrc.js. So EXPO_OS is undefined, hmr.ts takes the native
//     branch, and asserts on a `platform` argument that is never passed.
//   * messageSocket opens a WebSocket to the dev server; getDevServer()
//     returns no URL under Jest, so it throws on `null.match`.
//
// Stubbing the module is the correct behavior for tests rather than a
// workaround: there is no Metro dev server to connect to.
module.exports = {};
