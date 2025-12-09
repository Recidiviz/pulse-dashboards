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

import { OpportunityType } from "../../opportunities/OpportunityType";
import { IncarcerationStaffRecord } from "../Staff/Incarceration/Workflows/schema";
import { SupervisionOfficer } from "../Staff/Supervision/Insights/SupervisionOfficer/schema";
import { SupervisionStaffRecord } from "../Staff/Supervision/Workflows/schema";

/**
 * Parsed staff-level data exported from the Recidiviz data platform.
 * May be for supervision or incarceration.
 */
export type StaffRecord =
  | IncarcerationStaffRecord["output"]
  | SupervisionStaffRecord["output"];

export type SupervisionOfficerWithOpportunityCardDetails =
  SupervisionOfficer & {
    clientsCount: number;
    clientsCountWithLabel: string;
    /**
     * Only relevant when we want to split up an opportunity into one card per tab
     */
    countsByTab?: Record<string, number>;
  };

/**
 * Opportunity information used when rendering info cards in the Opportunities Module
 * of the Supervisor Homepage.
 */
export type OpportunityCardInfo = {
  label: string;
  priority: "NORMAL" | "HIGH";
  officersWithRelevantClients: SupervisionOfficerWithOpportunityCardDetails[];
  relevantClientsCount: number;
  opportunityType: OpportunityType;
  zeroGrantsTooltip?: string;
  supervisorReviewCounts?: Record<string, number>;
  urlSection: string;
};
