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

import { useEffect, useState } from "react";

import { PastActionsInput } from "~datatypes";

import StyledToaster from "../../../../../components/StyledToaster";
import { ParoleBoardReportMode } from "../../../../../ParoleStore/presenters/ParoleBoardReportPresenter";
import {
  PastActionFields,
  resolvePastActions,
} from "../../../../../ParoleStore/report/pastActions";
import { pastActionColumns, pastActionRows } from "./__fixtures__/pastActions";
import { ReportRowList } from "./ReportRowList";
import { ReportRowValues, rowValues } from "./reportRowValues";

// Required by the custom CSF indexer. Title auto-derives from the file path.
export default {};

type ValuesById = Record<string, ReportRowValues<PastActionFields>>;

const STARTING_VALUES: ValuesById = Object.fromEntries(
  pastActionRows.map((row) => [row.id, rowValues(row)]),
);

const phiValue = (value: string | null) => ({
  value,
  updatedBy: "phi@us_id.gov",
  updatedAt: new Date("2026-11-02T15:00:00Z"),
});

/** Builds the section input the report would hold for these rows. */
function toInput(valuesById: ValuesById): PastActionsInput {
  return {
    rows: Object.fromEntries(
      Object.entries(valuesById).map(([id, { date, notes }]) => [
        id,
        {
          source: "PHI",
          fields: { date: phiValue(date), notes: phiValue(notes) },
        },
      ]),
    ),
  };
}

/**
 * Past Actions backed by local state, so Add, Edit, and Remove work as they
 * would against the report.
 */
function PastActionsList({
  mode,
  startEmpty = false,
  addIn,
}: {
  mode: ParoleBoardReportMode;
  startEmpty?: boolean;
  addIn?: "MODAL" | "INLINE";
}) {
  const [valuesById, setValuesById] = useState<ValuesById>(
    startEmpty ? {} : STARTING_VALUES,
  );

  return (
    <div style={{ width: 760, padding: 24 }}>
      <ReportRowList
        mode={mode}
        rows={resolvePastActions(toInput(valuesById)).rows}
        columns={pastActionColumns}
        itemName="Past Action"
        emptyState="No past actions entered"
        onSave={async (rowId, changes) =>
          setValuesById((current) => ({
            ...current,
            [rowId]: {
              ...(current[rowId] ?? { date: null, notes: null }),
              ...changes,
            },
          }))
        }
        onRemove={(row) => {
          const removed = valuesById[row.id];
          setValuesById((current) =>
            Object.fromEntries(
              Object.entries(current).filter(([id]) => id !== row.id),
            ),
          );
          return {
            done: Promise.resolve(),
            undo: async () =>
              setValuesById((current) => ({ ...current, [row.id]: removed })),
          };
        }}
        addIn={addIn}
      />
      <StyledToaster />
    </div>
  );
}

export const EditMode = () => <PastActionsList mode="EDIT" />;

/** Add opens a new row in the table, as Substance Use's does. */
export const InlineAdd = () => <PastActionsList mode="EDIT" addIn="INLINE" />;

export const ReadMode = () => <PastActionsList mode="READ" />;

export const EmptyList = () => <PastActionsList mode="EDIT" startEmpty />;

export const EmptyReadMode = () => <PastActionsList mode="READ" startEmpty />;

/**
 * Removes the first row as the example loads, so the row is gone and the
 * undo toast shows. Undo brings the row back.
 */
export const RowJustRemoved = () => {
  useEffect(() => {
    document
      .querySelector<HTMLButtonElement>('[aria-label="Remove Past Action"]')
      ?.click();
  }, []);
  return <PastActionsList mode="EDIT" />;
};
