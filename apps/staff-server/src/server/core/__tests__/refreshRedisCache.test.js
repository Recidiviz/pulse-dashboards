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
import * as Sentry from "@sentry/node";

import { getSubsetManifest } from "../../constants/subsetManifest";
import { createSubset, createSubsetFilters } from "../../filters";
import { getCache } from "../cacheManager";
import { refreshRedisCache } from "../refreshRedisCache";

const mockCache = {
  set: vi.fn(),
};

vi.mock("@sentry/node");
vi.mock("../cacheManager");

vi.mock("../../constants/subsetManifest", () => {
  return {
    getSubsetManifest: vi.fn(),
    FILES_WITH_SUBSETS: ["revocations_matrix_distribution_by_district"],
  };
});

vi.mock("../../filters");

beforeEach(() => {
  mockCache.set.mockResolvedValue(true);
  vi.mocked(getCache).mockReturnValue(mockCache);
  vi.mocked(getSubsetManifest).mockImplementation(() => {
    return [
      ["violation_type", [["all"], ["felony"]]],
      ["charge_category", [["all"], ["domestic_violence"], ["sex_offense"]]],
    ];
  });
});

describe("refreshRedisCache", () => {
  let fileName;
  let metricFile;
  let mockFetchValue;
  let metricType;
  const stateCode = "US_DEMO";
  const fileContents = {
    flattenedValueMatrix: "a bunch of numbers",
    metadata: {
      total_data_points: 1,
      dimension_manifest: [],
    },
  };

  beforeEach(() => {
    // do not log the expected error - keep tests less verbose
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    mockFetchValue = vi.fn(() => Promise.resolve(metricFile));
  });

  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  describe("when metricType is newRevocation", () => {
    describe("refreshing the cache for files without subsets", () => {
      beforeEach(() => {
        metricType = "newRevocation";
        fileName = "random_file_name";
        metricFile = { [fileName]: fileContents };
      });

      it("calls the cache with the correct key and value", () =>
        new Promise((done) => {
          const cacheKey = `${stateCode}-${metricType}-${fileName}`;
          refreshRedisCache(
            mockFetchValue,
            stateCode,
            metricType,
            (err, result) => {
              expect(err).toBeNull();
              expect(result).toEqual("OK");

              expect(mockFetchValue).toHaveBeenCalledTimes(1);
              expect(mockCache.set).toHaveBeenCalledTimes(1);
              expect(mockCache.set).toHaveBeenCalledWith(cacheKey, metricFile);
              done();
            },
          );
        }));

      it("returns an error response when caching fails", () =>
        new Promise((done) => {
          const error = new Error("Error setting cache value");
          mockCache.set.mockImplementationOnce(() => {
            throw error;
          });

          refreshRedisCache(mockFetchValue, stateCode, metricType, (err) => {
            expect(mockCache.set).toHaveBeenCalledTimes(1);
            expect(err).toEqual(error);
            expect(Sentry.captureException).toHaveBeenCalledWith(
              "Error occurred while caching files for metricType: newRevocation",
              error,
            );
            done();
          });
        }));
    });

    describe("refreshing the cache for files that have subsets", () => {
      beforeEach(() => {
        fileName = "revocations_matrix_distribution_by_district";
        metricFile = { [fileName]: fileContents };
        createSubset.mockImplementation(() => metricFile);
      });

      it("caches a subset file for each subset combination", () =>
        new Promise((done) => {
          refreshRedisCache(
            mockFetchValue,
            stateCode,
            metricType,
            (err, result) => {
              expect(err).toEqual(null);
              expect(result).toEqual("OK");
              expect(createSubset).toHaveBeenCalledTimes(6);
              [
                { violation_type: 0, charge_category: 0 },
                { violation_type: 0, charge_category: 1 },
                { violation_type: 0, charge_category: 2 },
                { violation_type: 1, charge_category: 0 },
                { violation_type: 1, charge_category: 1 },
                { violation_type: 1, charge_category: 2 },
              ].forEach((subsetCombination, index) => {
                const transformedFilters = createSubsetFilters({
                  filters: subsetCombination,
                });
                expect(createSubset).toHaveBeenNthCalledWith(
                  index + 1,
                  fileName,
                  transformedFilters,
                  metricFile,
                );
              });
              done();
            },
          );
        }));

      it("sets the cache key for each possible subset", () =>
        new Promise((done) => {
          const cacheKeyPrefix = `${stateCode}-${metricType}-${fileName}`;

          refreshRedisCache(
            mockFetchValue,
            stateCode,
            metricType,
            (err, result) => {
              expect(err).toEqual(null);
              expect(result).toEqual("OK");
              expect(mockCache.set).toHaveBeenCalledTimes(6);
              [
                "-charge_category=0-violation_type=0",
                "-charge_category=1-violation_type=0",
                "-charge_category=2-violation_type=0",
                "-charge_category=0-violation_type=1",
                "-charge_category=1-violation_type=1",
                "-charge_category=2-violation_type=1",
              ].forEach((subsetKey, index) => {
                expect(mockCache.set).toHaveBeenNthCalledWith(
                  index + 1,
                  `${cacheKeyPrefix}${subsetKey}`,
                  metricFile,
                );
              });
              done();
            },
          );
        }));

      it("returns an error when caching fails", () =>
        new Promise((done) => {
          const error = new Error("Error setting cache value");
          mockCache.set.mockImplementationOnce(() => {
            throw error;
          });

          refreshRedisCache(mockFetchValue, stateCode, metricType, (err) => {
            expect(mockCache.set).toHaveBeenCalledTimes(1);
            expect(err).toEqual(error);
            expect(err).toEqual(error);
            expect(Sentry.captureException).toHaveBeenCalledWith(
              "Error occurred while caching files for metricType: newRevocation",
              error,
            );
            done();
          });
        }));

      it("returns an error when filtering fails", () =>
        new Promise((done) => {
          const error = new Error("Error setting cache value");
          createSubset.mockReset();
          createSubset.mockImplementationOnce(() => {
            throw error;
          });
          refreshRedisCache(mockFetchValue, stateCode, metricType, (err) => {
            expect(mockCache.set).toHaveBeenCalledTimes(0);
            expect(err).toEqual(error);
            done();
          });
        }));
    });
  });

  describe("when metricType is pathways", () => {
    describe("refreshing the cache for files without subsets", () => {
      beforeEach(() => {
        metricType = "pathways";
        fileName = "random_file_name";
        metricFile = { [fileName]: fileContents };
      });

      it("calls the cache with the correct key and value", () =>
        new Promise((done) => {
          const cacheKey = `${stateCode}-${metricType}-${fileName}`;
          refreshRedisCache(
            mockFetchValue,
            stateCode,
            metricType,
            (err, result) => {
              expect(err).toBeNull();
              expect(result).toEqual("OK");

              expect(mockFetchValue).toHaveBeenCalledTimes(1);
              expect(mockCache.set).toHaveBeenCalledTimes(1);
              expect(mockCache.set).toHaveBeenCalledWith(cacheKey, metricFile);
              done();
            },
          );
        }));

      it("returns an error response when caching fails", () =>
        new Promise((done) => {
          const error = new Error("Error setting cache value");
          mockCache.set.mockImplementationOnce(() => {
            throw error;
          });

          refreshRedisCache(mockFetchValue, stateCode, metricType, (err) => {
            expect(mockCache.set).toHaveBeenCalledTimes(1);
            expect(err).toEqual(error);
            expect(Sentry.captureException).toHaveBeenCalledWith(
              "Error occurred while caching files for metricType: pathways",
              error,
            );
            done();
          });
        }));
    });
  });

  describe("when metricType is not newRevocation or pathways", () => {
    beforeEach(() => {
      metricType = "vitals";
      metricFile = {
        fileName: fileContents,
        secondFileName: fileContents,
      };
    });

    it("calls the cache with the correct key and value", () =>
      new Promise((done) => {
        const cacheKey = `${stateCode}-${metricType}`;
        refreshRedisCache(
          mockFetchValue,
          stateCode,
          metricType,
          (err, result) => {
            expect(err).toBeNull();
            expect(result).toEqual("OK");

            expect(mockFetchValue).toHaveBeenCalledTimes(1);
            expect(mockCache.set).toHaveBeenCalledTimes(1);
            expect(mockCache.set).toHaveBeenCalledWith(cacheKey, metricFile);
            done();
          },
        );
      }));

    it("returns an error response when caching fails", () =>
      new Promise((done) => {
        const error = new Error("Error setting cache value");
        mockCache.set.mockImplementationOnce(() => {
          throw error;
        });

        refreshRedisCache(mockFetchValue, stateCode, metricType, (err) => {
          expect(mockCache.set).toHaveBeenCalledTimes(1);
          expect(err).toEqual(error);
          expect(Sentry.captureException).toHaveBeenCalledWith(
            "Error occurred while caching files for metricType: vitals",
            error,
          );
          done();
        });
      }));
  });
});
