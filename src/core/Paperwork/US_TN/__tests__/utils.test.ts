// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import { IDisposer } from "mobx-utils";

import { trackSetOpportunityStatus } from "../../../../analytics";
import { subscribeToClientUpdates } from "../../../../firestore";
import { eligibleClient } from "../../../../PracticesStore/__fixtures__";
import { Client } from "../../../../PracticesStore/Client";
import { RootStore } from "../../../../RootStore";
import { updateFieldData } from "../utils";

let testObserver: IDisposer;

jest.mock("../../../../analytics");
jest.mock("../../../../firestore");

const mockSubscribeToClientUpdates = subscribeToClientUpdates as jest.MockedFunction<
  typeof subscribeToClientUpdates
>;

let client: Client;
let rootStore: RootStore;

beforeEach(() => {
  rootStore = new RootStore();
  client = new Client(eligibleClient, rootStore);
});

afterEach(() => {
  jest.resetAllMocks();

  // clean up any Mobx observers to avoid leaks
  if (testObserver) {
    testObserver();
  }
});

test("track start of progress on pending review", async () => {
  mockSubscribeToClientUpdates.mockImplementation((clientId, handler) => {
    expect(clientId).toBe(client.id);
    handler({});
    return jest.fn();
  });

  await updateFieldData("testUser", client, { clientFirstName: "Testabc" });

  expect(trackSetOpportunityStatus).toHaveBeenCalledWith({
    clientId: client.pseudonymizedId,
    status: "IN_PROGRESS",
  });
});

test("form updates should not track status change if it's already set", async () => {
  mockSubscribeToClientUpdates.mockImplementation((clientId, handler) => {
    expect(clientId).toBe(client.id);
    handler({ compliantReporting: {} });
    return jest.fn();
  });

  await updateFieldData("testUser", client, { clientFirstName: "Testabc" });

  expect(trackSetOpportunityStatus).toHaveBeenCalledTimes(0);
  expect(trackSetOpportunityStatus).not.toHaveBeenCalledWith({
    clientId: client.pseudonymizedId,
    status: "IN_PROGRESS",
  });
});