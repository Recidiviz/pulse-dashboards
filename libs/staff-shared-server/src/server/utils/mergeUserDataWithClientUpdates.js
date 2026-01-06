// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

/**
 * For each row in downloadedUserData, we need to get the client's 'denied' and 'submitted' values for the given opportunity from clientUpdatesV2 (if they exist)
 * If the 'denied' or 'submitted' values for the given opportunity do not exist in clientUpdatesV2, that means they have not been marked denied nor submitted,
 * so we set these values to false.
 * @param {object[]} downloadedUserData the downloaded data from the gcs bucket (all clients eligible for ars or ers in Texas)
 * @param {object} clientUpdatesV2 data from firestore for Texas clients that have been marked submitted for denied for either ars or ers
 * @returns {object[]} mergedData An array containing all rows from downloadedUserData, merged with the data from clientUpdatesV2
 */
export function mergeUserDataWithClientUpdates(
  downloadedUserData,
  clientUpdatesV2,
) {
  const mergedData = downloadedUserData.map((jsonObject) => {
    // Make a copy and remove state_code column
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { state_code, ...mergedObject } = jsonObject;

    // Default values to false
    mergedObject["denial"] = "false";
    mergedObject["submitted"] = "false";

    const externalId = jsonObject["sid_number"];
    const clientUpdates = clientUpdatesV2[externalId];
    if (clientUpdates) {
      const eligibilityOpp = jsonObject["transfer_type"];
      const clientOpportunityUpdate = clientUpdates[eligibilityOpp];
      if (clientOpportunityUpdate) {
        mergedObject["denial"] = clientOpportunityUpdate["denial"].toString();
        mergedObject["submitted"] =
          clientOpportunityUpdate["submitted"].toString();
      }
    }

    // Replace "usTxAnnualReportStatus" and "usTxEarlyReleaseFromSupervision" strings
    mergedObject["transfer_type"] = jsonObject["transfer_type"]
      .replace("usTxAnnualReportStatus", "Annual Report Status")
      .replace(
        "usTxEarlyReleaseFromSupervision",
        "Early Release from Supervision",
      );

    return mergedObject;
  });

  return mergedData;
}
