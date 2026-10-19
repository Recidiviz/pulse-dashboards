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

import { fetchClientUpdatesV2 } from "../fetchClientUpdatesV2";

vi.mock("firebase-admin/firestore");

function fakeDoc(path, data) {
  return { ref: { path }, data: () => data };
}

function mockCollectionGroup(denialDocs, submittedDocs) {
  const snapshotFor = (field) => ({
    forEach: (fn) =>
      (field === "denial" ? denialDocs : submittedDocs).forEach(fn),
  });
  const query = (field) => ({
    where: () => ({ get: async () => snapshotFor(field) }),
  });
  vi.mocked(getFirestore).mockReturnValue({
    collectionGroup: () => ({ where: (field) => query(field) }),
  });
}

test("returns updates under clientUpdatesV2 and skips demo data", async () => {
  mockCollectionGroup(
    [
      fakeDoc("clientUpdatesV2/us_tn_1001/clientOpportunityUpdates/usTnLSU", {
        denial: { reasons: ["FINES"] },
      }),
      fakeDoc(
        "DEMO_clientUpdatesV2/us_tn_1001/clientOpportunityUpdates/usTnLSU",
        { denial: { reasons: ["DEMO REASON"] } },
      ),
    ],
    [
      fakeDoc(
        "DEMO_clientUpdatesV2/us_tn_2002/clientOpportunityUpdates/usTnLSU",
        { submitted: { date: null } },
      ),
    ],
  );

  const results = await fetchClientUpdatesV2("US_TN");

  expect(results).toEqual({
    1001: {
      usTnLSU: {
        denial: true,
        submitted: false,
        denialReasons: ["FINES"],
        denialOtherReason: null,
        denialDate: null,
      },
    },
  });
});
