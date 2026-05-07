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
  Pill,
  Sans14,
  Sans16,
  Sans18,
  spacing,
  TooltipTrigger,
} from "@recidiviz/design-system";
import {
  CellContext,
  ColumnDef,
  Row,
  SortingState,
} from "@tanstack/react-table";
import { differenceInDays, startOfToday } from "date-fns";
import { orderBy } from "lodash";
import { observer } from "mobx-react-lite";
import { rem, rgba } from "polished";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Accordion,
  AccordionItem,
  AccordionItemButton,
  AccordionItemHeading,
  AccordionItemPanel,
  AccordionItemState,
} from "react-accessible-accordion";
import { useLocation } from "react-router-dom";
import styled from "styled-components";

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
import { SupervisionSupervisorOpportunityPresenter } from "../../InsightsStore/presenters/SupervisionSupervisorOpportunityPresenter";
import {
  formatDurationFromOptionalDays,
  formatWorkflowsDate,
  formatWorkflowsDateString,
  toHumanReadable,
  toTitleCase,
} from "../../utils";
import { downloadTableCSV } from "../../utils/downloads/tableToCSV";
import {
  Client,
  JusticeInvolvedPerson,
  Opportunity,
  OpportunityTab,
  OpportunityTabGroup,
} from "../../WorkflowsStore";
import { NavigateToFormButton } from "../../WorkflowsStore/Opportunity/Forms/NavigateToFormButton";
import { UsAzReleaseToTransitionProgramOpportunityBase } from "../../WorkflowsStore/Opportunity/UsAz";
import { UsAzTransferToAdministrativeSupervisionOpportunity } from "../../WorkflowsStore/Opportunity/UsAz/UsAzTransferToAdministrativeSupervisionOpportunity/UsAzTransferToAdministrativeSupervisionOpportunity";
import { UsIdOverdueFaceToFaceContactOpportunity } from "../../WorkflowsStore/Opportunity/UsId/usIdOverdueFaceToFaceContact";
import { UsNeGoodTimeRestorationOpportunity } from "../../WorkflowsStore/Opportunity/UsNe";
import { OpportunityPersonListPresenter } from "../../WorkflowsStore/presenters/OpportunityPersonListPresenter";
import { Resident } from "../../WorkflowsStore/Resident";
import { CaseloadSelect } from "../CaseloadSelect";
import {
  CaseloadTable,
  CaseloadTableManualSorting,
  PersonNameCell,
  ReleaseDateCell,
  SupervisingOfficerNameCell,
} from "../CaseloadTable";
import { DownloadCaseloadButton } from "../CaseloadTable/DownloadTableButton";
import InsightsPill from "../InsightsPill";
import { UsAzMarkSubmittedButton } from "../OpportunityDenial/UsAz/UsAzMenuButton";
import PersonId from "../PersonId";
import { Heading, MaxWidth } from "../sharedComponents";
import { WorkflowsCaseloadControlBar } from "../WorkflowsCaseloadControlBar/WorkflowsCaseloadControlBar";
import { WorkflowsFilterDropdown } from "../WorkflowsFilters/WorkflowsFilterDropdown";
import { EligibilityStatusPill } from "../WorkflowsJusticeInvolvedPersonProfile/OpportunityModuleHeader";
import WorkflowsOfficerName from "../WorkflowsOfficerName";
import CaseloadOpportunityGrid from "./CaseloadOpportunityGrid";
import { LinkedOpportunityCallout } from "./LinkedOpportunityCallout";
import OpportunityNotifications from "./OpportunityNotifications";
import { OpportunityPreviewPanel } from "./OpportunityPreviewPanel";
import OpportunitySubheading from "./OpportunitySubheading";
import { OpportunityTypeSelect } from "./OpportunityTypeSelect";
import { TableViewToggle } from "./TableViewToggle";
import { UsMiSegDurationCellWrapper } from "./UsMi/UsMiSegDurationCell";

// US_ID supervision level data comes in as raw internal identifiers (e.g.
// "MEDIUM") rather than preferred human-readable labels. This
// maps them to display labels via the tenant's supervision level config.
function formattedSupervisionLevel(
  opp: UsIdOverdueFaceToFaceContactOpportunity,
): string | undefined {
  const raw =
    opp.record.eligibleCriteria.usIdMeetsOverdueFaceToFaceContactAlert
      ?.supervisionLevel;
  if (!raw) return undefined;
  return opp.person.rootStore.workflowsStore.formatSupervisionLevel(raw);
}

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
export const EmptyStateWrapper = styled.div`
  min-height: ${rem(50)};
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
export const EmptyStateText = styled(Sans18)`
  color: ${palette.slate80};
  width: 50%;
  min-width: ${rem(320)};
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
  max-width: 100%;
  align-items: center;
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

/** Pill badge for subcategory count. */
const SubcategoryCountBadge = styled(Pill)`
  font-size: 0.75rem;
  padding: 0.2rem 0.7rem;
  margin: 0;
  height: 1.6rem;
  flex-shrink: 0;
  min-width: 1.6rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
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
  | "ALMOST_ELIGIBILITY_DATE"
  | "RELEASE_DATE"
  | "SUPERVISION_EXPIRATION_DATE"
  | "US_ID_EPRD"
  | "US_NE_PEDD_DATE"
  | "UNIT_ID"
  | "US_NE_ELIGIBLE_RESTORATION_AMT"
  | "US_NE_TOTAL_LOST_RESTORABLE_GT"
  | "US_MI_UNIT_ID"
  | "US_MI_ERD"
  | "US_MI_CUSTODY_LEVEL"
  | "US_MI_SEG_START_DATE"
  | "US_MI_SEG_DURATION"
  | "US_MI_NEXT_SCC_DATE"
  | "US_MI_LAST_SCC_DATE"
  | "US_MI_ADD_LAST_SCC_DATE"
  | "US_MI_WARDEN_LAST_SCC_DATE"
  | "US_TN_LATEST_CLASSIFICATION_DATE"
  | "SNOOZE_ENDS_IN"
  | "SUBMITTED_FOR"
  | "CTA_BUTTON"
  | "LAST_VIEWED"
  | "ALMOST_ELIGIBLE_STATUS"
  | "AGREEMENT_STATUS"
  | "HOME_PLAN_STATUS"
  | "MAN_LIT_STATUS"
  | "DENIAL_REASONS"
  | "US_ID_LAST_CONTACT_DATE"
  | "US_ID_SUPERVISION_LEVEL"
  | "US_ID_CASE_TYPE"
  | "US_ID_CONTACT_DUE_DATE"
  | "US_ID_CONTACT_CADENCE"
  | "US_ID_LAST_VIEWED";

type OpportunityTableColumnDef = {
  header: string;
  id: OpportunityTableColumnId;
  cell?: ColumnDef<Opportunity>["cell"];
} & OpportunityTableColumnSorting;

type OpportunityPersonListProps = {
  opportunityType: OpportunityType;
  supervisionPresenter?:
    | SupervisionOpportunityPresenter
    | SupervisionSupervisorOpportunityPresenter;
};

type OpportunityCaseloadComponentProps = {
  presenter: OpportunityPersonListPresenter;
};

function PersonIdCell({ row }: { row: Row<Opportunity> }) {
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

const KeepTogether = styled.span`
  white-space: nowrap;
`;

function EligibilityDateCell({
  getValue,
}: CellContext<Opportunity<JusticeInvolvedPerson>, unknown>) {
  const eligibilityDate = getValue<Date | undefined>();
  if (!eligibilityDate) return "-";
  if (eligibilityDate > startOfToday())
    return formatWorkflowsDate(eligibilityDate);
  const eligibleForDays = differenceInDays(startOfToday(), eligibilityDate);
  return (
    <>
      {formatWorkflowsDate(eligibilityDate)}{" "}
      <KeepTogether>
        {`(${formatDurationFromOptionalDays(eligibleForDays)} ago)`}
      </KeepTogether>
    </>
  );
}

function OfficerNameCell({ row }: { row: Row<Opportunity> }) {
  const {
    tenantStore: { labels },
  } = useRootStore();
  const staffTitle =
    row.original.config.systemType === "INCARCERATION"
      ? labels.incarcerationStaffTitle.toLowerCase()
      : "supervisor";
  return (
    <SupervisingOfficerNameCell
      person={row.original.person}
      staffTitle={staffTitle}
    />
  );
}

export function FormButtonCell({ row }: { row: Row<Opportunity> }) {
  if (
    row.original instanceof UsAzTransferToAdministrativeSupervisionOpportunity
  ) {
    return (
      <RightAlignedWrapper>
        <UsAzMarkSubmittedButton opportunity={row.original} />
      </RightAlignedWrapper>
    );
  }

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
  subcategory,
}: OpportunityCaseloadComponentProps & {
  opportunities: Opportunity[];
  manualSorting?: CaseloadTableManualSorting; // returned by useState
  allColumns: OpportunityTableColumnDef[];
  subcategory?: string;
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
  const [sorting, setSorting] = useState<SortingState>(
    presenter.initialTableState?.sorting ?? [],
  );
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
        const opps = presenter.config.enableWorkflowsFilter
          ? presenter.orderedOpportunitiesForSelectedCategory(category)
          : peopleInActiveTabBySubcategory[category];

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
                        <SubcategoryCountBadge
                          filled
                          color={palette.slate10}
                          textColor={palette.slate70}
                        >
                          {sortedOpps.length}
                        </SubcategoryCountBadge>
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
                subcategory={category}
              />
            </AccordionItemPanel>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
});

const PersonNameWrapper = ({ row }: { row: Row<Opportunity> }) => {
  const { person } = row.original;
  return <PersonNameCell person={person} />;
};

const ReleaseDateWrapper = ({ row }: { row: Row<Opportunity> }) => {
  return <ReleaseDateCell person={row.original.person} />;
};

const TableView = observer(function TableView({
  presenter,
  onRegisterDownload,
}: OpportunityCaseloadComponentProps & {
  onRegisterDownload?: (downloadFn: () => void) => void;
}) {
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
      cell: PersonNameWrapper,
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
      header: presenter.displayIdHeader,
      id: "PERSON_DISPLAY_ID",
      accessorFn: (opp: Opportunity) => opp.person.displayId,
      enableSorting: true,
      sortingFn: "alphanumeric",
      cell: PersonIdCell,
    },
    {
      header: "Unit",
      id: "UNIT_ID",
      enableSorting: true,
      sortingFn: "alphanumeric",
      accessorFn: ({ person }: Opportunity) => {
        if (person instanceof Resident) {
          return person.unitId;
        }
      },
    },
    {
      header: presenter.eligibilityDateHeader,
      id: "ELIGIBILITY_DATE",
      enableSorting: true,
      sortingFn: "datetime",
      accessorFn: (opp: Opportunity) => opp.eligibilityDate,
      cell: EligibilityDateCell,
    },
    {
      header: presenter.almostEligibilityDateHeader,
      id: "ALMOST_ELIGIBILITY_DATE",
      enableSorting: true,
      sortingFn: "datetime",
      accessorFn: (opp: Opportunity) => opp.almostEligibilityDate,
      cell: EligibilityDateCell,
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
      cell: ReleaseDateWrapper,
    },
    {
      header: "Earliest Possible Release Date",
      id: "US_ID_EPRD",
      enableSorting: true,
      sortingFn: "datetime",
      accessorFn: ({ person }: Opportunity) => {
        if (
          person instanceof Resident &&
          person.metadata.stateCode === "US_ID"
        ) {
          return person.metadata.earliestPossibleReleaseDate
            ? formatWorkflowsDateString(
                person.metadata.earliestPossibleReleaseDate,
              )
            : formatWorkflowsDate(person.releaseDate);
        }
      },
    },
    {
      header: "Parole Earned Discharge Date",
      id: "US_NE_PEDD_DATE",
      enableSorting: true,
      sortingFn: "datetime",
      accessorFn: ({ person }: Opportunity) => {
        if (person instanceof Client && person.metadata.stateCode === "US_NE") {
          return person.metadata.paroleEarnedDischargeDate;
        }
      },
      cell: ({ row }: { row: Row<Opportunity> }) => {
        const { person } = row.original;
        if (
          person instanceof Client &&
          person.metadata.stateCode === "US_NE" &&
          person.metadata.paroleEarnedDischargeDate
        ) {
          return formatWorkflowsDate(person.metadata.paroleEarnedDischargeDate);
        }
        return "-";
      },
    },
    {
      header: "Eligible Restoration Amount",
      id: "US_NE_ELIGIBLE_RESTORATION_AMT",
      enableSorting: true,
      sortingFn: "alphanumeric",
      accessorFn: (opp: Opportunity) => {
        if (opp instanceof UsNeGoodTimeRestorationOpportunity) {
          return opp.record.metadata.numberOfDaysEligibleFor === 90
            ? "90+ days"
            : `${opp.record.metadata.numberOfDaysEligibleFor} days`; // naive plural is fine since this will always be 30/60/90
        }
      },
    },
    {
      header: "Total Lost Restorable Good Time",
      id: "US_NE_TOTAL_LOST_RESTORABLE_GT",
      enableSorting: true,
      sortingFn: "alphanumeric",
      accessorFn: ({ person }: Opportunity) => {
        if (
          person instanceof Resident &&
          person.metadata.stateCode === "US_NE"
        ) {
          return person.metadata.goodTimeLostDaysRestorable;
        }
      },
    },
    {
      header: "Unit Lock",
      id: "US_MI_UNIT_ID",
      enableSorting: true,
      sortingFn: "alphanumeric",
      accessorFn: ({ person }: Opportunity) => {
        if (person instanceof Resident && person.stateCode === "US_MI") {
          return person.unitId;
        }
      },
    },
    {
      header: "ERD",
      id: "US_MI_ERD",
      enableSorting: true,
      sortingFn: "datetime",
      accessorFn: ({ person }: Opportunity) => {
        if (
          person instanceof Resident &&
          person.metadata.stateCode === "US_MI"
        ) {
          return person.metadata.earliestReleaseDate;
        }
      },
      cell: ({ row }: { row: Row<Opportunity> }) => {
        const { person } = row.original;
        if (
          person instanceof Resident &&
          person.metadata.stateCode === "US_MI"
        ) {
          if (person.metadata.isLife) {
            return "Life";
          } else if (person.metadata.earliestReleaseDate) {
            return formatWorkflowsDate(person.metadata.earliestReleaseDate);
          }
        }

        return "-";
      },
    },
    {
      header: "Current Custody Level",
      id: "US_MI_CUSTODY_LEVEL",
      enableSorting: true,
      sortingFn: "alphanumeric",
      accessorFn: ({ person }: Opportunity) => {
        if (person instanceof Resident && person.stateCode === "US_MI") {
          return person.displayCustodyLevel;
        }
      },
    },
    {
      header: "Segregation Start Date",
      id: "US_MI_SEG_START_DATE",
      enableSorting: true,
      sortingFn: "datetime",
      accessorFn: (opp: Opportunity) => {
        if (
          [
            "usMiSecurityClassificationCommitteeReviewV2",
            "usMiAddInPersonSecurityClassificationCommitteeReviewV2",
            "usMiWardenInPersonSecurityClassificationCommitteeReviewV2",
          ].includes(opp.type) &&
          opp.record
        ) {
          return formatWorkflowsDate(
            opp.record.metadata.solitarySessionStartDate,
          );
        }
      },
    },
    {
      header: "SCC Due Date",
      id: "US_MI_NEXT_SCC_DATE",
      enableSorting: true,
      sortingFn: "datetime",
      accessorFn: (opp: Opportunity) => {
        if (
          [
            "usMiSecurityClassificationCommitteeReview",
            "usMiAddInPersonSecurityClassificationCommitteeReview",
            "usMiWardenInPersonSecurityClassificationCommitteeReview",
            "usMiSecurityClassificationCommitteeReviewV2",
            "usMiAddInPersonSecurityClassificationCommitteeReviewV2",
            "usMiWardenInPersonSecurityClassificationCommitteeReviewV2",
          ].includes(opp.type) &&
          opp.record
        ) {
          return opp.record.metadata.nextSccDate;
        }
      },
      cell: ({ row }: { row: Row<Opportunity> }) => {
        const opp = row.original;
        if (
          [
            "usMiSecurityClassificationCommitteeReview",
            "usMiAddInPersonSecurityClassificationCommitteeReview",
            "usMiWardenInPersonSecurityClassificationCommitteeReview",
            "usMiSecurityClassificationCommitteeReviewV2",
            "usMiAddInPersonSecurityClassificationCommitteeReviewV2",
            "usMiWardenInPersonSecurityClassificationCommitteeReviewV2",
          ].includes(opp.type) &&
          opp.record
        ) {
          return formatWorkflowsDate(opp.record.metadata.nextSccDate);
        }
      },
    },
    {
      header: "Last SCC Review Date",
      id: "US_MI_LAST_SCC_DATE",
      enableSorting: true,
      sortingFn: "datetime",
      accessorFn: (opp: Opportunity) => {
        if (
          ["usMiSecurityClassificationCommitteeReviewV2"].includes(opp.type) &&
          opp.record
        ) {
          return opp.record.metadata.latestSccReviewDate;
        }
      },
      cell: ({ row }: { row: Row<Opportunity> }) => {
        const opp = row.original;
        if (
          ["usMiSecurityClassificationCommitteeReviewV2"].includes(opp.type) &&
          opp.record
        ) {
          return formatWorkflowsDate(opp.record.metadata.latestSccReviewDate);
        }
      },
    },
    {
      header: "Last Warden Review Date",
      id: "US_MI_WARDEN_LAST_SCC_DATE",
      enableSorting: true,
      sortingFn: "datetime",
      accessorFn: (opp: Opportunity) => {
        if (
          [
            "usMiWardenInPersonSecurityClassificationCommitteeReviewV2",
          ].includes(opp.type) &&
          opp.record
        ) {
          return opp.record.metadata.latestSccReviewDate;
        }
      },
      cell: ({ row }: { row: Row<Opportunity> }) => {
        const opp = row.original;
        if (
          [
            "usMiWardenInPersonSecurityClassificationCommitteeReviewV2",
          ].includes(opp.type) &&
          opp.record
        ) {
          return formatWorkflowsDate(opp.record.metadata.latestSccReviewDate);
        }
      },
    },
    {
      header: "Last ADD Review Date",
      id: "US_MI_ADD_LAST_SCC_DATE",
      enableSorting: true,
      sortingFn: "datetime",
      accessorFn: (opp: Opportunity) => {
        if (
          ["usMiAddInPersonSecurityClassificationCommitteeReviewV2"].includes(
            opp.type,
          ) &&
          opp.record
        ) {
          return opp.record.metadata.latestSccReviewDate;
        }
      },
      cell: ({ row }: { row: Row<Opportunity> }) => {
        const opp = row.original;
        if (
          ["usMiAddInPersonSecurityClassificationCommitteeReviewV2"].includes(
            opp.type,
          ) &&
          opp.record
        ) {
          return formatWorkflowsDate(opp.record.metadata.latestSccReviewDate);
        }
      },
    },
    {
      header: "Time in Segregation",
      id: "US_MI_SEG_DURATION",
      enableSorting: true,
      sortingFn: "basic",
      accessorFn: (opp: Opportunity) => {
        if (
          [
            "usMiSecurityClassificationCommitteeReviewV2",
            "usMiAddInPersonSecurityClassificationCommitteeReviewV2",
            "usMiWardenInPersonSecurityClassificationCommitteeReviewV2",
          ].includes(opp.type) &&
          opp.record
        ) {
          return opp.record.metadata.daysInSolitarySession;
        }
      },
      cell: UsMiSegDurationCellWrapper,
    },
    {
      header: "Latest Classification",
      id: "US_TN_LATEST_CLASSIFICATION_DATE",
      enableSorting: true,
      sortingFn: "datetime",
      accessorFn: ({ person }: Opportunity) => {
        if (
          person instanceof Resident &&
          person.metadata.stateCode === "US_TN"
        ) {
          return person.metadata.latestClassificationDate;
        }
      },
      cell: ({ row }: { row: Row<Opportunity> }) => {
        const { person } = row.original;
        if (
          person instanceof Resident &&
          person.metadata.stateCode === "US_TN"
        ) {
          return formatWorkflowsDate(person.metadata.latestClassificationDate);
        }

        return "-";
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
      header: "Agreement Status",
      id: "AGREEMENT_STATUS",
      enableSorting: true,
      accessorFn: (opp: Opportunity) =>
        opp instanceof UsAzReleaseToTransitionProgramOpportunityBase &&
        opp.agreementStatus,
      sortingFn: "text",
    },
    {
      header: "Home Plan Status",
      id: "HOME_PLAN_STATUS",
      enableSorting: true,
      accessorFn: (opp: Opportunity) =>
        opp instanceof UsAzReleaseToTransitionProgramOpportunityBase &&
        opp.homePlanStatus,
      sortingFn: "text",
    },
    {
      header: "Mandatory Literacy Status",
      id: "MAN_LIT_STATUS",
      enableSorting: true,
      accessorFn: (opp: Opportunity) =>
        opp instanceof UsAzReleaseToTransitionProgramOpportunityBase &&
        opp.mandatoryLiteracyStatus,
      sortingFn: "text",
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
      header: "Denial Reasons",
      id: "DENIAL_REASONS",
      enableSorting: true,
      sortingFn: "text",
      accessorFn: (opp: Opportunity) => {
        if (!opp.denial) return "";
        return opp.denial.reasons.join(", ");
      },
    },
    {
      header: "Last Contact Date",
      id: "US_ID_LAST_CONTACT_DATE",
      enableSorting: true,
      sortingFn: "datetime",
      accessorFn: (opp: Opportunity) => {
        if (opp instanceof UsIdOverdueFaceToFaceContactOpportunity) {
          return opp.record?.eligibleCriteria
            ?.usIdMeetsOverdueFaceToFaceContactAlert?.lastContactDate;
        }
      },
      cell: ({ row }: { row: Row<Opportunity> }) => {
        const opp = row.original;
        if (opp instanceof UsIdOverdueFaceToFaceContactOpportunity) {
          const lastContactDate =
            opp.record?.eligibleCriteria?.usIdMeetsOverdueFaceToFaceContactAlert
              ?.lastContactDate;
          if (lastContactDate) {
            return formatWorkflowsDate(lastContactDate);
          }
        }
        return "—";
      },
    },
    {
      header: "Supervision Level",
      id: "US_ID_SUPERVISION_LEVEL",
      enableSorting: true,
      sortingFn: "text",
      accessorFn: (opp: Opportunity) => {
        if (opp instanceof UsIdOverdueFaceToFaceContactOpportunity) {
          return formattedSupervisionLevel(opp);
        }
      },
      cell: ({ row }: { row: Row<Opportunity> }) => {
        const opp = row.original;
        if (opp instanceof UsIdOverdueFaceToFaceContactOpportunity) {
          return formattedSupervisionLevel(opp) ?? "—";
        }
        return "—";
      },
    },
    {
      header: "Case Type",
      id: "US_ID_CASE_TYPE",
      enableSorting: true,
      sortingFn: "text",
      accessorFn: (opp: Opportunity) => {
        if (opp instanceof UsIdOverdueFaceToFaceContactOpportunity) {
          return opp.record.eligibleCriteria
            .usIdMeetsOverdueFaceToFaceContactAlert?.caseType;
        }
      },
      cell: ({ row }: { row: Row<Opportunity> }) => {
        const opp = row.original;
        if (opp instanceof UsIdOverdueFaceToFaceContactOpportunity) {
          const caseType =
            opp.record.eligibleCriteria.usIdMeetsOverdueFaceToFaceContactAlert
              ?.caseType;
          return caseType ? toTitleCase(toHumanReadable(caseType)) : "—";
        }
        return "—";
      },
    },
    {
      header: "Due Date",
      id: "US_ID_CONTACT_DUE_DATE",
      enableSorting: true,
      sortingFn: "datetime",
      accessorFn: (opp: Opportunity) => {
        if (opp instanceof UsIdOverdueFaceToFaceContactOpportunity) {
          return opp.record?.metadata?.dueDate;
        }
      },
      cell: ({ row }: { row: Row<Opportunity> }) => {
        const opp = row.original;
        if (opp instanceof UsIdOverdueFaceToFaceContactOpportunity) {
          const dueDate = opp.record?.metadata?.dueDate;
          if (dueDate) {
            return formatWorkflowsDate(dueDate);
          }
        }
        return "—";
      },
    },
    {
      header: "Contact Cadence",
      id: "US_ID_CONTACT_CADENCE",
      enableSorting: true,
      sortingFn: "text",
      accessorFn: (opp: Opportunity) => {
        if (opp instanceof UsIdOverdueFaceToFaceContactOpportunity) {
          return opp.record?.metadata?.contactCadence;
        }
      },
      cell: ({ row }: { row: Row<Opportunity> }) => {
        const opp = row.original;
        if (opp instanceof UsIdOverdueFaceToFaceContactOpportunity) {
          const contactCadence = opp.record?.metadata?.contactCadence;
          if (contactCadence) {
            return contactCadence.toLowerCase();
          }
        }
        return "—";
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
    {
      header: "Last Viewed in Recidiviz",
      id: "US_ID_LAST_VIEWED",
      accessorFn: (opp: Opportunity) => opp.lastViewed?.date,
      enableSorting: true,
      sortingFn: "datetime",
      sortUndefined: -1,
      cell: LastViewedCell,
    },
    // The CTA button column should be last to take advantage of special rightmost column formatting
    {
      header: "",
      id: "CTA_BUTTON",
      enableSorting: false,
      cell: FormButtonCell,
    },
  ];

  // Register download callback so the parent can trigger CSV export
  // with the correct data and column definitions.
  const displayedColumns = columns.filter(
    (col) => presenter.enabledColumnIds[col.id],
  );
  const downloadFileName = [presenter.label, presenter.activeTab]
    .filter(Boolean)
    .join(" - ");
  onRegisterDownload?.(() => {
    const data = presenter.config.enableWorkflowsFilter
      ? presenter.orderedOpportunitiesForSelectedCategory()
      : presenter.peopleInActiveTab;
    downloadTableCSV(data, displayedColumns, downloadFileName);
  });

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
  const downloadRef = useRef<(() => void) | null>(null);
  const registerDownload = useCallback((fn: () => void) => {
    downloadRef.current = fn;
  }, []);

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
    presenter.handleTabClick(tab);
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

  const allOpportunities = presenter.config.enableWorkflowsFilter
    ? presenter.orderedOpportunitiesForSelectedCategory()
    : peopleInActiveTab;

  return (
    <>
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
          {presenter.config.enableWorkflowsFilter && (
            <WorkflowsFilterDropdown presenter={presenter} />
          )}
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
                tabBadges={
                  presenter.selectedSearchablesCount > 0
                    ? presenter.tabBadges
                    : {}
                }
                tabs={presenter.displayTabs}
                activeTab={presenter.activeTab}
                setActiveTab={handleTabClick}
                setActiveTabGroup={handleTabGroupClick}
                activeTabGroup={presenter.activeTabGroup as string}
                tabGroups={presenter.displayTabGroups as string[]}
                sortable={presenter.shouldShowAllTabs}
                actions={
                  !presenter.showListView ? (
                    <DownloadCaseloadButton
                      onDownload={() => downloadRef.current?.()}
                    />
                  ) : undefined
                }
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
      {allOpportunities.length === 0 ||
      presenter.selectedSearchablesCount === 0 ? (
        /* Empty tab display */
        <MaxWidthFlexWrapper fullWidth={!presenter.showListView}>
          <EmptyStateWrapper>
            <EmptyStateText>
              {presenter.selectedSearchablesCount > 0
                ? presenter.emptyTabText
                : presenter.searchIdsNotSelectedCtaText}
            </EmptyStateText>
          </EmptyStateWrapper>
        </MaxWidthFlexWrapper>
      ) : // eslint-disable-next-line no-nested-ternary
      !presenter.showListView ? (
        /* Table view */
        <TableView
          presenter={presenter}
          onRegisterDownload={registerDownload}
        />
      ) : peopleInActiveTabBySubcategory ? (
        /* List view subcategories display */
        (presenter.subcategoryOrder ?? [])
          .filter((category) =>
            presenter.config.enableWorkflowsFilter
              ? presenter.orderedOpportunitiesForSelectedCategory(category)
              : peopleInActiveTabBySubcategory[category],
          )
          .map((category) => (
            <div key={category}>
              <SubcategoryHeading>
                {presenter.headingText(category)}
              </SubcategoryHeading>
              <CaseloadOpportunityGrid
                items={
                  presenter.config.enableWorkflowsFilter
                    ? presenter.orderedOpportunitiesForSelectedCategory(
                        category,
                      )
                    : peopleInActiveTabBySubcategory[category]
                }
              />
            </div>
          ))
      ) : (
        /* List view with no subcategories */
        <CaseloadOpportunityGrid items={allOpportunities} />
      )}
      <OpportunityPreviewPanel
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
  const {
    workflowsStore,
    analyticsStore,
    firestoreStore,
    tenantStore,
    opportunitiesFilterStore,
  } = useRootStore();
  const opportunityConfigs = useOpportunityConfigurations();
  const featureVariants = useFeatureVariants();
  const config = opportunityConfigs[opportunityType];

  const { state } = useLocation();
  const initialTab = (state as { initialTab?: string } | null)?.initialTab;

  return new OpportunityPersonListPresenter(
    analyticsStore,
    firestoreStore,
    tenantStore,
    opportunitiesFilterStore,
    workflowsStore,
    config,
    featureVariants,
    opportunityType,
    supervisionPresenter,
    { initialTab },
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
