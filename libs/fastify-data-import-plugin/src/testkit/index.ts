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
