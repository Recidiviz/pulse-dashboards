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

import { DocumentData } from "@google-cloud/firestore";
import { doc, DocumentReference, getDoc } from "firebase/firestore";
import { Mock } from "vitest";

import FirestoreStore from "../../../FirestoreStore";
import RootStore from "../../../RootStore";
import { OpportunityUpdateSubscription } from "../OpportunityUpdateSubscription";
import { UpdateFunction } from "../types";

vi.mock("firebase/firestore");

const docMock = vi.mocked(doc);
const mockRef = vi.fn() as unknown as DocumentReference;
const firestoreStoreMock = new FirestoreStore({
  rootStore: {
    isImpersonating: false,
  } as unknown as typeof RootStore,
});
const getDocMock = getDoc as Mock;

const testUpdateRecord: UpdateFunction<DocumentData> = async (
  rawRecord?: DocumentData,
) => {
  await Promise.resolve();
};

let sub: OpportunityUpdateSubscription<DocumentData>;

beforeEach(() => {
  vi.resetAllMocks();
});

test("dataSource", () => {
  docMock.mockReturnValue(mockRef);
  // simulates the migration already being complete
  getDocMock.mockResolvedValue({ exists: vi.fn().mockReturnValue(true) });

  sub = new OpportunityUpdateSubscription(
    firestoreStoreMock,
    "record123",
    "compliantReporting",
    testUpdateRecord,
  );

  expect(docMock).toHaveBeenLastCalledWith(
    // undefined results from mocking firestore, it would be a Firestore instance
    undefined,
    "clientUpdatesV2",
    "record123",
    "clientOpportunityUpdates",
    "compliantReporting",
  );

  expect(sub.dataSource).toBe(mockRef);
});
