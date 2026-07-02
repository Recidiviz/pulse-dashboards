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

import { Storage } from "@google-cloud/storage";

import { downloadFile, downloadFileMetadata } from "../objectStorage";

vi.mock("@google-cloud/storage", () => ({
  Storage: vi.fn(),
}));

describe("objectStorage tests", () => {
  const bucketName = "some name";
  const stateCode = "some code";
  const fileName = "some file name";
  const returnValue = "some value, no matter if Promise or no";
  const getMetadata = vi.fn();
  const download = vi.fn();
  const file = vi.fn();
  const bucket = vi.fn();

  beforeEach(() => {
    getMetadata.mockReturnValue(returnValue);
    download.mockReturnValue(returnValue);
    file.mockReturnValue({ download, getMetadata });
    bucket.mockReturnValue({ file });
    Storage.mockReturnValue({ bucket });
  });

  it("should call chain of methods to download file", () => {
    expect(downloadFile(bucketName, stateCode, fileName)).toEqual(returnValue);
    expect(Storage).toHaveBeenCalledTimes(1);
    expect(bucket).toHaveBeenCalledWith(bucketName);
    expect(file).toHaveBeenCalledWith(`${stateCode}/${fileName}`);
    expect(download).toHaveBeenCalledTimes(1);
  });

  it("should call chain of methods to get file metadata", () => {
    expect(downloadFileMetadata(bucketName, stateCode, fileName)).toEqual(
      returnValue,
    );
    expect(Storage).toHaveBeenCalledTimes(1);
    expect(bucket).toHaveBeenCalledWith(bucketName);
    expect(file).toHaveBeenCalledWith(`${stateCode}/${fileName}`);
    expect(getMetadata).toHaveBeenCalledTimes(1);
  });
});
