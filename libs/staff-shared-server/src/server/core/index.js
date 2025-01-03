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

/**
 * Utilities for retrieving and caching metrics for the app.
 *
 * In the current implementation, metrics are generated by the Recidiviz data platform and stored
 * in two separate formats as metric files in Google Cloud Storage: an optimized format as compressed
 * txt files that represent compact versions of sparse matrices, and a more readable format via
 * JSON Lines. Those files are pulled down and cached in memory with a TTL. That TTL is unaffected by
 * access to the cache, so files are re-fetched at a predictable cadence, allowing for updates to
 * those files to be quickly reflected in the app without frequent requests to GCS.
 */

export { cacheResponse } from "./cacheManager";
export { fetchAndFilterNewRevocationFile } from "./fetchAndFilterNewRevocationFile";
export { fetchMetrics } from "./fetchMetrics";
export { fetchMetricsFromGCS } from "./fetchMetricsFromGCS";
export { fetchMetricsFromLocal } from "./fetchMetricsFromLocal";
export { fetchOfflineUser } from "./fetchOfflineUser";
export { refreshRedisCache } from "./refreshRedisCache";
