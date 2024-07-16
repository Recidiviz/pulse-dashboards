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
import { toTitleCase } from "@artsy/to-title-case";
import { spacing } from "@recidiviz/design-system";
import { intersection } from "lodash";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { useEffect, useMemo, useState } from "react";
import simplur from "simplur";
import styled from "styled-components/macro";

// TODO: Gut this entire document, so it uses the new caseload presenter.
import {
  useFeatureVariants,
  useOpportunityConfigurations,
  useRootStore,
} from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { pluralizeWord } from "../../utils";
import {
  countOpportunities,
  generateOpportunityInitialHeader,
  Opportunity,
  OpportunityTab,
  OpportunityTabGroup,
} from "../../WorkflowsStore";
import cssVars from "../CoreConstants.module.scss";
import { CaseloadOpportunitiesHydrator } from "../OpportunitiesHydrator";
import { Heading, SubHeading } from "../sharedComponents";
import { WorkflowsCaseloadControlBar } from "../WorkflowsCaseloadControlBar/WorkflowsCaseloadControlBar";
import WorkflowsResults from "../WorkflowsResults";
import { CallToActionText } from "../WorkflowsResults/WorkflowsResults";
import CaseloadOpportunityGrid from "./CaseloadOpportunityGrid";
import { OpportunityPreviewModal } from "./OpportunityPreviewModal";
import OpportunitySubheading from "./OpportunitySubheading";

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

const EmptyTabGroupWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  align-self: center;
  width: 100%;
  height: 100%;
  text-align: center;
`;

const Empty = observer(function Empty() {
  const {
    workflowsStore: {
      selectedOpportunityType: opportunityType,
      selectedSearchIds,
      justiceInvolvedPersonTitle,
      workflowsSearchFieldTitle,
    },
  } = useRootStore();

  const opportunityConfigs = useOpportunityConfigurations();

  if (!opportunityType) return null;

  const { label } = opportunityConfigs[opportunityType];
  return (
    <WorkflowsResults
      callToActionText={simplur`None of the ${justiceInvolvedPersonTitle}s on the selected ${[
        selectedSearchIds.length,
      ]} ${pluralizeWord(
        workflowsSearchFieldTitle,
        selectedSearchIds.length,
      )}['s|'] caseloads are eligible for ${label.toLowerCase()}. Search for another ${workflowsSearchFieldTitle}.`}
    />
  );
});

const HydratedOpportunityPersonList = observer(
  function HydratedOpportunityPersonList() {
    const {
      workflowsStore: {
        selectedOpportunityType: opportunityType,
        opportunitiesByTab,
        allOpportunitiesByType,
        selectedPerson,
        justiceInvolvedPersonTitle,
      },
      analyticsStore,
    } = useRootStore();

    const opportunityConfigs = useOpportunityConfigurations();
    const { opportunityPolicyCopy } = useFeatureVariants();

    const { isMobile } = useIsMobile(true);

    const displayTabGroups = (
      opportunityType
        ? [...Object.keys(opportunityConfigs[opportunityType].tabGroups)]
        : ["Eligibility Status"]
    ) as OpportunityTabGroup[];

    const [activeTabGroup, setActiveTabGroup] = useState<OpportunityTabGroup>(
      // The default tab group is the first for the current opportunity, not "Show All"
      displayTabGroups[0],
    );

    const oppsFromOpportunitiesByTab:
      | Partial<Record<OpportunityTab, Opportunity[]>>
      | undefined =
      opportunityType && allOpportunitiesByType
        ? opportunitiesByTab(allOpportunitiesByType, activeTabGroup)[
            opportunityType
          ]
        : undefined;

    const oppsFromOpportunitiesByOppType = useMemo(() => {
      if (allOpportunitiesByType && opportunityType) {
        return allOpportunitiesByType[opportunityType];
      }
      return undefined;
    }, [allOpportunitiesByType, opportunityType]);

    const displayTabs = useMemo(() => {
      return oppsFromOpportunitiesByTab && opportunityType
        ? intersection(
            opportunityConfigs[opportunityType].tabGroups[activeTabGroup],
            Object.keys(oppsFromOpportunitiesByTab),
          )
        : [];
    }, [
      activeTabGroup,
      opportunityConfigs,
      opportunityType,
      oppsFromOpportunitiesByTab,
    ]) as OpportunityTab[];

    const [activeTab, setActiveTab] = useState<OpportunityTab>(displayTabs[0]);
    useEffect(() => {
      setActiveTab((prevTab) => prevTab || displayTabs[0]);
    }, [displayTabs]);

    useEffect(() => {
      if (!oppsFromOpportunitiesByTab?.[activeTab]?.length) {
        setActiveTab(displayTabs[0]);
      }
    }, [oppsFromOpportunitiesByTab, activeTab, displayTabs]);

    // Calculate map of the tabs to the value to display on that tab's badge
    const tabBadges: Partial<Record<OpportunityTab, number>> = useMemo(() => {
      const badges: Partial<Record<OpportunityTab, number>> = {};
      for (const tab of displayTabs) {
        badges[tab] = oppsFromOpportunitiesByTab?.[tab]?.length ?? 0;
      }
      return badges;
    }, [displayTabs, oppsFromOpportunitiesByTab]);

    if (
      !opportunityType ||
      !oppsFromOpportunitiesByOppType ||
      !oppsFromOpportunitiesByTab
    )
      return null;

    const { label, eligibilityTextForCount, callToAction, subheading } =
      opportunityConfigs[opportunityType];

    const opportunityCount = oppsFromOpportunitiesByOppType
      ? countOpportunities(oppsFromOpportunitiesByOppType, opportunityType)
      : 0;

    const handleTabClick = (tab: OpportunityTab) => {
      analyticsStore.trackOpportunityTabClicked({ tab });
      setActiveTab(tab);
    };

    const handleTabGroupClick = (tabGroup: string) => {
      setActiveTabGroup(tabGroup as OpportunityTabGroup);
      const currentTabs = opportunityType
        ? opportunityConfigs[opportunityType].tabGroups[
            tabGroup as OpportunityTabGroup
          ] || []
        : [];
      setActiveTab(currentTabs[0] || displayTabs[0]);
    };

    const items = oppsFromOpportunitiesByTab[activeTab];
    const currentOpportunity =
      selectedPerson?.verifiedOpportunities[opportunityType];

    return !oppsFromOpportunitiesByOppType.length ? (
      <Empty />
    ) : (
      <>
        <Heading isMobile={isMobile} className="PersonList__Heading">
          {opportunityPolicyCopy
            ? label
            : eligibilityTextForCount(opportunityCount)}
        </Heading>
        {opportunityPolicyCopy && subheading ? (
          <OpportunitySubheading subheading={subheading} />
        ) : (
          <SubHeading className="PersonList__Subheading">
            {callToAction}
          </SubHeading>
        )}
        <WorkflowsCaseloadControlBar
          title={"Group by"}
          tabBadges={opportunityPolicyCopy && tabBadges}
          tabs={displayTabs}
          activeTab={activeTab}
          setActiveTab={handleTabClick}
          setActiveTabGroup={handleTabGroupClick}
          activeTabGroup={activeTabGroup as string}
          tabGroups={displayTabGroups as string[]}
        />
        {items && items.length > 0 ? (
          <CaseloadOpportunityGrid items={items} />
        ) : (
          <EmptyTabGroupWrapper>
            <CallToActionText>
              {`Please select a different grouping.\n None of the ${justiceInvolvedPersonTitle}s were able to be grouped by "${toTitleCase(activeTabGroup.toLowerCase())}".`}
            </CallToActionText>
          </EmptyTabGroupWrapper>
        )}
        <OpportunityPreviewModal
          opportunity={currentOpportunity}
          navigableOpportunities={items}
        />
      </>
    );
  },
);

export const OpportunityPersonList = observer(function OpportunityPersonList() {
  const {
    workflowsStore: {
      selectedOpportunityType: opportunityType,
      justiceInvolvedPersonTitle,
      workflowsSearchFieldTitle,
    },
  } = useRootStore();
  const opportunityConfigs = useOpportunityConfigurations();

  if (!opportunityType) return null;

  const { label, initialHeader } = opportunityConfigs[opportunityType];

  const cta =
    initialHeader ||
    generateOpportunityInitialHeader(
      label,
      justiceInvolvedPersonTitle,
      workflowsSearchFieldTitle,
    );

  const empty = <Empty />;

  const initial = (
    <WorkflowsResults headerText={label} callToActionText={cta} />
  );

  const hydrated = <HydratedOpportunityPersonList />;

  return (
    <CaseloadOpportunitiesHydrator
      {...{ initial, empty, hydrated, opportunityTypes: [opportunityType] }}
    />
  );
});
