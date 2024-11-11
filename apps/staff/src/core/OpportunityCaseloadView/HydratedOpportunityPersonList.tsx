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
import {
  palette,
  Sans14,
  Sans16,
  Sans18,
  spacing,
} from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled from "styled-components/macro";

import { OpportunityType } from "~datatypes";

import {
  useFeatureVariants,
  useOpportunityConfigurations,
  useRootStore,
} from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { SupervisionOpportunityPresenter } from "../../InsightsStore/presenters/SupervisionOpportunityPresenter";
import { OpportunityTab, OpportunityTabGroup } from "../../WorkflowsStore";
import { OpportunityCaseloadPresenter } from "../../WorkflowsStore/presenters/OpportunityCaseloadPresenter";
import { Heading } from "../sharedComponents";
import { WorkflowsCaseloadControlBar } from "../WorkflowsCaseloadControlBar/WorkflowsCaseloadControlBar";
import WorkflowsLastSynced from "../WorkflowsLastSynced";
import CaseloadOpportunityGrid from "./CaseloadOpportunityGrid";
import { LinkedOpportunityCallout } from "./LinkedOpportunityCallout";
import OpportunityNotifications from "./OpportunityNotifications";
import { OpportunityPreviewModal } from "./OpportunityPreviewModal";
import OpportunitySubheading from "./OpportunitySubheading";

const OpportunityPageExplainer = styled(Sans16)`
  color: ${palette.slate70};
  padding-bottom: ${rem(spacing.md)};
`;

const FlexWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const EmptyTabGroupWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: 100%;
  flex-grow: 1;

  border: 1px dashed ${palette.slate30};
  background-color: ${palette.marble2};
`;

const EmptyTabText = styled(Sans18)`
  color: ${palette.slate80};
  width: 50%;
`;

const SubcategoryHeading = styled(Sans14)`
  text-transform: uppercase;
  color: ${palette.slate60};
  margin: ${rem(spacing.md)} 0;
  border-bottom: 1px solid ${palette.slate20};
  padding-bottom: ${rem(spacing.sm)};
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
    const {
      peopleInActiveTab,
      overdueOpportunityCount,
      overdueOpportunityUrl,
      peopleInActiveTabBySubcategory,
      overdueOpportunityCalloutCopy,
    } = presenter;

    return (
      <FlexWrapper>
        <Heading isMobile={isMobile} className="PersonList__Heading">
          {presenter.label}
        </Heading>
        {presenter.subheading ? (
          <OpportunitySubheading subheading={presenter.subheading} />
        ) : (
          <OpportunityPageExplainer>
            {presenter.callToAction}
          </OpportunityPageExplainer>
        )}
        <LinkedOpportunityCallout
          overdueOpportunityCount={overdueOpportunityCount}
          overdueOpportunityUrl={overdueOpportunityUrl}
          overdueOpportunityCalloutCopy={overdueOpportunityCalloutCopy}
        />
        {presenter.activeOpportunityNotifications && (
          <OpportunityNotifications
            notifications={presenter.activeOpportunityNotifications}
            handleDismiss={handleNotificationDismiss}
          />
        )}

        {
          /* Sortable tab control bar */
          presenter.displayTabs && (
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
          )
        }

        {presenter.tabPrefaceText && (
          <OpportunityPageExplainer>
            {presenter.tabPrefaceText}
          </OpportunityPageExplainer>
        )}

        {peopleInActiveTab.length === 0 ? (
          /* Empty tab display */
          <EmptyTabGroupWrapper>
            <EmptyTabText>{presenter.emptyTabText}</EmptyTabText>
          </EmptyTabGroupWrapper>
        ) : peopleInActiveTabBySubcategory ? (
          /* Subcategories display */
          (presenter.subcategoryOrder ?? [])
            .filter((category) => peopleInActiveTabBySubcategory[category])
            .map((category) => (
              <div key={category}>
                <SubcategoryHeading>
                  {presenter.headingText(category)}
                </SubcategoryHeading>
                <CaseloadOpportunityGrid
                  items={peopleInActiveTabBySubcategory[category]}
                />
              </div>
            ))
        ) : (
          /* Ordinary tab display with no subcategories */
          <CaseloadOpportunityGrid items={peopleInActiveTab} />
        )}

        <OpportunityPreviewModal
          opportunity={presenter.selectedOpportunity}
          navigableOpportunities={peopleInActiveTab}
          selectedPerson={presenter.selectedPerson}
        />
        <WorkflowsLastSynced
          date={peopleInActiveTab?.at(0)?.person?.lastDataFromState}
        />
      </FlexWrapper>
    );
  },
);
