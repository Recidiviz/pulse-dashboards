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
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  restrictToHorizontalAxis,
  restrictToParentElement,
} from "@dnd-kit/modifiers";
import {
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { observer } from "mobx-react-lite";
import styled from "styled-components/macro";

import {
  useFeatureVariants,
  useOpportunityConfigurations,
  useRootStore,
} from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { SupervisionOpportunityPresenter } from "../../InsightsStore/presenters/SupervisionOpportunityPresenter";
import {
  OpportunityTab,
  OpportunityTabGroup,
  OpportunityType,
} from "../../WorkflowsStore";
import { OpportunityCaseloadPresenter } from "../../WorkflowsStore/presenters/OpportunityCaseloadPresenter";
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

export const HydratedOpportunityPersonList = observer(
  function HydratedOpportunityPersonList({
    opportunityType,
    supervisionPresenter,
  }: {
    opportunityType: OpportunityType;
    supervisionPresenter?: SupervisionOpportunityPresenter;
  }) {
    const { workflowsStore, analyticsStore, firestoreStore } = useRootStore();
    const opportunityConfigs = useOpportunityConfigurations();
    const featureVariants = useFeatureVariants();
    const config = opportunityConfigs[opportunityType];

    const presenter = new OpportunityCaseloadPresenter(
      analyticsStore,
      firestoreStore,
      workflowsStore,
      config,
      featureVariants,
      opportunityType,
      supervisionPresenter,
    );
    return <HydratedOpportunityPersonListWithPresenter presenter={presenter} />;
  },
);

/**
 * Displays relevant opportunities for a particular opportunity type organized into
 * various tabs (e.g Almost Eligible, Eligible). Various tab partitions can be set in the
 * opportunity config. This component is shared between Workflows and Insights; as
 * information is calculated differently, we share the SupervisionOpportunityPresenter.
 */
export const HydratedOpportunityPersonListWithPresenter = observer(
  function HydratedOpportunityPersonListWithPresenter({
    presenter,
  }: {
    presenter: OpportunityCaseloadPresenter;
  }) {
    const { isMobile } = useIsMobile(true);

    // Use MouseSensor instead of PointerSensor to disable drag-and-drop on touch screens
    const sensors = useSensors(
      useSensor(MouseSensor, {
        // Require the mouse to move by 10 pixels before activating
        activationConstraint: {
          distance: 10,
        },
      }),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
      }),
    );

    const handleTabClick = (tab: OpportunityTab) => {
      presenter.activeTab = tab;
    };

    const handleTabGroupClick = (newTabGroup: string) => {
      presenter.activeTabGroup = newTabGroup as OpportunityTabGroup;
    };

    const handleNotificationDismiss = (id: string) => {
      presenter.dismissNotification(id);
    };

    const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        presenter.swapTabs(
          active.id as OpportunityTab,
          over.id as OpportunityTab,
        );
      }
    };

    return (
      <>
        <Heading isMobile={isMobile} className="PersonList__Heading">
          {presenter.label}
        </Heading>
        {presenter.subheading ? (
          <OpportunitySubheading subheading={presenter.subheading} />
        ) : (
          <SubHeading className="PersonList__Subheading">
            {presenter.callToAction}
          </SubHeading>
        )}
        {presenter.activeOpportunityNotifications && (
          <OpportunityNotifications
            notifications={presenter.activeOpportunityNotifications}
            handleDismiss={handleNotificationDismiss}
          />
        )}
        {presenter.displayTabs && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToHorizontalAxis, restrictToParentElement]}
          >
            <SortableContext
              items={presenter.displayTabs}
              strategy={horizontalListSortingStrategy}
            >
              <WorkflowsCaseloadControlBar
                title={"Group by"}
                tabBadges={presenter.tabBadges}
                tabs={presenter.displayTabs}
                activeTab={presenter.activeTab}
                setActiveTab={handleTabClick}
                setActiveTabGroup={handleTabGroupClick}
                activeTabGroup={presenter.activeTabGroup as string}
                tabGroups={presenter.displayTabGroups as string[]}
                sortable={presenter.shouldShowAllTabs}
              />
            </SortableContext>
          </DndContext>
        )}
        {presenter.peopleInActiveTab &&
        presenter.peopleInActiveTab.length > 0 ? (
          <CaseloadOpportunityGrid items={presenter.peopleInActiveTab} />
        ) : (
          <EmptyTabGroupWrapper>
            <CallToActionText>
              {`Please select a different grouping.\n None of the ${presenter.justiceInvolvedPersonTitle}s were able to be grouped by ${toTitleCase(presenter.activeTabGroup?.toLowerCase())}".`}
            </CallToActionText>
          </EmptyTabGroupWrapper>
        )}
        <OpportunityPreviewModal
          opportunity={presenter.currentOpportunity}
          navigableOpportunities={presenter.peopleInActiveTab}
          selectedPerson={presenter.selectedPerson}
        />
        <WorkflowsLastSynced
          date={presenter.peopleInActiveTab?.at(0)?.person?.lastDataFromState}
        />
      </>
    );
  },
);
