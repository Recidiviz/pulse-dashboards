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

import type { MonthCounts } from "~@parole-board/common";
import { Callout } from "~@parole-board/common";
import { pluralize } from "~utils";

import { CountsTable, Section, WarningList } from "./PublishMonthModal.styles";

/** An entry that falls on a state holiday. */
export interface PublishHolidayWarning {
  /** The entry's id, used only as the row's key. */
  id: string;
  /** The entry's label, such as "FCF". */
  label: string;
  /** The entry's date as it reads, such as "September 7". */
  dateLabel: string;
  holidayName: string;
}

export interface PublishSummaryProps {
  counts: MonthCounts;
  holidayWarnings: PublishHolidayWarning[];
}

/**
 * The counts the editor is about to publish and the entries that fall on a
 * state holiday. Holidays warn but never block publishing. The counts
 * table matches the publish modal in the Calendar Unit Dashboard design; the
 * design has no holiday warning.
 */
export function PublishSummary({
  counts,
  holidayWarnings,
}: PublishSummaryProps) {
  const warningCount = holidayWarnings.length;

  return (
    <>
      <CountsTable>
        <tbody>
          <tr>
            <th scope="row">Hearing days</th>
            <td>{counts.entryDays}</td>
          </tr>
          <tr>
            <th scope="row">Hearings scheduled</th>
            <td>{counts.entryCount}</td>
          </tr>
        </tbody>
      </CountsTable>

      {warningCount > 0 && (
        <Section>
          <Callout
            tone="warning"
            live={false}
            title={`${pluralize(warningCount, "item")} ${
              warningCount === 1 ? "falls" : "fall"
            } on a state holiday`}
          >
            <WarningList>
              {holidayWarnings.map(({ id, label, dateLabel, holidayName }) => (
                <li key={id}>{`${label} · ${dateLabel} · ${holidayName}`}</li>
              ))}
            </WarningList>
          </Callout>
        </Section>
      )}
    </>
  );
}
