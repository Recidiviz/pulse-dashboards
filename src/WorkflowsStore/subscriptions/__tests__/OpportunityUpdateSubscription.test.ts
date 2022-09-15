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
import { DocumentData } from "@google-cloud/firestore";
import { doc, DocumentReference, getDoc } from "firebase/firestore";

import { OpportunityUpdateSubscription } from "../OpportunityUpdateSubscription";

jest.mock("firebase/firestore");

const docMock = doc as jest.MockedFunction<typeof doc>;
const mockRef = (jest.fn() as unknown) as DocumentReference;

const getDocMock = getDoc as jest.Mock;

let sub: OpportunityUpdateSubscription<DocumentData>;

beforeEach(() => {
  jest.resetAllMocks();
});

test("dataSource", () => {
  docMock.mockReturnValue(mockRef);
  // simulates the migration already being complete
  getDocMock.mockResolvedValue({ exists: jest.fn().mockReturnValue(true) });

  sub = new OpportunityUpdateSubscription(
    "record123",
    "client123",
    "compliantReporting"
  );

  expect(docMock).toHaveBeenLastCalledWith(
    // undefined results from mocking firestore, it would be a Firestore instance
    undefined,
    "clientUpdatesV2",
    "record123",
    "clientOpportunityUpdates",
    "compliantReporting"
  );

  expect(sub.dataSource).toBe(mockRef);
});

test("attempts to migrate legacy data", () => {
  // simulates the migration already being complete
  getDocMock.mockResolvedValue({ exists: jest.fn().mockReturnValue(true) });

  sub = new OpportunityUpdateSubscription(
    "record123",
    "client123",
    "compliantReporting"
  );

  expect(getDocMock).toHaveBeenCalledTimes(1);
});
