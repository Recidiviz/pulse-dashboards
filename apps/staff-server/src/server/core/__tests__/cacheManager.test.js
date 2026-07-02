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

describe("cacheManager", () => {
  describe("getCache", () => {
    let getCacheTest;
    describe("in demo mode", () => {
      beforeEach(async () => {
        vi.stubEnv("IS_OFFLINE", "true");
        vi.stubEnv("NODE_ENV", "development");

        const { getCache } = await import("../cacheManager");
        getCacheTest = getCache;
      });

      it("returns a memory cache with 'none' store", () => {
        const cache = getCacheTest();
        expect(cache.store.name).toEqual("none");
      });
    });

    describe("in test env", () => {
      beforeEach(async () => {
        vi.stubEnv("IS_OFFLINE", "false");
        vi.stubEnv("NODE_ENV", "test");

        vi.resetModules();
        const { getCache } = await import("../cacheManager");
        getCacheTest = getCache;
      });

      it("returns a memory cache", () => {
        const cache = getCacheTest();
        expect(cache.store.name).toEqual("memory");
      });
    });

    describe("all other requests", () => {
      beforeEach(async () => {
        vi.stubEnv("IS_OFFLINE", "false");
        vi.stubEnv("NODE_ENV", "development");

        vi.resetModules();
        const { getCache } = await import("../cacheManager");

        getCacheTest = getCache;
      });

      afterEach(async () => {
        await getCacheTest().store.getClient().quit();
      });

      it("returns a redis cache", () => {
        const cache = getCacheTest();
        expect(cache.store.name).toEqual("redis");
      });
    });
  });
});
