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

import { computed, when } from "mobx";
import { IDisposer, keepAlive } from "mobx-utils";

import { subscribeToClientUpdates } from "../../firestore";
import { mockClients, mockClientUpdate } from "../__fixtures__";
import { Client } from "../Client";

let testObserver: IDisposer;

jest.mock("../../firestore");

const mockSubscribeToClientUpdates = subscribeToClientUpdates as jest.MockedFunction<
  typeof subscribeToClientUpdates
>;

afterEach(() => {
  jest.resetAllMocks();

  // clean up any Mobx observers to avoid leaks
  if (testObserver) {
    testObserver();
  }
});

test("fetch client updates on demand", async () => {
  mockSubscribeToClientUpdates.mockImplementation(
    (stateCode, clientId, handler) => {
      expect(stateCode).toBe(client.stateCode);
      expect(clientId).toBe(client.id);
      handler([mockClientUpdate]);
      return jest.fn();
    }
  );

  const client = new Client(mockClients[0]);

  // simulate a client profile page observing updates
  testObserver = keepAlive(computed(() => [client.updates]));

  expect(mockSubscribeToClientUpdates).toHaveBeenCalled();

  await when(() => client.updates !== undefined);
});
