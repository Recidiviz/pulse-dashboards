// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2020 Recidiviz, Inc.
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

import { useState, useCallback, useEffect } from "react";
import toInteger from "lodash/fp/toInteger";
import { useAuth0 } from "../react-auth0-spa";
import {
  parseResponseByFileFormat,
  parseResponsesByFileFormat,
} from "../api/metrics/fileParser";
import { convertFromStringToUnflattenedMatrix } from "../api/metrics/optimizedFormatHelpers";
import { callMetricsApi, awaitingResults } from "../api/metrics/metricsClient";

/**
 * A hook which fetches the given file at the given API service URL. Returns
 * state which will populate with the response data and a flag indicating whether
 * or not the response is still loading, in the form of `{ apiData, isLoading, unflattenedValues }`.
 *
 * `unflattenValues` is the unflattened value matrix from the apiData and is only
 * populated if the request was for a specific file, if that file was in the optimized
 * format, and if eagerExpand is set to false.
 *
 * `eagerExpand` defaults to true, which means that by default we immediately expand
 * the optimized format into an array of deserialized objects. If set to false, this
 * returns `apiData` in its optimized format, with keys of `flattenedValueMatrix` and
 * `metadata`, and `unflattenedValues` is produced and returned as a convenience to
 * ensure we do not need to proactively and repeatedly unflatten the value matrix
 * on subsequent filter operations.
 */
function useChartData(url, file, eagerExpand = true) {
  const { loading, user, getTokenSilently } = useAuth0();
  const [apiData, setApiData] = useState([]);
  const [unflattenedValues, setUnflattenedValues] = useState([]);
  const [awaitingApi, setAwaitingApi] = useState(true);
  const [isError, setIsError] = useState(false);

  const fetchChartData = useCallback(async () => {
    try {
      if (file) {
        const responseData = await callMetricsApi(
          `${url}/${file}`,
          getTokenSilently
        );

        const metricFile = parseResponseByFileFormat(
          responseData,
          file,
          eagerExpand
        );
        setApiData(metricFile);

        // If we are not eagerly expanding a single file request, then proactively
        // unflatten the data matrix to avoid repeated unflattening operations in
        // filtering operations later on.
        if (!eagerExpand) {
          const totalDataPoints = toInteger(
            metricFile.metadata.total_data_points
          );
          const unflattened =
            totalDataPoints === 0
              ? []
              : convertFromStringToUnflattenedMatrix(
                  metricFile.flattenedValueMatrix,
                  totalDataPoints
                );
          setUnflattenedValues(unflattened);
        }
      } else {
        const responseData = await callMetricsApi(url, getTokenSilently);

        const metricFiles = parseResponsesByFileFormat(
          responseData,
          eagerExpand
        );
        setApiData(metricFiles);
      }
      setAwaitingApi(false);
    } catch (error) {
      setAwaitingApi(false);
      setIsError(true);
      console.error(error);
    }
  }, [eagerExpand, file, getTokenSilently, url]);

  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  const isLoading = awaitingResults(loading, user, awaitingApi);

  return { apiData, isLoading, isError, unflattenedValues };
}

export default useChartData;
