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
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import simplur from "simplur";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { useOrderedActiveTab } from "../../hooks/useOrderedActiveTab";
import { pluralizeWord } from "../../utils";
import {
  generateOpportunityHydratedHeader,
  generateOpportunityInitialHeader,
  OpportunityTab,
} from "../../WorkflowsStore";
import { OPPORTUNITY_CONFIGS } from "../../WorkflowsStore/Opportunity/OpportunityConfigs";
import cssVars from "../CoreConstants.module.scss";
import { CaseloadOpportunitiesHydrator } from "../OpportunitiesHydrator";
import { Heading, SectionLabelText, SubHeading } from "../sharedComponents";
import WorkflowsResults from "../WorkflowsResults";
import WorkflowsTabbedPersonList from "../WorkflowsTabbedPersonList";
import { OpportunityPreviewModal } from "./OpportunityPreviewModal";
import { PersonListItem } from "./PersonListItem";

const PersonList = styled.ul`
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
  const {
    workflowsStore: {
      selectedSearchIds,
      selectedOpportunityType: opportunityType,
      justiceInvolvedPersonTitle,
      workflowsSearchFieldTitle,
      featureVariants: { responsiveRevamp },
      opportunitiesByTab,
      allOpportunitiesByType,
      selectedPerson,
    },
    analyticsStore,
  } = useRootStore();
  const { isMobile } = useIsMobile(true);
  const { displayTabs, activeTab, setActiveTab } = useOrderedActiveTab();

  if (!opportunityType) return null;

  const opportunityLabel = OPPORTUNITY_CONFIGS[opportunityType].label;
  const totalOpps = allOpportunitiesByType[opportunityType]?.length ?? 0;

  const handleTabClick = (tab: OpportunityTab) => {
    analyticsStore.trackOpportunityTabClicked({ tab });
    setActiveTab(tab);
  };

  const hydratedHeader = generateOpportunityHydratedHeader(
    opportunityType,
    totalOpps
  );
  const initialHeader = generateOpportunityInitialHeader(
    opportunityType,
    justiceInvolvedPersonTitle,
    workflowsSearchFieldTitle
  );

  const initial = (
    <WorkflowsResults
      headerText={opportunityLabel}
      callToActionText={initialHeader}
    />
  );

  const empty = (
    <WorkflowsResults
      callToActionText={simplur`None of the ${justiceInvolvedPersonTitle}s on the selected ${[
        selectedSearchIds.length,
      ]} ${pluralizeWord(
        workflowsSearchFieldTitle,
        selectedSearchIds.length
      )}['s|'] caseloads are eligible for ${opportunityLabel.toLowerCase()}. Search for another ${workflowsSearchFieldTitle}.`}
    />
  );

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
            {opportunitiesByTab[opportunityType][activeTab]?.map(
              (opportunity) => (
                <PersonListItem
                  key={opportunity.person.recordId}
                  opportunity={opportunity}
                />
              )
            )}
          </PersonList>
        </WorkflowsTabbedPersonList>
      ) : (
        displayTabs.map((sectionTitle) => {
          return (
            opportunitiesByTab[opportunityType][sectionTitle]?.length > 0 && (
              <div key={sectionTitle}>
                {/* Only display the section title if there are multiple sections or the one we're
                displaying isn't the first in the section order (such as "Almost Eligible") */}
                {(Object.keys(opportunitiesByTab[opportunityType]).length > 1 ||
                  sectionTitle !== displayTabs[0]) && (
                  <SectionLabelText>{sectionTitle}</SectionLabelText>
                )}
                <PersonList
                  key={`PersonList_${sectionTitle}`}
                  className={`PersonList_${sectionTitle} PersonList`}
                >
                  {opportunitiesByTab[opportunityType][sectionTitle]?.map(
                    (opportunity) => (
                      <PersonListItem
                        key={opportunity.person.recordId}
                        opportunity={opportunity}
                      />
                    )
                  )}
                </PersonList>
              </div>
            )
          );
        })
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
