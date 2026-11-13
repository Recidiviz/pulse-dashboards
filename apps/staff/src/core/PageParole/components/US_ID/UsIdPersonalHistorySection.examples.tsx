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

import { omit } from "lodash";
import { useEffect, useState } from "react";

import { PersonalHistoryInput } from "~datatypes";

import StyledToaster from "../../../../components/StyledToaster";
import { ParoleBoardReportMode } from "../../../../ParoleStore/presenters/ParoleBoardReportPresenter";
import { resolvePersonalHistory } from "../../../../ParoleStore/report/personalHistory";
import { UsIdPersonalHistorySection } from "./UsIdPersonalHistorySection";

// Required by the custom CSF indexer. Title auto-derives from the file path.
export default {};

type Rows = NonNullable<PersonalHistoryInput["rows"]>;
type RowFields = NonNullable<Rows[string]["fields"]>;

const phiValue = <T,>(value: T) => ({
  value,
  updatedBy: "phi@us_id.gov",
  updatedAt: new Date("2026-11-12T15:00:00Z"),
});

const STARTING_INPUT: PersonalHistoryInput = {
  fields: {
    socialHistory: phiValue(
      "Grew up in a small farming town, the second of four children.",
    ),
    education: phiValue(
      "Left high school in the 11th grade and earned a GED while incarcerated.",
    ),
  },
  rows: {
    phi_1793800000000_a1b2c3d4: {
      source: "PHI",
      fields: {
        substance: phiValue("Alcohol"),
        ageOfFirstUse: phiValue(15),
        lastUse: phiValue("2023-10"),
        heaviestUse: phiValue("Most weekends, for several years"),
      },
    },
    phi_1793800060000_e5f6a7b8: {
      source: "PHI",
      fields: {
        substance: phiValue("Methamphetamine"),
        ageOfFirstUse: phiValue(19),
      },
    },
  },
};

/**
 * Personal History backed by local state, so the boxes and the substance
 * table save, edit, and remove as they would against the report.
 */
function PersonalHistory({
  mode,
  startEmpty = false,
}: {
  mode: ParoleBoardReportMode;
  startEmpty?: boolean;
}) {
  const [input, setInput] = useState<PersonalHistoryInput>(
    startEmpty ? {} : STARTING_INPUT,
  );

  return (
    <div style={{ width: 1000, padding: 24 }}>
      <UsIdPersonalHistorySection
        mode={mode}
        history={resolvePersonalHistory(input)}
        onSave={async (field, value) =>
          setInput((current) => ({
            ...current,
            fields: { ...current.fields, [field]: phiValue(value) },
          }))
        }
        onSaveSubstance={async (rowId, changes) =>
          setInput((current) => {
            const changedFields = Object.fromEntries(
              Object.entries(changes).map(([name, value]) => [
                name,
                phiValue(value),
              ]),
            ) as RowFields;
            return {
              ...current,
              rows: {
                ...current.rows,
                [rowId]: {
                  source: "PHI",
                  fields: {
                    ...current.rows?.[rowId]?.fields,
                    ...changedFields,
                  },
                },
              },
            };
          })
        }
        onRemoveSubstance={(row) => {
          const removed = input.rows?.[row.id];
          setInput((current) => ({
            ...current,
            rows: omit(current.rows, row.id),
          }));
          return {
            done: Promise.resolve(),
            undo: async () => {
              if (!removed) return;
              setInput((current) => ({
                ...current,
                rows: { ...current.rows, [row.id]: removed },
              }));
            },
          };
        }}
      />
      <StyledToaster />
    </div>
  );
}

export const EditMode = () => <PersonalHistory mode="EDIT" />;

export const NothingEntered = () => <PersonalHistory mode="EDIT" startEmpty />;

/**
 * Opens a new substance row as the example loads, so the row's inputs show,
 * including the Age of First Use dropdown.
 */
export const AddingASubstance = () => {
  useEffect(() => {
    Array.from(document.querySelectorAll("button"))
      .find((button) => button.textContent === "Add")
      ?.click();
  }, []);
  return <PersonalHistory mode="EDIT" />;
};

export const ReadMode = () => <PersonalHistory mode="READ" />;
