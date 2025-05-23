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

import fs from "fs";
import path from "path";

import { getMetricsByType } from "../../collections/getMetricsByType";
import { fetchMetricsFromLocal } from "../fetchMetricsFromLocal";

vi.mock("../../collections/getMetricsByType");

vi.mock("fs");

describe("fetchMetricsFromLocal tests", () => {
  const stateCode = "US_DEMO";
  const metricType = "newRevocation";
  const file = "revocations_matrix_events_by_month";

  const promiseResValue = "resolved value";
  const metadata = "some metadata";

  it("JSON should return with empty metadata object", async () => {
    const returnedFile = "revocations_matrix_events_by_month.json";
    const returnedFileExtension = ".json";
    const mockReturnedFiles = [returnedFile];
    getMetricsByType.mockImplementationOnce(() => {
      return {
        getFileNamesList: vi.fn().mockReturnValue(mockReturnedFiles),
      };
    });

    vi.spyOn(path, "resolve");
    const readFileSpy = vi.spyOn(fs, "readFile");
    const readFileSyncSpy = vi.spyOn(fs, "readFileSync");
    readFileSpy.mockImplementation((_, callback) =>
      callback(null, promiseResValue),
    );
    readFileSyncSpy.mockReturnValue(JSON.stringify(metadata));

    const fetchPromises = fetchMetricsFromLocal(stateCode, metricType, file);
    const results = await Promise.all(fetchPromises);

    results.forEach((result) => {
      expect(result).toStrictEqual({
        contents: promiseResValue,
        fileKey: file,
        metadata: {},
        extension: returnedFileExtension,
      });
    });
  });

  it("txt should return array with metadata", async () => {
    const returnedFile = "revocations_matrix_events_by_month.txt";
    const returnedFileExtension = ".txt";
    const mockReturnedFiles = [returnedFile];
    getMetricsByType.mockImplementationOnce(() => {
      return {
        getFileNamesList: vi.fn().mockReturnValue(mockReturnedFiles),
      };
    });

    vi.spyOn(path, "resolve");
    const readFileSpy = vi.spyOn(fs, "readFile");
    const readFileSyncSpy = vi.spyOn(fs, "readFileSync");
    readFileSpy.mockImplementation((_, callback) =>
      callback(null, promiseResValue),
    );
    readFileSyncSpy.mockReturnValue(JSON.stringify(metadata));

    const fetchPromises = fetchMetricsFromLocal(stateCode, metricType, file);
    const results = await Promise.all(fetchPromises);

    results.forEach((result) => {
      expect(result).toStrictEqual({
        contents: promiseResValue,
        fileKey: file,
        metadata,
        extension: returnedFileExtension,
      });
    });
  });

  describe("when there's an error", () => {
    it("errors getting files return an array with rejected promises", async () => {
      const error = new Error("some error");
      getMetricsByType.mockImplementationOnce(() => {
        return {
          getFileNamesList: () => {
            throw error;
          },
        };
      });

      const fetchPromises = Promise.all(
        fetchMetricsFromLocal(stateCode, metricType, file),
      );

      await expect(fetchPromises).rejects.toEqual(error);

      expect.assertions(1);
    });

    it("errors parsing files return an array with rejected promises", async () => {
      const error = new Error("read file sync error");
      const readFileSyncSpy = vi.spyOn(fs, "readFileSync");
      const returnedFile = "revocations_matrix_events_by_month.txt";
      const mockReturnedFiles = [returnedFile];

      getMetricsByType.mockImplementationOnce(() => {
        return {
          getFileNamesList: vi.fn().mockReturnValue(mockReturnedFiles),
        };
      });
      readFileSyncSpy.mockImplementationOnce(() => {
        throw error;
      });

      const fetchPromises = Promise.all(
        fetchMetricsFromLocal(stateCode, metricType, file),
      );

      await expect(fetchPromises).rejects.toEqual(error);

      expect.assertions(1);
    });
  });
});
