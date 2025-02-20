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
  TooltipTrigger,
} from "@recidiviz/design-system";
import { ColumnDef, Row, SortingState } from "@tanstack/react-table";
import { orderBy } from "lodash";
import { observer } from "mobx-react-lite";
import { rem, rgba } from "polished";
import { Dispatch, SetStateAction, useState } from "react";
import {
  Accordion,
  AccordionItem,
  AccordionItemButton,
  AccordionItemHeading,
  AccordionItemPanel,
  AccordionItemState,
} from "react-accessible-accordion";
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
  JusticeInvolvedPerson,
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
import { OpportunityTypeSelect } from "./OpportunityTypeSelect";
import { TableViewToggle } from "./TableViewToggle";

const MaxWidthWrapper = styled.div`
  ${MaxWidth}
`;

const HorizontalScrollWrapper = styled.div`
  overflow-x: scroll;
`;

const OpportunityPageExplainer = styled(Sans16)`
  color: ${palette.slate70};
  margin-bottom: ${rem(spacing.md)};
  margin-top: ${rem(spacing.md)};
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
  margin-top: ${rem(spacing.md)};

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
  margin-top: ${rem(spacing.md)};
  border-bottom: 1px solid ${palette.slate20};
  padding-bottom: ${rem(spacing.sm)};
`;

const CaseloadAccordionHeading = styled(AccordionItemHeading)`
  display: flex;
  align-items: center;
  width: 100%;
  height: 56px;
  background-color: ${rgba(palette.slate, 0.05)};
  border-bottom: 1px solid ${palette.slate10};
`;

const CaseloadAccordionTitleWrapper = styled.div`
  display: flex;
  gap: ${rem(spacing.xs)};

  width: fit-content;
  padding: ${rem(spacing.sm)};
  border-radius: ${rem(spacing.sm)};
  transition: all 0.3s ease;
  &:hover {
    background-color: ${palette.slate10};
    cursor: pointer;
  }
`;

const CaseloadAccordionIcon = styled.i`
  vertical-align: top;
  color: ${palette.pine3};
`;

const CaseloadAccordionTitle = styled(Sans14)`
  color: ${palette.pine3};
`;

const CaseloadAccordionCount = styled(Sans14)`
  color: ${palette.slate80};
`;

type OpportunityPersonListProps = {
  opportunityType: OpportunityType;
  supervisionPresenter?: SupervisionOpportunityPresenter;
};

type OpportunityCaseloadComponentProps = {
  presenter: OpportunityCaseloadPresenter;
};

const OpportunityCaseloadTable = function OpportunityCaseloadTable({
  presenter,
  opportunities,
  manualSorting,
}: OpportunityCaseloadComponentProps & {
  opportunities: Opportunity[];
  manualSorting?: {
    // returned by useState
    sorting: SortingState;
    setSorting: Dispatch<SetStateAction<SortingState>>;
  };
}) {
  // TODO(#7189) handle conditionally showing/hiding columns based on tab state

  // We manually assemble column definitions instead of using createColumnHelper
  // due to not needing display/grouping columns and due to type inference issues:
  // https://github.com/TanStack/table/issues/4302
  const columns: ColumnDef<Opportunity>[] = [
    {
      header: "Name",
      id: "person.displayName",
      accessorKey: "person.displayName",
      enableSorting: true,
      sortingFn: "text",
    },
    {
      // TODO(#6737): Make the column header the same as the label displayed when copied
      header: "DOC ID",
      id: "person.displayId",
      accessorKey: "person.displayId",
      enableSorting: true,
      sortingFn: "alphanumeric",
      // eslint-disable-next-line react/no-unstable-nested-components
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
      id: "person.assignedStaffFullName",
      accessorKey: "person.assignedStaffFullName",
      enableSorting: true,
      sortingFn: "text",
    },
    {
      header: "Status",
      enableSorting: false,
      // eslint-disable-next-line react/no-unstable-nested-components
      cell: ({ row }: { row: Row<Opportunity> }) => {
        return <EligibilityStatusPill opportunity={row.original} />;
      },
    },
    {
      header: "Eligibility Date",
      id: "eligibilityDate",
      accessorKey: "eligibilityDate",
      enableSorting: true,
      sortingFn: "datetime",
      cell: ({ row }: { row: Row<Opportunity> }) => {
        return row.original.eligibilityDate
          ? formatWorkflowsDate(row.original.eligibilityDate)
          : "—";
      },
    },
    {
      id: "cta-button",
      header: "",
      enableSorting: false,
      // eslint-disable-next-line react/no-unstable-nested-components
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
        data={opportunities}
        columns={columns}
        onRowClick={(opp) => presenter.handleOpportunityClick(opp)}
        shouldHighlightRow={(opp) => presenter.shouldHighlightOpportunity(opp)}
        manualSorting={manualSorting}
      />
    </HorizontalScrollWrapper>
  );
};

const MultiTableView = function MultiTableView({
  presenter,
  subcategoryOrder,
  peopleInActiveTabBySubcategory,
}: OpportunityCaseloadComponentProps & {
  subcategoryOrder: string[];
  peopleInActiveTabBySubcategory: Record<
    string,
    Opportunity<JusticeInvolvedPerson>[]
  >;
}) {
  // synchronize sorting state between all displayed tables
  const [sorting, setSorting] = useState<SortingState>([]);
  const displayedSubcategories = subcategoryOrder.filter(
    (category) => peopleInActiveTabBySubcategory[category],
  );
  return (
    <Accordion
      allowMultipleExpanded
      allowZeroExpanded
      preExpanded={[...displayedSubcategories.keys()]}
    >
      {displayedSubcategories.map((category, i) => {
        const opps = peopleInActiveTabBySubcategory[category];

        const sortedOpps =
          sorting.length === 0
            ? opps
            : orderBy(
                opps,
                [sorting[0].id],
                [sorting[0].desc ? "desc" : "asc"],
              );

        return (
          <AccordionItem key={category} uuid={i}>
            <CaseloadAccordionHeading>
              <AccordionItemButton>
                <AccordionItemState>
                  {({ expanded }) => (
                    <TooltipTrigger contents={expanded ? "Collapse" : "Expand"}>
                      <CaseloadAccordionTitleWrapper>
                        {expanded ? (
                          <CaseloadAccordionIcon className="fa fa-angle-up fa-lg" />
                        ) : (
                          <CaseloadAccordionIcon className="fa fa-angle-down fa-lg" />
                        )}
                        <CaseloadAccordionTitle>
                          {presenter.headingText(category)}
                        </CaseloadAccordionTitle>
                        <CaseloadAccordionCount>
                          {sortedOpps.length}
                        </CaseloadAccordionCount>
                      </CaseloadAccordionTitleWrapper>
                    </TooltipTrigger>
                  )}
                </AccordionItemState>
              </AccordionItemButton>
            </CaseloadAccordionHeading>
            <AccordionItemPanel>
              <OpportunityCaseloadTable
                presenter={presenter}
                opportunities={sortedOpps}
                manualSorting={{ sorting, setSorting }}
              />
            </AccordionItemPanel>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};

const TableView = observer(function TableView({
  presenter,
}: OpportunityCaseloadComponentProps) {
  const { subcategoryOrder, peopleInActiveTabBySubcategory } = presenter;

  // With subcategories: show a table for each subcategory
  if (subcategoryOrder && peopleInActiveTabBySubcategory) {
    return (
      <MultiTableView
        presenter={presenter}
        subcategoryOrder={subcategoryOrder}
        peopleInActiveTabBySubcategory={peopleInActiveTabBySubcategory}
      />
    );
  }

  // No subcategories: show one table with all people
  return (
    <OpportunityCaseloadTable
      presenter={presenter}
      opportunities={presenter.peopleInActiveTab}
    />
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
        {opportunityTableView && <OpportunityTypeSelect />}
        {opportunityTableView && <TableViewToggle presenter={presenter} />}
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

      {presenter.tabPrefaceText && presenter.showListView && (
        <OpportunityPageExplainer>
          {presenter.tabPrefaceText}
        </OpportunityPageExplainer>
      )}

      {/* eslint-disable-next-line no-nested-ternary */}
      {peopleInActiveTab.length === 0 ? (
        /* Empty tab display */
        <MaxWidthFlexWrapper>
          <EmptyTabGroupWrapper>
            <EmptyTabText>{presenter.emptyTabText}</EmptyTabText>
          </EmptyTabGroupWrapper>
        </MaxWidthFlexWrapper>
      ) : // eslint-disable-next-line no-nested-ternary
      !presenter.showListView ? (
        /* Table view */
        <TableView presenter={presenter} />
      ) : peopleInActiveTabBySubcategory ? (
        /* List view subcategories display */
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
        /* List view with no subcategories */
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
