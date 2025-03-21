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

import { ImportHandlerBase } from "~data-import-plugin/common/classes";

/**
 * MockDataProvider is a singleton class for loading data via the MockImportHandler.
 *
 * Use the `setData` method to set the data that will be returned by any instance of a MockImportHandler.
 */
export class MockDataProvider {
  // eslint-disable-next-line no-use-before-define -- only using it as a type here
  private static _instance: MockDataProvider;
  data: {
    [key: string]: unknown[];
  } = {};

  // Private constructor to prevent non-singleton instantiation
  private constructor() {
    return;
  }

  public static get Instance() {
    return this._instance || (this._instance = new this());
  }

  /**
   * Sets the data that will be returned by the MockImportHandler for the provided file.
   */
  public setData(file: string, data: unknown[]) {
    this.data[file] = data;
  }
}

export const dataProviderSingleton = MockDataProvider.Instance;

export class MockImportHandler<T, M> extends ImportHandlerBase<T, M> {
  override async *getDataFromGCS(_bucket: string, file: string) {
    for (const datum of dataProviderSingleton.data[file]) {
      yield datum;
    }
  }
}
