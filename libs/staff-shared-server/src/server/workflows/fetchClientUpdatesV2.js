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
 * The first query grabs all documents where denial is not null. The first query grabs all documents where submitted is not null.
 * We then iterate through these documents, and filter for only those that inclue the stateCode in the document's path.
 * We then construct the results object, which maps a client's external id to a nested object. The nested object maps an opportunity name
 * to another nested object, which contains the denial and submitted values.
 * For example, the returned results would look like:
 * {"fakeExternalId": {"fakeOpportunityOne": {"denial": "true", "submitted": "false"}}, {"fakeOpportunityTwo": {"denial": "false", "submitted": "false"}}}
 * @param {string} stateCode
 * @returns {object} A map of client externalIds to a map of opportunity names to a map of 'denial' and 'submitted' values
 */
export async function fetchClientUpdatesV2(stateCode) {
  const db = getFirestore();

  const clientOpportunityUpdatesRef = db.collectionGroup(
    "clientOpportunityUpdates",
  );
  const denialSnapshot = await clientOpportunityUpdatesRef
    .where("denial", "!=", null)
    .get();
  const submittedSnapshot = await clientOpportunityUpdatesRef
    .where("submitted", "!=", null)
    .get();
  const results = {};
  [denialSnapshot, submittedSnapshot].forEach((snapshot) => {
    snapshot.forEach((doc) => {
      // Only grab update docs for us_tx
      if (doc.ref.path.includes(stateCode)) {
        const docPathSplit = doc.ref.path.split("/");
        const externalId = docPathSplit[1].split("_")[2];
        const oppString = docPathSplit[3];

        const { denial, submitted } = doc.data();
        const opportunityStatuses = {
          denial: Boolean(denial),
          submitted: Boolean(submitted),
        };

        if (!results[externalId]) {
          results[externalId] = {};
        }
        results[externalId][oppString] = opportunityStatuses;
      }
    });
  });

  return results;
}
