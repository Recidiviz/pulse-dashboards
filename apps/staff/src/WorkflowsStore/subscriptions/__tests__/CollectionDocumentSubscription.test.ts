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
import { doc, DocumentReference } from "firebase/firestore";

import FirestoreStore from "../../../FirestoreStore";
import { RootStore } from "../../../RootStore";
import { CollectionDocumentSubscription } from "../CollectionDocumentSubscription";

vi.mock("firebase/firestore");

const firestoreStoreMock = new FirestoreStore({
  rootStore: vi.fn() as unknown as RootStore,
});
const docMock = vi.mocked(doc);
const mockRef = vi.fn() as unknown as DocumentReference;

let sub: CollectionDocumentSubscription<DocumentData>;

beforeEach(() => {
  docMock.mockReturnValue(mockRef);
  sub = new CollectionDocumentSubscription(
    firestoreStoreMock,
    { raw: "compliantReportingReferrals" },
    "abc123",
  );
});

test("dataSource", () => {
  expect(docMock).toHaveBeenCalledWith(
    // undefined results from mocking firestore, it would be a Firestore instance
    undefined,
    "compliantReportingReferrals",
    "abc123",
  );

  expect(sub.dataSource).toBe(mockRef);
});
