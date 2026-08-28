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

import { match } from "ts-pattern";

import { PersonType } from "~@meetings/app/shared/api";
import { AgencyConfig } from "~@meetings/config/types";

export const assigneeToConfigLabel = (
  agencyConfig: AgencyConfig | null,
  assignee: string,
  personType: PersonType,
): string => {
  if (!agencyConfig?.labels) {
    return assignee;
  }

  return match({ assignee: assignee.toLowerCase(), personType })
    .with(
      { assignee: "client", personType: "client" },
      () => agencyConfig.labels?.client ?? assignee,
    )
    .with(
      // Intentionally have "client" here. The LLM never assigns to "Resident", so we do it based
      // on frontend state
      { assignee: "client", personType: "resident" },
      () => agencyConfig.labels?.resident ?? assignee,
    )
    .with(
      // Mirrors formatSpeakerLabel: clients meet with supervision staff,
      // residents meet with facilities staff.
      { assignee: "staff member", personType: "client" },
      () => agencyConfig.labels?.supervisionStaff ?? assignee,
    )
    .with(
      { assignee: "staff member", personType: "resident" },
      () => agencyConfig.labels?.facilitiesStaff ?? assignee,
    )
    .with(
      {
        assignee: "third party",
      },
      () => agencyConfig.labels?.thirdParty ?? assignee,
    )
    .otherwise(() => assignee);
};
