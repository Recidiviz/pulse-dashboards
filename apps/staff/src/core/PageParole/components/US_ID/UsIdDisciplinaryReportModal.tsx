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

import {
  isParoleUnknownDate,
  PAROLE_UNKNOWN_TEXT,
  ParoleConductRecord,
} from "~datatypes";

import { PaletteKey, WorkflowsBadgePill } from "../../../BadgePill/BadgePill";
import { conductClassificationPalette } from "../ConductRecordCard";
import {
  ParoleRecordModal,
  ParoleRecordModalNarrative,
} from "../ParoleRecordModal";
import {
  FactRow,
  FactRowStack,
  FactValue,
  formatDate,
  MutedText,
} from "../shared";

/**
 * Returns the report's severity class, with "(Pending)" appended while the
 * report awaits a decision.
 */
export const dorSeverityLabel = ({
  severity,
  isPending,
}: ParoleConductRecord): string =>
  isPending ? `${severity} (Pending)` : severity;

/**
 * The whole of one disciplinary report. The card behind it clips the
 * narrative to a few lines, so this is where a reader sees all of it.
 *
 * @param report - The report to show, or undefined when none is selected.
 * @param conductClassificationColors - Badge palette per severity class.
 * @param onRequestClose - Closes the modal.
 */
export function UsIdDisciplinaryReportModal({
  report,
  conductClassificationColors,
  onRequestClose,
}: {
  report: ParoleConductRecord | undefined;
  conductClassificationColors: Record<string, PaletteKey>;
  onRequestClose: () => void;
}) {
  return (
    <ParoleRecordModal
      isOpen={report !== undefined}
      title="Disciplinary Offense Report"
      onRequestClose={onRequestClose}
    >
      {report && (
        <>
          <FactRow>
            <FactRowStack>
              <MutedText>Date</MutedText>
              <FactValue>
                {isParoleUnknownDate(report.date)
                  ? PAROLE_UNKNOWN_TEXT
                  : formatDate(report.date)}
              </FactValue>
            </FactRowStack>
            <FactRowStack>
              <MutedText>Offense</MutedText>
              <FactValue>{report.violation}</FactValue>
            </FactRowStack>
            <FactRowStack>
              <MutedText>Institution</MutedText>
              <FactValue>{report.facility}</FactValue>
            </FactRowStack>
            <FactRowStack>
              <WorkflowsBadgePill
                text={dorSeverityLabel(report)}
                palette={conductClassificationPalette(
                  conductClassificationColors,
                  report.severity,
                )}
              />
            </FactRowStack>
          </FactRow>
          <ParoleRecordModalNarrative>
            {report.description}
          </ParoleRecordModalNarrative>
        </>
      )}
    </ParoleRecordModal>
  );
}
