// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import { pluralizeWord } from "../../../utils";
import {
  OPPORTUNITY_CONFIGS,
  OpportunityHydratedHeader,
  OpportunityType,
} from "..";

export const generateOpportunityInitialHeader = (
  opportunityType: OpportunityType,
  justiceInvolvedPersonTitle: string,
  workflowsSearchFieldTitle: string
): string => {
  const { label, initialHeader } = OPPORTUNITY_CONFIGS[opportunityType];
  return (
    initialHeader ||
    `Search for ${pluralizeWord(
      workflowsSearchFieldTitle
    )} above to review and refer eligible ${pluralizeWord(
      justiceInvolvedPersonTitle
    )} for ${label.toLowerCase()}.`
  );
};

export type CountFormatter = [
  count: number,
  formatter: (quantity: number) => string | number
];
/** Formatter for opportunity headers */
const hydratedHeaderFormatter = (quantity: number): string | number => {
  return quantity === 0 ? "Some" : quantity;
};

export const generateOpportunityHydratedHeader = (
  opportunityType: OpportunityType,
  count: number
): OpportunityHydratedHeader => {
  return OPPORTUNITY_CONFIGS[opportunityType].hydratedHeader([
    count,
    hydratedHeaderFormatter,
  ]);
};
