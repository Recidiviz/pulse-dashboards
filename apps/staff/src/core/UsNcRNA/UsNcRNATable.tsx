// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import Switch from "@mui/material/Switch";
import { animation } from "@recidiviz/design-system";
import { ColumnDef, Row } from "@tanstack/react-table";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { Link } from "react-router-dom";
import styled from "styled-components";

import { palette, spacing } from "~design-system";

import { useRootStore } from "../../components/StoreProvider";
import { formatWorkflowsDate } from "../../utils";
import { CaseloadTable, PersonIdCell, PersonNameCell } from "../CaseloadTable";
import { workflowsUrl } from "../views";
import { WorkflowsFilterDropdown } from "../WorkflowsFilters/WorkflowsFilterDropdown";
import { RNABadge, RNAStatus } from "./RNABadge";
import { RNAFilterPresenter } from "./RNAFilterPresenter";
import { RNARowData, RNAStatusList } from "./RNAFilterPresenter";
import { useRNAFilterStore } from "./RNAFilterStoreProvider";

const ViewResults = styled.div`
  border-radius: ${rem(spacing.xs)};
  padding: ${rem(spacing.md)} ${rem(spacing.xs)};
  width: fit-content;
  color: ${palette.pine1};

  display: flex;
  gap: ${rem(spacing.sm)};

  &:hover {
    background-color: ${palette.slate05};
  }
`;

export const EnableToggle = styled(Switch)<{ $width: number; $height: number }>`
  &.MuiSwitch-root {
    width: ${({ $width }) => rem($width)};
    height: ${({ $height }) => rem($height)};
    padding: ${rem(0)};
  }

  & .MuiSwitch-switchBase {
    padding: ${rem(2)};
    transition-duration: ${animation.defaultDurationMs}ms;

    &.Mui-checked {
      transform: translateX(${({ $width, $height }) => rem($width - $height)});
      color: ${palette.marble1};
      & + .MuiSwitch-track {
        opacity: 1;
        background-color: ${palette.pine4};
      }
    }
  }

  & .MuiSwitch-thumb {
    color: ${palette.marble1} !important;

    width: ${({ $height }) => rem($height - 4)};
    height: ${({ $height }) => rem($height - 4)};
    border-radius: ${({ $height }) => rem($height / 2)};
  }

  & .MuiSwitch-track {
    height: ${({ $height }) => rem($height)};
    border-radius: ${({ $height }) => rem($height / 2)};
    background-color: ${palette.slate50Opaque};
    opacity: 1;
    transition: background-color ${animation.defaultDurationMs}ms ease-in-out;
  }
`;

const NameCellWrapper = ({ row }: { row: Row<RNARowData> }) => (
  <PersonNameCell person={row.original.person} />
);

const IdCellWrapper = ({ row }: { row: Row<RNARowData> }) => (
  <PersonIdCell person={row.original.person} />
);

const FormattedRNADueDate = ({ row }: { row: Row<RNARowData> }) => {
  return formatWorkflowsDate(row.original.rnaDueDate);
};

const StatusBadgeCell = ({ row }: { row: Row<RNARowData> }) => (
  <RNABadge kind={row.original.status} />
);

export const EnableCell = ({ row }: { row: Row<RNARowData> }) => {
  const canBeEnabled = row.original.status === "UPCOMING";

  // TODO: add a click handler that creates the assessment
  return (
    <EnableToggle
      defaultChecked={!canBeEnabled}
      disabled={!canBeEnabled}
      $width={38}
      $height={22}
      slotProps={{ input: { "aria-label": "enable self-report" } }}
      disableRipple={true}
      disableTouchRipple={true}
    />
  );
};

const LastUpdatedCell = ({ row }: { row: Row<RNARowData> }) => {
  const { status } = row.original;
  if (status === "COMPLETE") {
    return `Ready since ${formatWorkflowsDate(row.original.completedAt)}`;
  } else if (status === "IN_PROGRESS") {
    return formatWorkflowsDate(row.original.updatedAt);
  } else if (status === "NOT_STARTED") {
    return `Enabled on ${formatWorkflowsDate(row.original.createdAt)}`;
  } else if (status === "SUBMITTED_BY_STAFF") {
    return `Submitted ${formatWorkflowsDate(row.original.submittedByStaffAt)}`;
  } else {
    return "–";
  }
};

const ViewResultsCell = ({ row }: { row: Row<RNARowData> }) => {
  const { status } = row.original;
  if (status !== "COMPLETE" && status !== "SUBMITTED_BY_STAFF") {
    return null;
  }
  return (
    <Link
      to={workflowsUrl("rnaSingleResidentResults", {
        justiceInvolvedPersonId: row.original.person.pseudonymizedId,
      })}
    >
      <ViewResults>
        <span>View results </span>
        <i className="fa fa-angle-right" />
      </ViewResults>
    </Link>
  );
};

const rnaStatusOrder: RNAStatus[] = [
  "UPCOMING",
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETE",
  "SUBMITTED_BY_STAFF",
];

const columns = [
  {
    header: "Name",
    id: "name",
    accessorFn: (r: RNARowData) => r.person.displayName,
    enableSorting: true,
    sortingFn: "text",
    cell: NameCellWrapper,
  },
  {
    header: "OPUS ID",
    id: "id",
    accessorFn: (r: RNARowData) => r.person.displayId,
    enableSorting: true,
    sortingFn: "alphanumeric",
    cell: IdCellWrapper,
  },
  {
    header: "Self-Report Due Date",
    id: "dueDate",
    accessorFn: (r: RNARowData) => r.rnaDueDate,
    enableSorting: true,
    sortingFn: "datetime",
    cell: FormattedRNADueDate,
  },
  {
    header: "Self-Report Status",
    id: "status",
    accessorFn: (r: RNARowData) => r.status,
    enableSorting: true,
    sortingFn: (rowA: Row<RNARowData>, rowB: Row<RNARowData>) => {
      const statusA = rnaStatusOrder.indexOf(rowA.original.status);
      const statusB = rnaStatusOrder.indexOf(rowB.original.status);
      if (statusA === statusB) {
        return 0;
      } else if (statusB > statusA) {
        return 1;
      } else {
        return -1;
      }
    },
    cell: StatusBadgeCell,
  },
  {
    header: "Enable Self-Report",
    id: "enable",
    cell: EnableCell,
  },
  {
    header: "Last Updated",
    id: "lastUpdated",
    accessorFn: (r: RNARowData) =>
      r.submittedByStaffAt ?? r.completedAt ?? r.updatedAt,
    enableSorting: true,
    sortingFn: "datetime",
    cell: LastUpdatedCell,
  },
  {
    header: "",
    id: "viewResults",
    cell: ViewResultsCell,
  },
] satisfies ColumnDef<RNARowData>[];

export const RNATable = observer(function RNATable({
  data,
}: {
  data: RNAStatusList;
}) {
  const { workflowsStore } = useRootStore();
  const rnaFilterStore = useRNAFilterStore();
  const presenter = new RNAFilterPresenter(
    data,
    rnaFilterStore,
    workflowsStore,
  );

  return (
    <>
      <WorkflowsFilterDropdown presenter={presenter} alignedWithLeft={true} />
      <CaseloadTable
        expandedLastColumn={true}
        data={presenter.filteredQueryData}
        columns={columns}
        initialState={{
          sorting: [
            { id: "status", desc: false },
            { id: "dueDate", desc: false },
          ],
        }}
        enableProgressiveLoading={true}
        progressiveLoadingBatchSize={50}
      />
    </>
  );
});
