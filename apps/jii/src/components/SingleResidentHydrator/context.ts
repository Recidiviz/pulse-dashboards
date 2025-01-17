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

import { createContext } from "react";

import { ResidentRecord } from "~datatypes";

import {
  IncarcerationOpportunityId,
  OpportunityConfig,
} from "../../configs/types";
import { EligibilityReport } from "../../models/EligibilityReport/interface";
import { useRequiredContext } from "../../utils/useRequiredContext";

export type OpportunityData = {
  opportunityId: IncarcerationOpportunityId;
  opportunityConfig: OpportunityConfig;
  eligibilityReport: EligibilityReport;
};

export type SingleResidentContext = {
  resident: ResidentRecord;
  opportunities: Array<OpportunityData>;
};

const context = createContext<SingleResidentContext | undefined>(undefined);

export const SingleResidentContextProvider = context.Provider;

export function useSingleResidentContext() {
  return useRequiredContext(context);
}
