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
  useOpportunityConfigurations,
  useRootStore,
} from "../../components/StoreProvider";
import { TenantId } from "../../RootStore/types";
import TENANTS from "../../tenants";
import { getWelcomeText, pluralizeWord } from "../../utils";
import { OpportunityConfiguration } from "../../WorkflowsStore/Opportunity/OpportunityConfigurations";
import { OpportunityType } from "../../WorkflowsStore/Opportunity/OpportunityType/types";
import { CaseloadSelect } from "../CaseloadSelect";
import CaseloadTypeSelect from "../CaseloadTypeSelect/CaseloadTypeSelect";
import { SystemId } from "../models/types";
import { CaseloadOpportunitiesHydrator } from "../OpportunitiesHydrator";
import { WorkflowsNavLayout } from "../WorkflowsLayouts";
import WorkflowsResults from "../WorkflowsResults";
import { OpportunitySummaries } from "./OpportunitySummaries";

function getSelectOpportunitiesText(
  opportunityTypes: OpportunityType[],
  opportunityConfigs: Record<OpportunityType, OpportunityConfiguration>,
): string {
  const labels = opportunityTypes
    .slice(0, 2)
    .map((ot) => opportunityConfigs[ot].label);
  return labels.join(" and ");
}

/**
 * Depending on system type and the search field title, return the correct pluralized
 * form of the searchable options.
 *
 * e.g "caseloads", "facilities", "caseload and/or facility"
 */
function getHydratedCallToActionPluralizedText(
  numSearchIds: number,
  searchFieldTitle: string,
  tenantId?: TenantId,
  activeSystem?: SystemId,
): string {
  if (activeSystem === "INCARCERATION" && searchFieldTitle !== "case manager") {
    return `${pluralizeWord(searchFieldTitle, numSearchIds)}`;
  } else if (activeSystem === "ALL" && tenantId) {
    const facilitiesSearchOverride =
      TENANTS[tenantId].workflowsSystemConfigs?.INCARCERATION
        ?.searchTitleOverride ?? "location";
    if (facilitiesSearchOverride !== "case manager") {
      return `${pluralizeWord("caseload", numSearchIds)} and/or ${pluralizeWord(facilitiesSearchOverride, numSearchIds)}`;
    }
  }

  // We default to using "caseload" in most situations.
  return `${pluralizeWord("caseload", numSearchIds)}`;
}

const WorkflowsHomepage = observer(
  function WorkflowsHomepage(): React.ReactElement | null {
    const { workflowsStore } = useRootStore();

    const {
      selectedSearchIds,
      opportunityTypes,
      user,
      workflowsSearchFieldTitle,
      supportsMultipleSystems,
      justiceInvolvedPersonTitle,
      activeSystem,
      rootStore: { currentTenantId },
      allOpportunitiesByType,
    } = workflowsStore;

    const opportunityConfigs = useOpportunityConfigurations();

    const initialCallToAction = supportsMultipleSystems
      ? `Search above to review and refer people eligible for opportunities like  ${getSelectOpportunitiesText(
          opportunityTypes,
          opportunityConfigs,
        )}.`
      : `Search for ${pluralizeWord(
          workflowsSearchFieldTitle,
        )} above to review and refer eligible ${justiceInvolvedPersonTitle}s for
      opportunities like ${getSelectOpportunitiesText(opportunityTypes, opportunityConfigs)}.`;

    const emptyCallToAction =
      supportsMultipleSystems || workflowsSearchFieldTitle === "caseload"
        ? `None of the selected caseloads are eligible for opportunities. Search for another caseload.`
        : simplur`None of the ${justiceInvolvedPersonTitle}s on the selected ${[
            selectedSearchIds.length,
          ]} ${pluralizeWord(
            workflowsSearchFieldTitle,
            selectedSearchIds.length,
          )}['s|'] caseloads are eligible for opportunities. Search for another ${workflowsSearchFieldTitle}.`;

    const hydratedCallToAction = `Hi, ${
      user?.info.givenNames
    }. We’ve found some outstanding items across ${
      selectedSearchIds.length
    } ${getHydratedCallToActionPluralizedText(selectedSearchIds.length, workflowsSearchFieldTitle, currentTenantId, activeSystem)}`;

    const initial = (
      <WorkflowsResults
        headerText={getWelcomeText(user?.info.givenNames)}
        callToActionText={initialCallToAction}
      />
    );

    const empty = <WorkflowsResults callToActionText={emptyCallToAction} />;

    const hydrated = (
      <WorkflowsResults headerText={hydratedCallToAction}>
        <OpportunitySummaries
          opportunityTypes={opportunityTypes}
          opportunitiesByType={allOpportunitiesByType}
        />
      </WorkflowsResults>
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
  },
);

export default WorkflowsHomepage;
