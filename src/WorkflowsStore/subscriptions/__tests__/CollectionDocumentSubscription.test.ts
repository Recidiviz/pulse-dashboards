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
import { doc, DocumentReference, onSnapshot } from "firebase/firestore";

import { CollectionDocumentSubscription } from "../CollectionDocumentSubscription";
import { getMockDocumentSnapshotHandler } from "../testUtils";

jest.mock("firebase/firestore");

const docMock = doc as jest.MockedFunction<typeof doc>;
const mockRef = (jest.fn() as unknown) as DocumentReference;
const onSnapshotMock = onSnapshot as jest.Mock;

let sub: CollectionDocumentSubscription<DocumentData>;

beforeEach(() => {
  docMock.mockReturnValue(mockRef);
  sub = new CollectionDocumentSubscription(
    "compliantReportingReferrals",
    "abc123"
  );
});

test("dataSource", () => {
  expect(docMock).toHaveBeenCalledWith(
    // undefined results from mocking firestore, it would be a Firestore instance
    undefined,
    "compliantReportingReferrals",
    "abc123"
  );

  expect(sub.dataSource).toBe(mockRef);
});

test("hydration", () => {
  const mockReceive = getMockDocumentSnapshotHandler(onSnapshotMock);

  expect(sub.isLoading).toBeUndefined();

  sub.hydrate();

  expect(sub.isLoading).toBe(true);

  mockReceive({});

  expect(sub.isLoading).toBe(false);
});
