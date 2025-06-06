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

import { isEmpty } from "lodash";
import { observer } from "mobx-react-lite";
import pluralize from "pluralize";
import simplur from "simplur";

import { withPresenterManager } from "~hydration-utils";

import { useRootStore } from "../../components/StoreProvider";
import { WorkflowsHomepagePresenter } from "../../WorkflowsStore/presenters/WorkflowsHomepagePresenter";
import { CaseloadSelect } from "../CaseloadSelect";
import CaseloadTypeSelect from "../CaseloadTypeSelect/CaseloadTypeSelect";
import ModelHydrator from "../ModelHydrator";
import { WorkflowsNavLayout } from "../WorkflowsLayouts";
import WorkflowsResults from "../WorkflowsResults";
import { OpportunitySummaries } from "./OpportunitySummaries";

const ManagedComponent = observer(function WorkflowsHomepage({
  presenter,
}: {
  presenter: WorkflowsHomepagePresenter;
}) {
  const {
    selectedSearchIds,
    activeOpportunityTypes,
    opportunitiesByType,
    supportsMultipleSystems,
    userGivenNames,
    hasOpportunities,
    labels: {
      workflowsSearchFieldTitle,
      justiceInvolvedPersonTitle,
      listOfSelectedOpportunities,
      searchResultLabel,
    },
  } = presenter;

  const selectedSearchIdsCount = selectedSearchIds?.length || 0;

  const ctaAndHeaderText = () => {
    const salutation = userGivenNames ? `Hi, ${userGivenNames}.` : "Hi.";
    // If no search ids are selected, show a welcome message
    if (selectedSearchIdsCount === 0)
      return {
        headerText: salutation,
        ctaText: supportsMultipleSystems
          ? `Search above to review and refer people eligible for opportunities like ${listOfSelectedOpportunities}.`
          : `Search for ${pluralize(
              workflowsSearchFieldTitle,
            )} above to review and refer eligible ${justiceInvolvedPersonTitle}s for
                opportunities like ${listOfSelectedOpportunities}.`,
      };
    // Else if no opportunities are found, show a call to action to select another search id
    else if (
      isEmpty(opportunitiesByType) ||
      Object.values(opportunitiesByType || {}).every((opps) => isEmpty(opps))
    )
      return {
        ctaText:
          supportsMultipleSystems || workflowsSearchFieldTitle === "caseload"
            ? "None of the selected caseloads are eligible for opportunities. Search for another caseload."
            : simplur`None of the ${justiceInvolvedPersonTitle}s on the selected ${[
                selectedSearchIdsCount,
              ]} ${pluralize(
                workflowsSearchFieldTitle,
                selectedSearchIdsCount,
              )}['s|'] caseloads are eligible for opportunities. Search for another ${workflowsSearchFieldTitle}.`,
      };
    // else show the header text with the number of opportunities found
    else
      return {
        headerText: `${salutation} We’ve found some outstanding items across ${selectedSearchIdsCount} ${searchResultLabel}`,
      };
  };

  return (
    <WorkflowsNavLayout>
      <CaseloadTypeSelect />
      <CaseloadSelect />
      <ModelHydrator hydratable={presenter}>
        <WorkflowsResults
          headerText={ctaAndHeaderText().headerText}
          callToActionText={ctaAndHeaderText().ctaText}
        >
          {hasOpportunities &&
            activeOpportunityTypes &&
            opportunitiesByType && (
              <OpportunitySummaries
                opportunityTypes={activeOpportunityTypes}
                opportunitiesByType={opportunitiesByType}
              />
            )}
        </WorkflowsResults>
      </ModelHydrator>
    </WorkflowsNavLayout>
  );
});

function usePresenter() {
  const {
    workflowsStore: { opportunityConfigurationStore },
    workflowsStore,
  } = useRootStore();

  return new WorkflowsHomepagePresenter(
    workflowsStore,
    opportunityConfigurationStore,
  );
}

const WorkflowsHomepage = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: true,
});

export default WorkflowsHomepage;
