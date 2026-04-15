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

import { ColumnDef } from "@tanstack/react-table";
import { observer } from "mobx-react-lite";

import { Resident } from "../../../WorkflowsStore/Resident";
import { WorkflowsBadgePill } from "../../BadgePill/BadgePill";
import { OPPORTUNITY_STATUS_COLORS } from "../../utils/workflowsUtils";
import { EligibilityStatusPill } from "../../WorkflowsJusticeInvolvedPersonProfile/OpportunityModuleHeader";
import { CaseloadRowProps } from "./types";
import { usTnPrioritizedOpportunity } from "./utils";

const StatusWrapper = observer(function StatusWrapper({
  row,
}: CaseloadRowProps) {
  const opp = usTnPrioritizedOpportunity(row.original);
  if (opp) {
    return <EligibilityStatusPill opportunity={opp} />;
  }

  const { palette } = OPPORTUNITY_STATUS_COLORS.almostEligible;

  return <WorkflowsBadgePill text="Not Eligible" palette={palette} />;
});

export const usTnStatusColumn = {
  header: "Status",
  id: "status",
  accessorFn: (resident) =>
    usTnPrioritizedOpportunity(resident)?.eligibilityStatusLabel() ||
    "Not Eligible",
  enableSorting: true,
  sortingFn: "alphanumeric",
  cell: StatusWrapper,
} satisfies ColumnDef<Resident>;

export const usTnOpportunityColumn = {
  header: "Opportunity",
  id: "opportunity",
  accessorFn: (resident) => usTnPrioritizedOpportunity(resident)?.config.label,
  enableSorting: true,
  sortingFn: "alphanumeric",
} satisfies ColumnDef<Resident>;
