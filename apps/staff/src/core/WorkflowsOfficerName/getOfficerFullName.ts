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

import { getStableStaffExternalId, StaffRecord } from "~datatypes";

import { SearchType } from "../models/types";

export function getOfficerFullName(
  availableOfficers: StaffRecord[],
  officerId: string | undefined,
  officerEmail: string | undefined,
  searchType: SearchType | undefined,
  officerIdType:
    | "staffExternalId"
    | "stableStaffExternalId" = "staffExternalId",
): string | undefined {
  let officer: StaffRecord | undefined;
  if (!officerId) {
    officer = availableOfficers.find((o) => o.email === officerEmail);
  } else if (officerIdType === "staffExternalId") {
    officer = availableOfficers.find((o) => o.staffExternalId === officerId);
  } else {
    officer =
      availableOfficers.find(
        (o) => getStableStaffExternalId(o) === officerId,
      ) ??
      // TODO(OBT-53651): Remove once reviewer and updater fields are migrated
      // to stable IDs
      availableOfficers.find((o) => o.staffExternalId === officerId);
  }

  let officerFullName: string | undefined;
  // unlikely but not impossible that name data could be missing
  if (officer?.givenNames && officer?.surname) {
    // names should display in reverse order in TX
    if (officer.stateCode === "US_TX") {
      officerFullName = [officer.surname ?? "", officer.givenNames ?? ""].join(
        ", ",
      );
    } else {
      officerFullName = `${officer.givenNames} ${officer.surname}`.trim();
    }
  }

  // Stable IDs must not be shown to users, so they never become a caseload label.
  if (
    searchType === "CASELOAD" &&
    officerId &&
    officerIdType === "staffExternalId"
  )
    officerFullName = `Caseload ${officerId}`;

  return officerFullName;
}
