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

import {
  useFeatureVariants,
  useOpportunityConfigurations,
} from "../../components/StoreProvider";
import { PartialRecord } from "../../utils/typeUtils";
import { Opportunity } from "../../WorkflowsStore";
import { OpportunityCaseHighlights } from "./OpportunityCaseHighlights";
import OpportunityTypeSummary from "./OpportunityTypeSummary";
import { OutstandingItemsAlerts } from "./OutstandingItemsAlerts";
import { EMPTY_SUMMARY, type OpportunitySummaryData } from "./summaryData";

/**
 * A shared component between workflows and the supervisor homepage officer view.
 * The parent component should handle any data retrieval.
 */
export const OpportunitySummaries = function OpportunitySummaries({
  opportunitiesByType,
  opportunityTypes,
  officerPseudoId,
  zeroGrantOpportunities,
  summaryByType,
}: {
  /** Only the case highlights read the records themselves. */
  opportunitiesByType: PartialRecord<OpportunityType, Opportunity[]>;
  opportunityTypes: OpportunityType[];
  officerPseudoId?: string;
  zeroGrantOpportunities?: string[];
  /** What each type's card renders, derived by the caller's presenter. */
  summaryByType: PartialRecord<OpportunityType, OpportunitySummaryData>;
}) {
  const { zeroGrantsFlag } = useFeatureVariants();
  const configs = useOpportunityConfigurations();

  return (
    <div>
      <OpportunityCaseHighlights
        opportunityTypes={opportunityTypes}
        opportunitiesByType={opportunitiesByType}
      />
      <OutstandingItemsAlerts
        opportunityTypes={opportunityTypes}
        summaryByType={summaryByType}
      />
      {opportunityTypes.map((opportunityType) => {
        const summary = summaryByType[opportunityType] ?? EMPTY_SUMMARY;
        // Read from the CONFIG, not from a record: the flag is a property of
        // the type, and the counts path has no instance to ask.
        const highlighted =
          configs[opportunityType]?.highlightCasesOnHomepage ?? false;

        // Any populated tab, not the headline count: a type whose records are
        // all submitted has a zero headline and still has something to show.
        const hasSomethingToShow = Object.values(summary.tabCounts).some(
          (count) => count > 0,
        );
        if (highlighted || !hasSomethingToShow) return null;

        return (
          <OpportunityTypeSummary
            key={opportunityType}
            opportunityType={opportunityType}
            officerPseudoId={officerPseudoId}
            summary={summary}
            showZeroGrantsPill={
              zeroGrantsFlag &&
              zeroGrantOpportunities?.includes(opportunityType)
            }
          />
        );
      })}
    </div>
  );
};
