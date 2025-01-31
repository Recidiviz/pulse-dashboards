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
import { ColumnDef, Row } from "@tanstack/react-table";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled from "styled-components/macro";

import { OpportunityType } from "~datatypes";
import { withPresenterManager } from "~hydration-utils";

import {
  useFeatureVariants,
  useOpportunityConfigurations,
  useRootStore,
} from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { SupervisionOpportunityPresenter } from "../../InsightsStore/presenters/SupervisionOpportunityPresenter";
import { formatWorkflowsDate } from "../../utils/formatStrings";
import {
  Opportunity,
  OpportunityTab,
  OpportunityTabGroup,
} from "../../WorkflowsStore";
import { NavigateToFormButton } from "../../WorkflowsStore/Opportunity/Forms/NavigateToFormButton";
import { OpportunityCaseloadPresenter } from "../../WorkflowsStore/presenters/OpportunityCaseloadPresenter";
import PersonId from "../PersonId";
import { Heading, MaxWidth } from "../sharedComponents";
import { WorkflowsCaseloadControlBar } from "../WorkflowsCaseloadControlBar/WorkflowsCaseloadControlBar";
import { EligibilityStatusPill } from "../WorkflowsJusticeInvolvedPersonProfile/OpportunityModuleHeader";
import CaseloadOpportunityGrid from "./CaseloadOpportunityGrid";
import { CaseloadTable } from "./CaseloadTable";
import { LinkedOpportunityCallout } from "./LinkedOpportunityCallout";
import OpportunityNotifications from "./OpportunityNotifications";
import { OpportunityPreviewModal } from "./OpportunityPreviewModal";
import OpportunitySubheading from "./OpportunitySubheading";

const MaxWidthWrapper = styled.div`
  ${MaxWidth}
`;

const HorizontalScrollWrapper = styled.div`
  overflow-x: scroll;
`;

const OpportunityPageExplainer = styled(Sans16)`
  color: ${palette.slate70};
  padding-bottom: ${rem(spacing.md)};
`;

const Flex = `
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const MaxWidthFlexWrapper = styled.div`
  ${Flex}
  ${MaxWidth}
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

type OpportunityPersonListProps = {
  opportunityType: OpportunityType;
  supervisionPresenter?: SupervisionOpportunityPresenter;
};

type OpportunityCaseloadComponentProps = {
  presenter: OpportunityCaseloadPresenter;
};

const TableView = observer(function TableView({
  presenter,
}: OpportunityCaseloadComponentProps) {
  // TODO(#7189) handle conditionally showing/hiding columns based on tab state

  // We manually assemble column definitions instead of using createColumnHelper
  // due to not needing display/grouping columns and due to type inference issues:
  // https://github.com/TanStack/table/issues/4302
  const columns: ColumnDef<Opportunity>[] = [
    {
      header: "Name",
      accessorKey: "person.displayName",
      enableSorting: true,
      sortingFn: (rowA: Row<Opportunity>, rowB: Row<Opportunity>) =>
        rowA.original.person.displayName.localeCompare(
          rowB.original.person.displayName,
        ),
    },
    {
      // TODO(#6737): Make the column header the same as the label displayed when copied
      header: "DOC ID",
      accessorKey: "person.displayId",
      enableSorting: true,
      sortingFn: (rowA: Row<Opportunity>, rowB: Row<Opportunity>) => {
        return rowA.original.person.displayId.localeCompare(
          rowB.original.person.displayId,
        );
      },
      cell: ({ row }: { row: Row<Opportunity> }) => {
        const opportunity = row.original;
        const { person } = opportunity;
        return (
          <PersonId
            personId={person.displayId}
            pseudoId={person.pseudonymizedId}
            opportunity={opportunity}
          >
            {person.displayId}
          </PersonId>
        );
      },
    },
    {
      header: "Officer",
      accessorKey: "person.assignedStaffFullName",
      enableSorting: true,
      sortingFn: (rowA: Row<Opportunity>, rowB: Row<Opportunity>) => {
        return rowA.original.person.assignedStaffFullName.localeCompare(
          rowB.original.person.assignedStaffFullName,
        );
      },
    },
    {
      header: "Status",
      enableSorting: false,
      cell: ({ row }: { row: Row<Opportunity> }) => {
        return <EligibilityStatusPill opportunity={row.original} />;
      },
    },
    {
      header: "Eligibility Date",
      accessorKey: "eligibilityDate",
      enableSorting: true,
      cell: ({ row }: { row: Row<Opportunity> }) => {
        return row.original.eligibilityDate
          ? formatWorkflowsDate(row.original.eligibilityDate)
          : "—";
      },
    },
    {
      id: "cta-button",
      header: "",
      cell: ({ row }: { row: Row<Opportunity> }) => {
        return row.original.form?.navigateToFormText ? (
          <NavigateToFormButton
            className="NavigateToFormButton"
            opportunity={row.original}
          >
            {row.original.form.navigateToFormText}
          </NavigateToFormButton>
        ) : null;
      },
    },
  ];

  return (
    <HorizontalScrollWrapper>
      <CaseloadTable
        expandedLastColumn
        data={presenter.peopleInActiveTab}
        columns={columns}
        onRowClick={(opp) => presenter.handleOpportunityClick(opp)}
        shouldHighlightRow={(opp) => presenter.shouldHighlightOpportunity(opp)}
      ></CaseloadTable>
    </HorizontalScrollWrapper>
  );
});

const ManagedComponent = observer(function HydratedOpportunityPersonList({
  presenter,
}: {
  presenter: OpportunityCaseloadPresenter;
}) {
  const { opportunityTableView } = useFeatureVariants();
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
    <>
      <MaxWidthWrapper>
        <Heading isMobile={isMobile}>{presenter.label}</Heading>
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
      </MaxWidthWrapper>

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

      {presenter.tabPrefaceText && !opportunityTableView && (
        <OpportunityPageExplainer>
          {presenter.tabPrefaceText}
        </OpportunityPageExplainer>
      )}

      {peopleInActiveTab.length === 0 ? (
        /* Empty tab display */
        <MaxWidthFlexWrapper>
          <EmptyTabGroupWrapper>
            <EmptyTabText>{presenter.emptyTabText}</EmptyTabText>
          </EmptyTabGroupWrapper>
        </MaxWidthFlexWrapper>
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
      ) : /* List or table view with no subcategories */
      /* TODO(#7187) add support for subcategory view in table view */
      opportunityTableView ? (
        <TableView presenter={presenter} />
      ) : (
        <CaseloadOpportunityGrid items={peopleInActiveTab} />
      )}

      <OpportunityPreviewModal
        opportunity={presenter.selectedOpportunity}
        navigableOpportunities={presenter.navigablePeople}
        selectedPerson={presenter.selectedPerson}
      />
    </>
  );
});

function usePresenter({
  opportunityType,
  supervisionPresenter,
}: OpportunityPersonListProps) {
  const { workflowsStore, analyticsStore, firestoreStore } = useRootStore();
  const opportunityConfigs = useOpportunityConfigurations();
  const featureVariants = useFeatureVariants();
  const config = opportunityConfigs[opportunityType];

  return new OpportunityCaseloadPresenter(
    analyticsStore,
    firestoreStore,
    workflowsStore,
    config,
    featureVariants,
    opportunityType,
    supervisionPresenter,
  );
}

/**
 * Displays relevant opportunities for a particular opportunity type organized into
 * various tabs (e.g Almost Eligible, Eligible). Various tab partitions can be set in the
 * opportunity config. This component is shared between Workflows and Insights; as
 * information is calculated differently, we share the SupervisionOpportunityPresenter.
 */
export const HydratedOpportunityPersonList = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: true,
});
