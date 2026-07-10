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

import { format } from "date-fns";

// Characters that spreadsheet apps (Excel, LibreOffice, Sheets) interpret as a
// formula prefix when they lead a cell. Prefixing such values with a single
// quote forces them to be treated as literal text on import.
const CSV_FORMULA_PREFIXES = new Set(["=", "+", "-", "@", "\t", "\r"]);

function sanitizeCsvCell(value) {
  if (typeof value !== "string" || value.length === 0) return value;
  return CSV_FORMULA_PREFIXES.has(value[0]) ? `'${value}` : value;
}

function sanitizeRowForCsv(row) {
  const sanitized = {};
  for (const [key, value] of Object.entries(row)) {
    sanitized[key] = sanitizeCsvCell(value);
  }
  return sanitized;
}

/**
 * For each row in downloadedUserData, surface denial details and submission date for the given (client, opportunity) pair
 * from clientUpdatesV2 (if present). Rows without a matching Firestore update get blank values for the surfaced columns.
 *
 * Columns added per row (ordered denial, denial_reason, submitted so the reason
 * sits between the two boolean flags in the exported CSV):
 *   - denial        "true"/"false"
 *   - denial_reason the denial category codes and any free-text "other" reason,
 *                   comma-separated (blank when the row has no denial)
 *   - submitted     "true"/"false"
 *   - denial_date   denial.updated.date formatted as MM/DD/YYYY
 *   - submitted_date submitted.date formatted as MM/DD/YYYY
 *
 * @param {object[]} downloadedUserData the downloaded data from the gcs bucket (all clients eligible for ars or ers in Texas)
 * @param {object} clientUpdatesV2 data from firestore for Texas clients with denial or submitted state on ars or ers
 * @returns {object[]} mergedData An array containing all rows from downloadedUserData, merged with denial/submission details
 */
export function mergeUserDataWithClientUpdates(
  downloadedUserData,
  clientUpdatesV2,
) {
  const mergedData = downloadedUserData.map((jsonObject) => {
    // Make a copy and remove state_code column
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { state_code, ...mergedObject } = jsonObject;

    // Default new columns to empty strings and booleans to "false".
    // Key insertion order places denial_reason between the two boolean flags.
    mergedObject["denial"] = "false";
    mergedObject["denial_reason"] = "";
    mergedObject["submitted"] = "false";
    mergedObject["denial_date"] = "";
    mergedObject["submitted_date"] = "";

    const externalId = jsonObject["sid_number"];
    const clientUpdates = clientUpdatesV2[externalId];
    if (clientUpdates) {
      const eligibilityOpp = jsonObject["transfer_type"];
      const clientOpportunityUpdate = clientUpdates[eligibilityOpp];
      if (clientOpportunityUpdate) {
        mergedObject["denial"] = clientOpportunityUpdate.denial.toString();
        mergedObject["submitted"] =
          clientOpportunityUpdate.submitted.toString();

        // Combine the denial category codes and any free-text "other" reason
        // into a single column. Either (or both) may be present.
        const reasonParts = [];
        if (clientOpportunityUpdate.denialReasons != null) {
          reasonParts.push(...clientOpportunityUpdate.denialReasons);
        }
        if (clientOpportunityUpdate.denialOtherReason != null) {
          reasonParts.push(clientOpportunityUpdate.denialOtherReason);
        }
        mergedObject["denial_reason"] = reasonParts.join(", ");

        if (clientOpportunityUpdate.denialDate != null) {
          mergedObject["denial_date"] = format(
            clientOpportunityUpdate.denialDate,
            "MM/dd/yyyy",
          );
        }
        if (clientOpportunityUpdate.submittedDate != null) {
          mergedObject["submitted_date"] = format(
            clientOpportunityUpdate.submittedDate,
            "MM/dd/yyyy",
          );
        }
      }
    }

    // Replace "usTxAnnualReportStatus" and "usTxEarlyReleaseFromSupervision" strings
    mergedObject["transfer_type"] = jsonObject["transfer_type"]
      .replace("usTxAnnualReportStatus", "Annual Report Status")
      .replace(
        "usTxEarlyReleaseFromSupervision",
        "Early Release from Supervision",
      );

    // Defense in depth: neutralize CSV formula-injection on every cell before export.
    return sanitizeRowForCsv(mergedObject);
  });

  return mergedData;
}
