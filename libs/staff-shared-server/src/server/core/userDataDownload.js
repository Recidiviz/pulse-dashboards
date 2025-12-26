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

import * as objectStorage from "./objectStorage";

const userDataDownloadBucketName = process.env.USER_DATA_DOWNLOAD_BUCKET;

export async function downloadUserData(stateCode, fileName) {
  try {
    const downloadResponse = await objectStorage.downloadFile(
      userDataDownloadBucketName,
      stateCode,
      fileName,
    );

    // Need to index 0 into downloadResponse to get the contents of the file
    // https://googleapis.dev/nodejs/storage/latest/global.html#DownloadResponse
    return downloadResponse[0];
  } catch (error) {
    console.error(`${stateCode} - ${fileName}`, error);
    return Promise.reject(error);
  }
}
