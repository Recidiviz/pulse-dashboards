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

import { toTitleCase } from "@artsy/to-title-case";
import { intersection } from "lodash";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import styled from "styled-components/macro";

import {
  useOpportunityConfigurations,
  useRootStore,
} from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import {
  JusticeInvolvedPerson,
  Opportunity,
  OpportunityTab,
  OpportunityTabGroup,
  OpportunityType,
} from "../../WorkflowsStore";
import { opportunitiesByTab } from "../../WorkflowsStore/utils";
import { Heading, SubHeading } from "../sharedComponents";
import { WorkflowsCaseloadControlBar } from "../WorkflowsCaseloadControlBar/WorkflowsCaseloadControlBar";
import WorkflowsLastSynced from "../WorkflowsLastSynced";
import { CallToActionText } from "../WorkflowsResults/WorkflowsResults";
import CaseloadOpportunityGrid from "./CaseloadOpportunityGrid";
import OpportunityNotifications from "./OpportunityNotifications";
import { OpportunityPreviewModal } from "./OpportunityPreviewModal";
import OpportunitySubheading from "./OpportunitySubheading";

const EmptyTabGroupWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  align-self: center;
  width: 100%;
  height: 100%;
  text-align: center;
`;

/**
 * Displays relevant opportunities for a particular opportunity type organized into
 * various tabs (e.g Almost Eligible, Eligible). Various tab partitions can be set in the
 * opportunity config.
 */
export const HydratedOpportunityPersonList = observer(
  function HydratedOpportunityPersonList({
    allOpportunitiesByType,
    opportunityType,
    justiceInvolvedPersonTitle,
    selectedPerson,
  }: {
    allOpportunitiesByType: Partial<Record<OpportunityType, Opportunity[]>>;
    opportunityType: OpportunityType;
    justiceInvolvedPersonTitle: string;
    selectedPerson?: JusticeInvolvedPerson;
  }) {
    // TODO: try to refactor the opp notifications so we don't rely on workflowsStore here.
    const { analyticsStore, workflowsStore } = useRootStore();

    const opportunityConfigs = useOpportunityConfigurations();

    const { isMobile } = useIsMobile(true);

    const displayTabGroups = [
      ...Object.keys(opportunityConfigs[opportunityType].tabGroups),
    ] as OpportunityTabGroup[];

    const [activeTabGroup, setActiveTabGroup] = useState<OpportunityTabGroup>(
      // The default tab group is the first for the current opportunity, not "Show All"
      displayTabGroups[0],
    );

    const oppsFromOpportunitiesByTab = opportunitiesByTab(
      allOpportunitiesByType,
      activeTabGroup,
    )[opportunityType];

    const oppsFromOpportunitiesByOppType = useMemo(() => {
      return allOpportunitiesByType[opportunityType];
    }, [allOpportunitiesByType, opportunityType]);

    // Only display tabs in the active tab group that correspond to relevant
    // opportunities.
    const displayTabs = useMemo(() => {
      return oppsFromOpportunitiesByTab
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

    // Switch to the default tab when there are no longer relevant opportunities for
    // the current tab (e.g. search item was removed, or eligibility status changed).
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

    if (!oppsFromOpportunitiesByOppType || !oppsFromOpportunitiesByTab)
      return null;

    const activeOpportunityNotifications =
      workflowsStore.activeNotificationsForOpportunityType(opportunityType);

    const { label, callToAction, subheading } =
      opportunityConfigs[opportunityType];

    const handleTabClick = (tab: OpportunityTab) => {
      analyticsStore.trackOpportunityTabClicked({ tab });
      setActiveTab(tab);
    };

    const handleTabGroupClick = (tabGroup: string) => {
      setActiveTabGroup(tabGroup as OpportunityTabGroup);
      const currentTabs =
        opportunityConfigs[opportunityType].tabGroups[
          tabGroup as OpportunityTabGroup
        ] || [];
      setActiveTab(currentTabs[0] || displayTabs[0]);
    };

    const handleNotificationDismiss = (id: string) =>
      workflowsStore.dismissOpportunityNotification(id);

    const items = oppsFromOpportunitiesByTab[activeTab];
    const currentOpportunity =
      selectedPerson?.verifiedOpportunities[opportunityType];

    return (
      <>
        <Heading isMobile={isMobile} className="PersonList__Heading">
          {label}
        </Heading>
        {subheading ? (
          <OpportunitySubheading subheading={subheading} />
        ) : (
          <SubHeading className="PersonList__Subheading">
            {callToAction}
          </SubHeading>
        )}
        {activeOpportunityNotifications && (
          <OpportunityNotifications
            notifications={activeOpportunityNotifications}
            handleDismiss={handleNotificationDismiss}
          />
        )}
        <WorkflowsCaseloadControlBar
          title={"Group by"}
          tabBadges={tabBadges}
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
          selectedPerson={selectedPerson}
        />
        <WorkflowsLastSynced date={items?.at(0)?.person?.lastDataFromState} />
      </>
    );
  },
);
