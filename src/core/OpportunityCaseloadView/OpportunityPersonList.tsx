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
import { spacing } from "@recidiviz/design-system";
import { intersection } from "lodash";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { useEffect, useMemo, useState } from "react";
import simplur from "simplur";
import styled from "styled-components/macro";

import {
  useFeatureVariants,
  useRootStore,
} from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { pluralizeWord } from "../../utils";
import {
  generateOpportunityHydratedHeader,
  generateOpportunityInitialHeader,
  OpportunityTab,
} from "../../WorkflowsStore";
import { OPPORTUNITY_CONFIGS } from "../../WorkflowsStore/Opportunity/OpportunityConfigs";
import cssVars from "../CoreConstants.module.scss";
import { CaseloadOpportunitiesHydrator } from "../OpportunitiesHydrator";
import { Heading, SubHeading } from "../sharedComponents";
import WorkflowsResults from "../WorkflowsResults";
import WorkflowsTabbedPersonList from "../WorkflowsTabbedPersonList";
import { OpportunityPersonListWithSectionTitles } from "./OpportunityPersonListWithSectionTitles";
import { OpportunityPreviewModal } from "./OpportunityPreviewModal";
import { PersonListItem } from "./PersonListItem";

export const PersonList = styled.ul`
  column-gap: ${rem(spacing.md)};
  display: grid;
  grid-template-columns: 100%;
  list-style-type: none;
  margin: 0;
  padding: 0;
  row-gap: ${rem(spacing.sm)};

  @media screen and (min-width: ${cssVars.breakpointSm}) {
    grid-template-columns: 50% 50%;
  }
`;

export const OpportunityPersonList = observer(function OpportunityPersonList() {
  const { responsiveRevamp } = useFeatureVariants();
  const {
    workflowsStore: {
      selectedOpportunityType: opportunityType,
      selectedSearchIds,
      justiceInvolvedPersonTitle,
      workflowsSearchFieldTitle,
      opportunitiesByTab,
      allOpportunitiesByType,
      selectedPerson,
    },
    analyticsStore,
  } = useRootStore();

  const { isMobile } = useIsMobile(true);

  const displayTabs = useMemo(
    () =>
      opportunityType && allOpportunitiesByType[opportunityType]?.[0]
        ? intersection(
            allOpportunitiesByType[opportunityType][0].tabOrder,
            Object.keys(opportunitiesByTab[opportunityType]) as OpportunityTab[]
          )
        : [],
    // if any of the elements in the dependency array are not defined, return [].
    [allOpportunitiesByType, opportunitiesByTab, opportunityType]
  );

  const [activeTab, setActiveTab] = useState<OpportunityTab>(displayTabs[0]);

  useEffect(() => {
    setActiveTab((prevTab) => prevTab || displayTabs[0]);
  }, [displayTabs]);

  useEffect(() => {
    if (
      opportunityType &&
      !opportunitiesByTab[opportunityType]?.[activeTab]?.length
    ) {
      setActiveTab(displayTabs[0]);
    }
  }, [opportunitiesByTab, opportunityType, activeTab, displayTabs]);

  if (!opportunityType || !displayTabs) return null;

  const { label } = OPPORTUNITY_CONFIGS[opportunityType];
  const eligibleOpps =
    allOpportunitiesByType[opportunityType]?.filter((opp) => !opp.denial) || [];
  const handleTabClick = (tab: OpportunityTab) => {
    analyticsStore.trackOpportunityTabClicked({ tab });
    setActiveTab(tab);
  };
  const hydratedHeader = generateOpportunityHydratedHeader(
    opportunityType,
    eligibleOpps.length
  );
  const initialHeader = generateOpportunityInitialHeader(
    opportunityType,
    justiceInvolvedPersonTitle,
    workflowsSearchFieldTitle
  );
  const initial = (
    <WorkflowsResults headerText={label} callToActionText={initialHeader} />
  );
  const empty = (
    <WorkflowsResults
      callToActionText={simplur`None of the ${justiceInvolvedPersonTitle}s on the selected ${[
        selectedSearchIds.length,
      ]} ${pluralizeWord(
        workflowsSearchFieldTitle,
        selectedSearchIds.length
      )}['s|'] caseloads are eligible for ${label.toLowerCase()}. Search for another ${workflowsSearchFieldTitle}.`}
    />
  );

  const renderOpportunitiesList = opportunitiesByTab[opportunityType][
    activeTab
  ]?.map((opportunity) => (
    <PersonListItem
      key={opportunity.person.recordId}
      opportunity={opportunity}
    />
  ));

  const hydrated = (
    <>
      <Heading
        isMobile={isMobile && responsiveRevamp}
        className="PersonList__Heading"
      >
        {hydratedHeader.fullText ?? (
          <>
            {hydratedHeader.eligibilityText} {hydratedHeader.opportunityText}
          </>
        )}
      </Heading>
      <SubHeading className="PersonList__Subheading">
        {hydratedHeader.callToAction}
      </SubHeading>
      {responsiveRevamp ? (
        <WorkflowsTabbedPersonList<OpportunityTab>
          tabs={[...displayTabs]}
          activeTab={activeTab}
          onClick={handleTabClick}
        >
          <PersonList
            key={`PersonList_${activeTab}`}
            className={`PersonList_${activeTab} PersonList`}
          >
            {renderOpportunitiesList}
          </PersonList>
        </WorkflowsTabbedPersonList>
      ) : (
        <OpportunityPersonListWithSectionTitles />
      )}
      <OpportunityPreviewModal
        opportunity={selectedPerson?.verifiedOpportunities[opportunityType]}
      />
    </>
  );

  return (
    <CaseloadOpportunitiesHydrator
      {...{ initial, empty, hydrated, opportunityTypes: [opportunityType] }}
    />
  );
});
