// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import { disableFetchMocks, enableFetchMocks } from "jest-fetch-mock";

import { RootStore } from "../../RootStore";
import { OutliersAPIClient } from "../api/OutliersAPIClient";
import { OutliersConfigFixture } from "../models/offlineFixtures/OutliersConfigFixture";
import { supervisionOfficerSupervisorsFixture } from "../models/offlineFixtures/SupervisionOfficerSupervisor";
import { OutliersStore } from "../OutliersStore";

const mockTenantId = "us_tn";
const BASE_URL = `http://localhost:5000/outliers/${mockTenantId}`;
const OLD_ENV = process.env;

describe("OutliersAPIClient", () => {
  let client: OutliersAPIClient;

  beforeAll(() => {
    enableFetchMocks();
    process.env = Object.assign(process.env, {
      REACT_APP_DEPLOY_ENV: "dev",
      REACT_APP_NEW_BACKEND_API_URL: "http://localhost:5000",
    });
    // @ts-ignore
    const mockRootStore = {
      getTokenSilently: jest.fn(),
      currentTenantId: mockTenantId,
    } as RootStore;
    client = new OutliersAPIClient(new OutliersStore(mockRootStore));
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  afterAll(() => {
    process.env = OLD_ENV;
    disableFetchMocks();
  });

  it("init calls the correct endpoint", async () => {
    fetchMock.mockResponse(JSON.stringify({ config: OutliersConfigFixture }));
    await client.init();
    expect(fetchMock.mock.calls[0][0]).toEqual(
      encodeURI(`${BASE_URL}/configuration`)
    );
  });

  it("init parses the config data", async () => {
    fetchMock.mockResponse(JSON.stringify({ config: OutliersConfigFixture }));
    const response = await client.init();
    expect(response).toMatchSnapshot();
  });

  it("supervisionOfficerSupervisors calls the correct endpoint", async () => {
    fetchMock.mockResponse(JSON.stringify({ supervisors: [] }));
    await client.supervisionOfficerSupervisors();
    expect(fetchMock.mock.calls[0][0]).toEqual(
      encodeURI(`${BASE_URL}/supervisors`)
    );
  });

  it("supervisionOfficerSupervisors parses the data", async () => {
    fetchMock.mockResponse(
      JSON.stringify({ supervisors: supervisionOfficerSupervisorsFixture })
    );
    const response = await client.supervisionOfficerSupervisors();
    expect(response).toMatchSnapshot();
  });

  it("supervisionOfficerSupervisors throws error if tenantId is undefined", async () => {
    // @ts-ignore
    const mockRootStore = {
      getTokenSilently: jest.fn(),
      currentTenantId: undefined,
    } as RootStore;
    const badClient = new OutliersAPIClient(new OutliersStore(mockRootStore));
    expect(() => badClient.supervisionOfficerSupervisors()).toThrow(
      "Attempted to fetch data with undefined tenantId"
    );
  });
});
