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

import { OpportunityType } from "~datatypes";

import { useFeatureVariants } from "../../components/StoreProvider";
import { Opportunity } from "../../WorkflowsStore";
import { OpportunityCaseHighlights } from "./OpportunityCaseHighlights";
import OpportunityTypeSummary from "./OpportunityTypeSummary";

/**
 * A shared component between workflows and the supervisor homepage officer view.
 * The parent component should handle any data retrieval.
 */
export const OpportunitySummaries = function OpportunitySummaries({
  opportunitiesByType,
  opportunityTypes,
  officerPseudoId,
  zeroGrantOpportunities,
}: {
  opportunitiesByType: Partial<Record<OpportunityType, Opportunity[]>>;
  opportunityTypes: OpportunityType[];
  officerPseudoId?: string;
  zeroGrantOpportunities?: string[];
}) {
  const { zeroGrantsFlag } = useFeatureVariants();

  return (
    <div>
      <OpportunityCaseHighlights
        opportunityTypes={opportunityTypes}
        opportunitiesByType={opportunitiesByType}
      />
      {opportunityTypes.map((opportunityType, index) => {
        const opportunities = opportunitiesByType[opportunityType] || [];
        if (
          opportunities.length &&
          !opportunities[0].config.highlightCasesOnHomepage
        ) {
          return (
            <OpportunityTypeSummary
              key={opportunityType}
              opportunities={opportunities}
              opportunityType={opportunityType}
              officerPseudoId={officerPseudoId}
              showZeroGrantsPill={
                zeroGrantsFlag &&
                zeroGrantOpportunities?.includes(opportunityType)
              }
            />
          );
        }
        return null;
      })}
    </div>
  );
};
