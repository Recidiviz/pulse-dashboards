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

import { getFirestore } from "firebase-admin/firestore";

/**
 * Given a lowercase stateCode (for example, "us_tx"), makes 2 queries to the clientOpportunityUpdates firestore collection group.
 * The first query grabs all documents where denial is not null. The second query grabs all documents where submitted is not null.
 * Iterates through both snapshots and constructs a results object that maps a client's external id to a nested object.
 * The nested object maps an opportunity name to another nested object containing the surfaced denial and submission details.
 *
 * Per (externalId, opportunity), the returned shape is:
 *   {
 *     denial: boolean,                    // true iff the doc had a non-null denial field
 *     submitted: boolean,                 // true iff the doc had a non-null submitted field
 *     denialReasons: string[] | null,     // from denial.reasons
 *     denialOtherReason: string | null,   // from denial.otherReason
 *     denialDate: Date | null,            // from denial.updated.date
 *     submittedDate: Date | null,         // from submitted.date
 *   }
 *
 * The same opportunity may appear in both snapshots (e.g. a client was submitted and then denied);
 * we spread results into the same entry so denial and submission details coexist.
 *
 * @param {string} stateCode
 * @returns {object} A map of client externalIds to a map of opportunity names to denial/submission details
 */
export async function fetchClientUpdatesV2(stateCode) {
  const db = getFirestore();

  const clientOpportunityUpdatesRef = db.collectionGroup(
    "clientOpportunityUpdates",
  );
  const denialSnapshot = await clientOpportunityUpdatesRef
    .where("denial", "!=", null)
    .where("stateCode", "==", stateCode)
    .get();
  const submittedSnapshot = await clientOpportunityUpdatesRef
    .where("submitted", "!=", null)
    .where("stateCode", "==", stateCode)
    .get();
  const results = {};
  [denialSnapshot, submittedSnapshot].forEach((snapshot) => {
    snapshot.forEach((doc) => {
      const docPathSplit = doc.ref.path.split("/");
      const externalId = docPathSplit[1].split("_")[2];
      const oppString = docPathSplit[3];

      const { denial, submitted } = doc.data();
      const opportunityStatuses = {
        denial: Boolean(denial),
        submitted: Boolean(submitted),
      };
      if (denial) {
        opportunityStatuses.denialReasons = denial.reasons ?? null;
        opportunityStatuses.denialOtherReason = denial.otherReason ?? null;
        opportunityStatuses.denialDate = denial.updated?.date
          ? denial.updated.date.toDate()
          : null;
      }
      if (submitted) {
        opportunityStatuses.submittedDate = submitted.date
          ? submitted.date.toDate()
          : null;
      }

      if (!results[externalId]) {
        results[externalId] = {};
      }
      results[externalId][oppString] = {
        ...results[externalId][oppString],
        ...opportunityStatuses,
      };
    });
  });

  return results;
}
