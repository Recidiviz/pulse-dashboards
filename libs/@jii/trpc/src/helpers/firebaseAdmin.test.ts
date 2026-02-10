// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { getFirestore } from "firebase-admin/firestore";

import { getFirestoreCollectionQuerier } from "./firebaseAdmin";

vi.mock("firebase-admin");
vi.mock("firebase-admin/firestore");

const mockWhere = { where: vi.fn() };
const mockCollection = { collection: vi.fn() };

beforeEach(() => {
  vi.stubEnv("DATA_SOURCE_FIREBASE_CREDENTIAL", "{}");
  // @ts-expect-error stub
  vi.mocked(getFirestore).mockReturnValue(mockCollection);
  mockCollection.collection.mockReturnValue(mockWhere);
});

test("restrict firestore queries to state", () => {
  const querier = getFirestoreCollectionQuerier("US_XX", false);
  querier("residents");
  expect(mockCollection.collection).toHaveBeenCalledWith("residents");
  expect(mockWhere.where).toHaveBeenCalledWith("stateCode", "==", "US_XX");
});

test("restrict firestore queries to state demo", () => {
  const querier = getFirestoreCollectionQuerier("US_XX", true);
  querier("residents");
  expect(mockCollection.collection).toHaveBeenCalledWith("DEMO_residents");
  expect(mockWhere.where).toHaveBeenCalledWith("stateCode", "==", "US_XX");
});
