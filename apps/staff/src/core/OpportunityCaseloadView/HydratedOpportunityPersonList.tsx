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
import { Sans14, Sans16, Sans18, spacing, TooltipTrigger } from "@recidiviz/design-system";
import { ColumnDef, Row, SortingState } from "@tanstack/react-table";
import { orderBy } from "lodash";
import { observer } from "mobx-react-lite";
import { rem, rgba } from "polished";
import { useMemo, useState } from "react";
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
import { palette } from "~design-system";
import { withPresenterManager } from "~hydration-utils";

import {
  useFeatureVariants,
  useOpportunityConfigurations,
  useRootStore,
} from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { SupervisionOpportunityPresenter } from "../../InsightsStore/presenters/SupervisionOpportunityPresenter";
import {
  formatDurationFromOptionalDays,
  formatWorkflowsDate,
} from "../../utils/formatStrings";
import {
  Client,
  JusticeInvolvedPerson,
  Opportunity,
  OpportunityTab,
  OpportunityTabGroup,
} from "../../WorkflowsStore";
import { NavigateToFormButton } from "../../WorkflowsStore/Opportunity/Forms/NavigateToFormButton";
import { OpportunityPersonListPresenter } from "../../WorkflowsStore/presenters/OpportunityPersonListPresenter";
import { Resident } from "../../WorkflowsStore/Resident";
import { CaseloadSelect } from "../CaseloadSelect";
import InsightsPill from "../InsightsPill";
import PersonId from "../PersonId";
import { Heading, MaxWidth } from "../sharedComponents";
import { WorkflowsCaseloadControlBar } from "../WorkflowsCaseloadControlBar/WorkflowsCaseloadControlBar";
import { EligibilityStatusPill } from "../WorkflowsJusticeInvolvedPersonProfile/OpportunityModuleHeader";
import { OpportunitySidePanelProvider } from "../WorkflowsJusticeInvolvedPersonProfile/OpportunitySidePanelContext";
import WorkflowsOfficerName from "../WorkflowsOfficerName";
import CaseloadOpportunityGrid from "./CaseloadOpportunityGrid";
import { CaseloadTable, CaseloadTableManualSorting } from "./CaseloadTable";
import { LinkedOpportunityCallout } from "./LinkedOpportunityCallout";
import OpportunityNotifications from "./OpportunityNotifications";
import { OpportunityPreviewModal } from "./OpportunityPreviewModal";
import OpportunitySubheading from "./OpportunitySubheading";
import { OpportunityTypeSelect } from "./OpportunityTypeSelect";
import { TableViewToggle } from "./TableViewToggle";

const FlexWrapper = styled.div`
  display: flex;
  gap: ${rem(spacing.lg)};
`;

const MaxWidthWrapper = styled.div`
  ${MaxWidth}
`;

const RightAlignedWrapper = styled.div`
  text-align: right;
  padding-right: ${rem(spacing.xl)};
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

// Styles for empty tabs, shared with Tasks
export const MaxWidthFlexWrapper = styled.div<{ fullWidth?: boolean }>`
  ${Flex}
  ${({ fullWidth }) => !fullWidth && MaxWidth}
`;
export const EmptyTabGroupWrapper = styled.div`
  width: 100%;
  margin-top: ${rem(spacing.md)};
  flex-grow: 1;

  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  flex-direction: column;
  gap: ${rem(spacing.md)};

  border: 1px dashed ${palette.slate30};
  background-color: ${palette.marble2};
`;
export const EmptyTabText = styled(Sans18)`
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

// In Table View, when sorting is enabled for a column, we need to specify the data used
// to order rows (which may be different from the data displayed in the cell) with an
// accessor function. The react-table API also allows an accessorKey to be specified in
// lieu of an accessorFn, but accessorFn makes manual sorting of opportunities easier.
type OpportunityTableColumnSorting =
  | {
      enableSorting: true;
      sortingFn: NonNullable<ColumnDef<Opportunity>["sortingFn"]>;
      accessorFn: (opp: Opportunity) => any;
      sortUndefined?: ColumnDef<Opportunity>["sortUndefined"];
    }
  | { enableSorting: false };

export type OpportunityTableColumnId =
  | "PERSON_NAME"
  | "INSTANCE_DETAILS"
  | "PERSON_DISPLAY_ID"
  | "ASSIGNED_STAFF_NAME"
  | "STATUS"
  | "ELIGIBILITY_DATE"
  | "RELEASE_DATE"
  | "SUPERVISION_EXPIRATION_DATE"
  | "SNOOZE_ENDS_IN"
  | "SUBMITTED_FOR"
  | "CTA_BUTTON"
  | "LAST_VIEWED"
  | "ALMOST_ELIGIBLE_STATUS";

type OpportunityTableColumnDef = {
  header: string;
  id: OpportunityTableColumnId;
  cell?: ColumnDef<Opportunity>["cell"];
} & OpportunityTableColumnSorting;

type OpportunityPersonListProps = {
  opportunityType: OpportunityType;
  supervisionPresenter?: SupervisionOpportunityPresenter;
};

type OpportunityCaseloadComponentProps = {
  presenter: OpportunityPersonListPresenter;
};

export function PersonIdCell({ row }: { row: Row<Opportunity> }) {
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
}

export function OfficerNameCell({ row }: { row: Row<Opportunity> }) {
  return row.original.person.assignedStaffId ? (
    <WorkflowsOfficerName officerId={row.original.person.assignedStaffId} />
  ) : (
    // for type safety, but we should not show this column for anyone without an officer
    ("—")
  );
}

export function FormButtonCell({ row }: { row: Row<Opportunity> }) {
  return row.original.form?.navigateToFormText ? (
    <RightAlignedWrapper>
      <NavigateToFormButton
        className="NavigateToFormButton"
        opportunity={row.original}
      >
        {row.original.form.navigateToFormText}
      </NavigateToFormButton>
    </RightAlignedWrapper>
  ) : null;
}

export function EligibilityStatusCell({ row }: { row: Row<Opportunity> }) {
  return <EligibilityStatusPill opportunity={row.original} />;
}

export function LastViewedCell({ row }: { row: Row<Opportunity> }) {
  const { lastViewed } = row.original;

  if (lastViewed) {
    return (
      <>
        {formatWorkflowsDate(lastViewed.date.toDate())} by{" "}
        <WorkflowsOfficerName officerEmail={lastViewed.by} />
      </>
    );
  }

  return <>Never</>;
}

const OpportunityCaseloadTable = observer(function OpportunityCaseloadTable({
  presenter,
  opportunities,
  manualSorting,
  allColumns,
}: OpportunityCaseloadComponentProps & {
  opportunities: Opportunity[];
  manualSorting?: CaseloadTableManualSorting; // returned by useState
  allColumns: OpportunityTableColumnDef[];
}) {
  const displayedColumns = allColumns.filter(
    (col) => presenter.enabledColumnIds[col.id],
  );

  return (
    <CaseloadTable
      expandedLastColumn
      data={opportunities}
      columns={displayedColumns}
      onRowClick={(opp) => presenter.handleOpportunityClick(opp)}
      onRowRender={(opp) => {
        opp.trackListViewed();
      }}
      shouldHighlightRow={(opp) => presenter.shouldHighlightOpportunity(opp)}
      manualSorting={manualSorting}
      enableMultiSort={false}
      initialState={presenter.initialTableState}
      enableProgressiveLoading={presenter.progressiveLoadingConfig.enabled}
      progressiveLoadingBatchSize={presenter.progressiveLoadingConfig.batchSize}
    />
  );
});

const MultiTableView = observer(function MultiTableView({
  presenter,
  subcategoryOrder,
  peopleInActiveTabBySubcategory,
  allColumns,
}: OpportunityCaseloadComponentProps & {
  subcategoryOrder: string[];
  peopleInActiveTabBySubcategory: Record<
    string,
    Opportunity<JusticeInvolvedPerson>[]
  >;
  allColumns: OpportunityTableColumnDef[];
}) {
  // synchronize sorting state between all displayed tables
  const [sorting, setSorting] = useState<SortingState>([]);
  const displayedSubcategories = subcategoryOrder.filter(
    (category) => peopleInActiveTabBySubcategory[category],
  );

  // A map from column ID to a function that takes the original data for a row
  // and returns the value to use for sorting that column
  const getDataToSortBy = useMemo(
    () =>
      Object.fromEntries(
        allColumns
          .filter((col) => col.enableSorting)
          .map((col) => [col.id, col.accessorFn]),
      ),
    [allColumns],
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
                [(opp) => getDataToSortBy[sorting[0].id](opp)],
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
                allColumns={allColumns}
              />
            </AccordionItemPanel>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
});

const TableView = observer(function TableView({
  presenter,
}: OpportunityCaseloadComponentProps) {
  // We manually assemble column definitions instead of using createColumnHelper
  // due to not needing display/grouping columns and due to type inference issues:
  // https://github.com/TanStack/table/issues/4302
  const columns: OpportunityTableColumnDef[] = [
    {
      header: "Name",
      id: "PERSON_NAME",
      accessorFn: (opp: Opportunity) =>
        // Sort by surname if available, full displayed name if not
        opp.person.record.personName.surname ?? opp.person.displayName,
      enableSorting: true,
      sortingFn: "text",
      cell: ({ row }: { row: Row<Opportunity> }) =>
        row.original.person.displayName,
    },
    {
      // TODO(#7453): Update this heading if other opportunities use instanceDetails
      header: "Sentence",
      id: "INSTANCE_DETAILS",
      accessorFn: (opp: Opportunity) => opp.instanceDetails,
      enableSorting: true,
      sortingFn: "alphanumeric",
    },
    {
      // TODO(#6737): Make the column header the same as the label displayed when copied
      header: "ID",
      id: "PERSON_DISPLAY_ID",
      accessorFn: (opp: Opportunity) => opp.person.displayId,
      enableSorting: true,
      sortingFn: "alphanumeric",
      cell: PersonIdCell,
    },
    {
      header: presenter.eligibilityDateHeader,
      id: "ELIGIBILITY_DATE",
      enableSorting: true,
      sortingFn: "datetime",
      accessorFn: (opp: Opportunity) => opp.eligibilityDate,
      cell: ({ row }: { row: Row<Opportunity> }) => {
        const { eligibilityDate } = row.original;
        const eligibleForDays = presenter.eligibleForDays(row.original);
        if (eligibilityDate && eligibleForDays) {
          return `${formatWorkflowsDate(eligibilityDate)} (${formatDurationFromOptionalDays(eligibleForDays)} ago)`;
        } else if (eligibilityDate) {
          return formatWorkflowsDate(eligibilityDate);
        } else {
          return "—";
        }
      },
    },
    {
      header: presenter.releaseDateHeader,
      id: "RELEASE_DATE",
      enableSorting: true,
      sortingFn: "datetime",
      accessorFn: (opp: Opportunity) => {
        const { person } = opp;
        if (person instanceof Resident) {
          return person.releaseDate;
        }
      },
      cell: ({ row }: { row: Row<Opportunity> }) => {
        const { person } = row.original;
        if (!(person instanceof Resident)) {
          return "—";
        }
        if (person.onLifeSentence) {
          return "Serving a life sentence";
        }
        return `${formatWorkflowsDate(person.releaseDate)}`;
      },
    },
    {
      header: presenter.supervisionEndHeader,
      id: "SUPERVISION_EXPIRATION_DATE",
      enableSorting: true,
      sortingFn: "datetime",
      accessorFn: (opp: Opportunity) => {
        const { person } = opp;
        if (person instanceof Client) {
          return person.expirationDate;
        }
      },
      cell: ({ row }: { row: Row<Opportunity> }) => {
        const { person, sentenceExpiration } = row.original;
        if (!(person instanceof Client)) {
          return "—";
        }
        if (sentenceExpiration) {
          return `${formatWorkflowsDate(sentenceExpiration)}`;
        }
        return `${formatWorkflowsDate(person.expirationDate)}`;
      },
    },
    {
      header: "Last Viewed",
      id: "LAST_VIEWED",
      accessorFn: (opp: Opportunity) => opp.lastViewed?.date,
      enableSorting: true,
      sortingFn: "datetime",
      // treat opportunities that have never been viewed as having the earliest dates
      sortUndefined: -1,
      cell: LastViewedCell,
    },
    {
      header: "Status",
      id: "STATUS",
      enableSorting: presenter.hasMultipleDistinctStatusesInTab,
      accessorFn: (opp: Opportunity) => opp.eligibilityStatusLabel(),
      sortingFn: "text",
      cell: EligibilityStatusCell,
    },
    {
      header: "Missing Criteria",
      id: "ALMOST_ELIGIBLE_STATUS",
      enableSorting: false,
      cell: ({ row }: { row: Row<Opportunity> }) => {
        const opp = row.original;
        if (!opp.isSubmitted && !opp.denied) {
          return opp.almostEligibleStatusMessage;
        }
        return "—";
      },
    },
    {
      header: "Snooze ends in",
      id: "SNOOZE_ENDS_IN",
      enableSorting: true,
      sortingFn: "basic",
      accessorFn: presenter.snoozeEndsInDays,
      cell: ({ row }: { row: Row<Opportunity> }) => {
        return formatDurationFromOptionalDays(
          presenter.snoozeEndsInDays(row.original),
        );
      },
    },
    {
      header: presenter.submittedForHeader,
      id: "SUBMITTED_FOR",
      enableSorting: true,
      sortingFn: "basic",
      accessorFn: presenter.submittedForDays,
      cell: ({ row }: { row: Row<Opportunity> }) => {
        return formatDurationFromOptionalDays(
          presenter.submittedForDays(row.original),
        );
      },
    },
    {
      header: "Assigned to",
      id: "ASSIGNED_STAFF_NAME",
      // Sort by surname if available, full displayed name if not
      accessorFn: (opp: Opportunity) =>
        opp.person.assignedStaff?.surname ?? opp.person.assignedStaffFullName,
      enableSorting: true,
      sortingFn: "text",
      cell: OfficerNameCell,
    },
    // The CTA button column should be last to take advantage of special rightmost column formatting
    {
      header: "",
      id: "CTA_BUTTON",
      enableSorting: false,
      cell: FormButtonCell,
    },
  ];

  const { subcategoryOrder, peopleInActiveTabBySubcategory } = presenter;

  // With subcategories: show a table for each subcategory
  if (subcategoryOrder && peopleInActiveTabBySubcategory) {
    return (
      <MultiTableView
        presenter={presenter}
        subcategoryOrder={subcategoryOrder}
        peopleInActiveTabBySubcategory={peopleInActiveTabBySubcategory}
        allColumns={columns}
      />
    );
  }

  // No subcategories: show one table with all people
  return (
    <OpportunityCaseloadTable
      presenter={presenter}
      opportunities={presenter.peopleInActiveTab}
      allColumns={columns}
    />
  );
});

const ManagedComponent = observer(function HydratedOpportunityPersonList({
  presenter,
}: {
  presenter: OpportunityPersonListPresenter;
}) {
  const { isMobile, isTablet } = useIsMobile(true);

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
    <OpportunitySidePanelProvider>
      <MaxWidthWrapper>
        <Heading isMobile={isMobile}>
          {presenter.label}{" "}
          {presenter.showZeroGrantsPill && (
            <InsightsPill
              label="Zero Grants"
              tooltipCopy={presenter.zeroGrantsTooltip}
            />
          )}
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
        <FlexWrapper>
          <OpportunityTypeSelect presenter={presenter} />
          {!presenter.isSupervisorHomepage && !isTablet && <CaseloadSelect />}
          <TableViewToggle presenter={presenter} />
        </FlexWrapper>
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
      {presenter.tabPrefaceText && (
        <OpportunityPageExplainer>
          {presenter.tabPrefaceText}
        </OpportunityPageExplainer>
      )}
      {/* eslint-disable-next-line no-nested-ternary */}
      {peopleInActiveTab.length === 0 ? (
        /* Empty tab display */
        (<MaxWidthFlexWrapper fullWidth={!presenter.showListView}>
          <EmptyTabGroupWrapper>
            <EmptyTabText>{presenter.emptyTabText}</EmptyTabText>
          </EmptyTabGroupWrapper>
        </MaxWidthFlexWrapper>)
      ) : // eslint-disable-next-line no-nested-ternary
      !presenter.showListView ? (
        /* Table view */
        (<TableView presenter={presenter} />)
      ) : peopleInActiveTabBySubcategory ? (
        /* List view subcategories display */
        ((presenter.subcategoryOrder ?? [])
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
          )))
      ) : (
        /* List view with no subcategories */
        (<CaseloadOpportunityGrid items={peopleInActiveTab} />)
      )}
      <OpportunityPreviewModal
        opportunity={presenter.selectedOpportunity}
        navigableOpportunities={presenter.navigablePeople}
        selectedPerson={presenter.selectedPerson}
      />
    </OpportunitySidePanelProvider>
  );
});

function usePresenter({
  opportunityType,
  supervisionPresenter,
}: OpportunityPersonListProps) {
  const { workflowsStore, analyticsStore, firestoreStore, tenantStore } =
    useRootStore();
  const opportunityConfigs = useOpportunityConfigurations();
  const featureVariants = useFeatureVariants();
  const config = opportunityConfigs[opportunityType];

  return new OpportunityPersonListPresenter(
    analyticsStore,
    firestoreStore,
    tenantStore,
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
