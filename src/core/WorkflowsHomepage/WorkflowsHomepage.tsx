// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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
import { observer } from "mobx-react-lite";
import React from "react";
import simplur from "simplur";

import {
  useFeatureVariants,
  useRootStore,
} from "../../components/StoreProvider";
import { getWelcomeText, pluralizeWord } from "../../utils";
import { OpportunityType } from "../../WorkflowsStore";
import { OPPORTUNITY_CONFIGS } from "../../WorkflowsStore/Opportunity/OpportunityConfigs";
import { CaseloadSelect } from "../CaseloadSelect";
import CaseloadTypeSelect from "../CaseloadTypeSelect/CaseloadTypeSelect";
import { CaseloadOpportunitiesHydrator } from "../OpportunitiesHydrator";
import { WorkflowsNavLayout } from "../WorkflowsLayouts";
import WorkflowsResults from "../WorkflowsResults";
import OpportunityTypeSummary from "./OpportunityTypeSummary";

function getSelectOpportunitiesText(
  opportunityTypes: OpportunityType[]
): string {
  const labels = opportunityTypes
    .slice(0, 2)
    .map((ot) => OPPORTUNITY_CONFIGS[ot].label);
  return labels.join(" and ");
}

const WorkflowsHomepage = observer(
  function WorkflowsHomepage(): React.ReactElement | null {
    const { workflowsStore } = useRootStore();
    const { responsiveRevamp } = useFeatureVariants();

    const {
      selectedSearchIds,
      opportunityTypes,
      allOpportunitiesByType,
      user,
      workflowsSearchFieldTitle,
      supportsMultipleSystems,
      justiceInvolvedPersonTitle,
    } = workflowsStore;

    const initialCallToAction = supportsMultipleSystems
      ? `Search above to review and refer people eligible for opportunities like  ${getSelectOpportunitiesText(
          opportunityTypes
        )}.`
      : `Search for ${pluralizeWord(
          workflowsSearchFieldTitle
        )} above to review and refer eligible ${justiceInvolvedPersonTitle}s for
      opportunities like ${getSelectOpportunitiesText(opportunityTypes)}.`;

    const emptyCallToAction =
      supportsMultipleSystems || workflowsSearchFieldTitle === "caseload"
        ? `None of the selected caseloads are eligible for opportunities. Search for another caseload.`
        : simplur`None of the ${justiceInvolvedPersonTitle}s on the selected ${[
            selectedSearchIds.length,
          ]} ${pluralizeWord(
            workflowsSearchFieldTitle,
            selectedSearchIds.length
          )}['s|'] caseloads are eligible for opportunities. Search for another ${workflowsSearchFieldTitle}.`;

    const hydratedCallToAction = `Hi, ${
      user?.info.givenNames
    }. We’ve found some outstanding items across ${
      selectedSearchIds.length
    } ${pluralizeWord("caseload", selectedSearchIds.length)}`;

    const initial = (
      <WorkflowsResults
        headerText={getWelcomeText(user?.info.givenNames)}
        callToActionText={initialCallToAction}
      />
    );

    const empty = <WorkflowsResults callToActionText={emptyCallToAction} />;

    const opportunitySummaries = opportunityTypes.map((opportunityType) => {
      const opportunities = allOpportunitiesByType[opportunityType] || [];

      if (opportunities.length) {
        return (
          <OpportunityTypeSummary
            key={opportunityType}
            opportunities={opportunities}
            opportunityType={opportunityType}
          />
        );
      }
      return null;
    });

    const hydrated = responsiveRevamp ? (
      <WorkflowsResults headerText={hydratedCallToAction}>
        {opportunitySummaries}
      </WorkflowsResults>
    ) : (
      opportunitySummaries
    );

    return (
      <WorkflowsNavLayout>
        <CaseloadTypeSelect />
        <CaseloadSelect />
        <CaseloadOpportunitiesHydrator
          {...{ initial, empty, hydrated, opportunityTypes }}
        />
      </WorkflowsNavLayout>
    );
  }
);

export default WorkflowsHomepage;
