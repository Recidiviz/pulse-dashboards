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

import { ImportRoutesHandlerBase } from "~fastify-data-import-plugin/common/classes";

/**
 * MockDataProvider is a singleton class for loading data via the MockImportRoutesHandler.
 *
 * Use the `setData` method to set the data that will be returned by any instance of a MockImportRoutesHandler.
 */
export class MockDataProvider {
  private static _instance: MockDataProvider;
  data: unknown[] = [];

  // Private constructor to prevent non-singleton instantiation
  private constructor() {
    return;
  }

  public static get Instance() {
    return this._instance || (this._instance = new this());
  }

  public setData(data: unknown[]) {
    this.data = data;
  }
}

export const dataProviderSingleton = MockDataProvider.Instance;

export class MockImportRoutesHandler extends ImportRoutesHandlerBase {
  // Always verify the token
  override async verifyGoogleIdToken() {
    return;
  }

  override async getDataFromGCS() {
    return dataProviderSingleton.data;
  }

  // Always schedule the task
  override async scheduleHandleImportCloudTask() {
    return;
  }
}
