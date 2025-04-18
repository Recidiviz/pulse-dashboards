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

import {
  FILES_WITH_SUBSETS,
  getSubsetManifest,
} from "../constants/subsetManifest";
import { createSubset, createSubsetFilters } from "../filters";
import {
  getCacheKeyForSubsetCombination,
  getSubsetCombinations,
} from "../utils/cacheKeys";
import { getCache } from "./cacheManager";

function cacheEachSubsetFile(
  cache,
  cacheKey,
  fileKey,
  metricFile,
  subsetCombinations,
) {
  const cachePromises = [];
  subsetCombinations.forEach((subsetCombination) => {
    const subsetCacheKey = `${cacheKey}-${getCacheKeyForSubsetCombination(
      subsetCombination,
    )}`;
    const subsetFilters = createSubsetFilters({
      filters: subsetCombination,
      metricName: fileKey,
    });
    const subsetFile = createSubset(fileKey, subsetFilters, metricFile);

    console.log(`Setting subset cache for: ${subsetCacheKey}...`);

    cachePromises.push(cache.set(subsetCacheKey, subsetFile));
  });
  return cachePromises;
}

function cacheFiles({ files, metricType, cacheKeyPrefix }) {
  const cache = getCache(cacheKeyPrefix);
  const cachePromises = [];
  const subsetCombinations = getSubsetCombinations(getSubsetManifest());

  if (metricType === "newRevocation" || metricType === "pathways") {
    Object.keys(files).forEach((fileKey) => {
      const cacheKey = `${cacheKeyPrefix}-${fileKey}`;
      const metricFile = { [fileKey]: files[fileKey] };

      if (FILES_WITH_SUBSETS.includes(fileKey)) {
        const subsetCachePromises = cacheEachSubsetFile(
          cache,
          cacheKey,
          fileKey,
          metricFile,
          subsetCombinations,
        );
        cachePromises.push(...subsetCachePromises);
      } else {
        console.log(`Setting cache for: ${cacheKey}...`);
        cachePromises.push(cache.set(cacheKey, metricFile));
      }
    });
  } else {
    cachePromises.push(cache.set(cacheKeyPrefix, files));
  }

  console.log(
    `Waiting for ${cachePromises.length} cache promises to resolve for ${cacheKeyPrefix}...`,
  );
  return cachePromises;
}

/**
 * Refresh all of the datasets returned from the provided fetch function in the redis cache.
 * The cache key for each dataset follows the pattern: stateCode-metricType-fileName.
 *
 * The callback should be a function with a signature of `function (error, results)`. When one of the
 * set cache promises fail, they all fail and an error is sent to the server response.
 *
 */
export function refreshRedisCache(
  fetchMetrics,
  stateCode,
  metricType,
  callback,
) {
  const cacheKeyPrefix = `${stateCode.toUpperCase()}-${metricType}`;
  console.log(`Handling call to refresh cache for ${cacheKeyPrefix}...`);

  let responseError = null;
  let cachePromises = [];

  return fetchMetrics()
    .then((files) => {
      cachePromises = cacheFiles({
        files,
        stateCode,
        metricType,
        cacheKeyPrefix,
      });
      return Promise.all(cachePromises);
    })
    .catch((error) => {
      const message = `Error occurred while caching files for metricType: ${metricType}`;
      responseError = error;
      Sentry.captureException(message, responseError);
    })
    .finally(() => {
      console.log(
        `Finally responding to request and finished resolving ${cachePromises.length} cache promises.`,
      );
      callback(responseError, "OK");
    });
}
