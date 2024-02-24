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
import { doc, DocumentReference, getDoc } from "firebase/firestore";
import tk from "timekeeper";

import FirestoreStore, { MilestonesMessage } from "../../../FirestoreStore";
import RootStore from "../../../RootStore";
import { MilestonesMessageUpdateSubscription } from "../MilestonesMessageUpdateSubscription";

jest.mock("firebase/firestore");

const docMock = doc as jest.MockedFunction<typeof doc>;
const mockRef = jest.fn() as unknown as DocumentReference;
const firestoreStoreMock = new FirestoreStore({
  rootStore: {
    isImpersonating: false,
  } as unknown as typeof RootStore,
});
const getDocMock = getDoc as jest.Mock;

let sub: MilestonesMessageUpdateSubscription<MilestonesMessage>;

beforeEach(() => {
  jest.resetAllMocks();
  tk.freeze(new Date("2022-01-01"));
});

afterAll(() => {
  tk.reset();
});

test("dataSource", () => {
  docMock.mockReturnValue(mockRef);
  // simulates the migration already being complete
  getDocMock.mockResolvedValue({ exists: jest.fn().mockReturnValue(true) });

  sub = new MilestonesMessageUpdateSubscription(
    firestoreStoreMock,
    "record123"
  );

  expect(docMock).toHaveBeenLastCalledWith(
    // undefined results from mocking firestore, it would be a Firestore instance
    undefined,
    "clientUpdatesV2",
    "record123",
    "milestonesMessages",
    "milestones_01_2022"
  );

  expect(sub.dataSource).toBe(mockRef);
});
