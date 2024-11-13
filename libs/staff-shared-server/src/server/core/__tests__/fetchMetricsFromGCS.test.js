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

import { getMetricsByType } from "../../collections/getMetricsByType";
import { fetchMetricsFromGCS } from "../fetchMetricsFromGCS";
import { downloadFile, downloadFileMetadata } from "../objectStorage";

vi.mock("../../collections/getMetricsByType");

vi.mock("../objectStorage");

describe("fetchMetricsFromGCS tests", () => {
  const stateCode = "US_MO";
  const metricType = "newRevocation";
  const file = "revocations_matrix_events_by_month";

  const returnedFile = "revocations_matrix_events_by_month.json";
  const returnedFileKey = "revocations_matrix_events_by_month";
  const returnedFileExtension = ".json";
  const fileUpdatedAt = "Fri, 31 Oct 2020 00:39:20 GMT";
  const mockReturnedFiles = [returnedFile];
  const downloadFileResponse = "resolved value";
  const valueKeys = "some value keys";
  const totalDataPoints = "some total data points";
  const dimensionManifest = "some dimension manifest";
  const downloadFileMetadataResponse = [
    {
      updated: fileUpdatedAt,
      metadata: {
        value_keys: JSON.stringify(valueKeys),
        total_data_points: totalDataPoints,
        dimension_manifest: JSON.stringify(dimensionManifest),
      },
    },
  ];

  it("returns data and metadata when both are provided in the downloaded file", async () => {
    getMetricsByType.mockImplementation(() => {
      return {
        getFileNamesList: vi.fn().mockReturnValue(mockReturnedFiles),
        validateDimensionsForFile: () => true,
      };
    });
    vi.mocked(downloadFile).mockResolvedValue(downloadFileResponse);
    vi.mocked(downloadFileMetadata).mockResolvedValue(
      downloadFileMetadataResponse,
    );

    const fetchPromises = Promise.all(
      fetchMetricsFromGCS(stateCode, metricType, file),
    );

    await expect(fetchPromises).resolves.toStrictEqual([
      {
        contents: downloadFileResponse,
        fileKey: returnedFileKey,
        extension: returnedFileExtension,
        metadata: {
          updated: "Fri, 31 Oct 2020 00:39:20 GMT",
          value_keys: valueKeys,
          total_data_points: totalDataPoints,
          dimension_manifest: dimensionManifest,
        },
      },
    ]);

    expect(downloadFile).toHaveBeenCalledTimes(1);
    expect(downloadFileMetadata).toHaveBeenCalledTimes(1);
    expect.assertions(3);
  });

  it("returns data and an empty object when metadata is provided in the downloaded file", async () => {
    getMetricsByType.mockImplementation(() => {
      return {
        getFileNamesList: vi.fn().mockReturnValue(mockReturnedFiles),
        validateDimensionsForFile: () => true,
      };
    });

    vi.mocked(downloadFile).mockResolvedValue(downloadFileResponse);
    vi.mocked(downloadFileMetadata).mockResolvedValue([]);

    const fetchPromises = Promise.all(
      fetchMetricsFromGCS(stateCode, metricType, file),
    );

    await expect(fetchPromises).resolves.toStrictEqual([
      {
        contents: downloadFileResponse,
        fileKey: returnedFileKey,
        extension: returnedFileExtension,
        metadata: {},
      },
    ]);

    expect.assertions(1);
  });

  describe("when there's an error", () => {
    it("returns a rejected promise when there's an error getting file names", async () => {
      const error = new Error("getFileNamesList error");
      getMetricsByType.mockImplementationOnce(() => {
        return {
          getFileNamesList: () => {
            throw error;
          },
        };
      });

      const fetchPromises = Promise.all(
        fetchMetricsFromGCS(stateCode, metricType, file),
      );

      await expect(fetchPromises).rejects.toEqual(error);

      expect.assertions(1);
    });

    it("returns a rejected promise when there's an error downloading files", async () => {
      const error = new Error("downloadFile error");

      getMetricsByType.mockImplementationOnce(() => {
        return {
          getFileNamesList: vi.fn().mockReturnValue(mockReturnedFiles),
        };
      });
      vi.mocked(downloadFile).mockImplementationOnce(() => {
        throw error;
      });

      const fetchPromises = Promise.all(
        fetchMetricsFromGCS(stateCode, metricType, file),
      );

      await expect(fetchPromises).rejects.toEqual(error);

      expect.assertions(1);
    });

    it("returns a rejected promise when there's an error validating dimensions", async () => {
      const error = new Error("Error validating dimensions!");
      vi.mocked(downloadFile).mockResolvedValue(downloadFileResponse);
      vi.mocked(downloadFileMetadata).mockResolvedValue([]);
      getMetricsByType.mockImplementationOnce(() => {
        return {
          getFileNamesList: vi.fn().mockReturnValue(mockReturnedFiles),
          validateDimensionsForFile: () => {
            throw error;
          },
        };
      });

      const fetchPromises = Promise.all(
        fetchMetricsFromGCS(stateCode, metricType, file),
      );

      await expect(fetchPromises).rejects.toEqual(error);

      expect.assertions(1);
    });
  });
});
