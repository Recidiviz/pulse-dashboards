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

import { spacing, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import styled from "styled-components";

import {
  ParoleDocProgram,
  ParoleEdovoProgram,
  ParoleProgramStatus,
} from "~datatypes";
import { palette } from "~design-system";

import { EmptyState, formatDateNumeric, SubsectionTitle } from "../shared";

type ProgramDateType = "completion" | "start" | "referral";

const US_ID_PROGRAM_STATUSES = [
  "IN_PROGRESS",
  "PENDING",
  "DISCHARGED_SUCCESSFUL",
  "DISCHARGED_UNSUCCESSFUL",
  "DISCHARGED_OTHER",
  "DENIED",
  "INTERNAL_UNKNOWN",
] as const satisfies ReadonlyArray<ParoleProgramStatus>;

type UsIdProgramStatus = (typeof US_ID_PROGRAM_STATUSES)[number];

function isUsIdProgramStatus(
  status: ParoleProgramStatus,
): status is UsIdProgramStatus {
  return (
    US_ID_PROGRAM_STATUSES as ReadonlyArray<ParoleProgramStatus>
  ).includes(status);
}

const PROGRAM_STATUS_DISPLAY: Record<
  UsIdProgramStatus,
  { label: string; datedBy: ProgramDateType }
> = {
  IN_PROGRESS: { label: "Enrolled", datedBy: "start" },
  PENDING: { label: "Waitlisted", datedBy: "referral" },
  DISCHARGED_SUCCESSFUL: { label: "Completed", datedBy: "completion" },
  DISCHARGED_UNSUCCESSFUL: { label: "Removed", datedBy: "completion" },
  DISCHARGED_OTHER: {
    label: "Removed (non-disciplinary)",
    datedBy: "completion",
  },
  DENIED: { label: "Removed from waitlist", datedBy: "completion" },
  INTERNAL_UNKNOWN: { label: "Unknown", datedBy: "start" },
};

const EDOVO_STATUS_DISPLAY: Record<
  ParoleEdovoProgram["status"],
  { label: string; datedBy: Extract<ProgramDateType, "completion" | "start"> }
> = {
  completed: { label: "Completed", datedBy: "completion" },
  "in-progress": { label: "Enrolled", datedBy: "start" },
};

const EMPTY_PLACEHOLDER = "----";

const Table = styled.table`
  ${typography.Sans14}
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  text-align: left;
`;

const DateColumn = styled.col`
  width: 16%;
  min-width: ${rem(120)};
`;

const ProgramColumn = styled.col`
  width: 40%;
`;

const HeaderCell = styled.th`
  color: ${palette.slate70};
  font-weight: 400;
  padding-bottom: ${rem(spacing.sm)};
  padding-right: ${rem(spacing.lg)};
  border-bottom: 1px solid ${palette.slate10};

  &:last-child {
    padding-right: 0;
  }
`;

const Cell = styled.td`
  color: ${palette.pine1};
  padding: ${rem(spacing.md)} ${rem(spacing.lg)} ${rem(spacing.md)} 0;
  border-bottom: 1px solid ${palette.slate10};
  vertical-align: top;

  &:last-child {
    padding-right: 0;
  }
`;

type ProgramRow = {
  key: string;
  date: string | undefined;
  name: string;
  status: string;
};

/** Sorts rows newest first, with undated programs last. */
function byDateDescending(a: ProgramRow, b: ProgramRow): number {
  if (!a.date) return b.date ? 1 : 0;
  if (!b.date) return -1;
  return b.date.localeCompare(a.date);
}

/**
 * The date a program is dated by, based on its status.
 */
function dateFor(
  program: Pick<
    ParoleDocProgram,
    "completionDate" | "startDate" | "referralDate"
  >,
  datedBy: ProgramDateType,
): string | undefined {
  const { completionDate, startDate, referralDate } = program;
  const dateMap = {
    // completionDate is nullable where the other two are optional, so this
    // flattens the null away rather than leaking it into ProgramRow.date.
    completion: completionDate,
    start: startDate,
    referral: referralDate,
  };
  return dateMap[datedBy] ?? undefined;
}

/**
 * Every program the resident has taken, newest first, across both sources.
 */
function programRows(
  docPrograms: Array<ParoleDocProgram>,
  edovoPrograms: Array<ParoleEdovoProgram>,
): Array<ProgramRow> {
  const docRows = docPrograms.flatMap((program, index) => {
    if (!isUsIdProgramStatus(program.status)) return [];

    const { label, datedBy } = PROGRAM_STATUS_DISPLAY[program.status];
    return [
      {
        key: `doc-${index}-${program.name}`,
        date: dateFor(program, datedBy),
        name: program.name,
        status: label,
      },
    ];
  });

  const edovoRows = edovoPrograms.map((program, index) => {
    const { label, datedBy } = EDOVO_STATUS_DISPLAY[program.status];
    return {
      key: `edovo-${index}-${program.title}`,
      date: dateFor({ ...program, referralDate: undefined }, datedBy),
      name: program.title,
      status: label,
    };
  });

  return [...docRows, ...edovoRows].sort(byDateDescending);
}

/**
 * US_ID's Programming subsection: every DOC and Edovo program in one table,
 * whatever its status. Idaho's design shows enrolled and waitlisted programs
 * alongside finished ones, so nothing is filtered out here.
 *
 * @param docPrograms - Programs from the resident's DOC record.
 * @param edovoPrograms - Programs from the Edovo tablet.
 */
export function UsIdProgrammingSection({
  docPrograms,
  edovoPrograms,
}: {
  docPrograms: Array<ParoleDocProgram>;
  edovoPrograms: Array<ParoleEdovoProgram>;
}) {
  const rows = programRows(docPrograms, edovoPrograms);

  return (
    <div>
      <SubsectionTitle>Programming</SubsectionTitle>
      {rows.length === 0 ? (
        <EmptyState>No programs on record.</EmptyState>
      ) : (
        <Table>
          <colgroup>
            <DateColumn />
            <ProgramColumn />
          </colgroup>
          <thead>
            <tr>
              <HeaderCell>Date</HeaderCell>
              <HeaderCell>Program</HeaderCell>
              <HeaderCell>Status</HeaderCell>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <Cell>
                  {row.date ? formatDateNumeric(row.date) : EMPTY_PLACEHOLDER}
                </Cell>
                <Cell>{row.name}</Cell>
                <Cell>{row.status}</Cell>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
