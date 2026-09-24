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
  isParoleUnknownDate,
  PAROLE_UNKNOWN_TEXT,
  ParoleConductRecord,
} from "~datatypes";
import { Icon, palette } from "~design-system";

import { PaletteKey, WorkflowsBadgePill } from "../../../BadgePill/BadgePill";
import { DialogModal } from "../../../DialogModal";
import { conductClassificationPalette } from "../ConductRecordCard";
import {
  FactRow,
  FactRowStack,
  FactValue,
  formatDate,
  MutedText,
} from "../shared";

const StyledDialogModal = styled(DialogModal)`
  .ReactModal__Content {
    max-width: 90vw;
    padding: 0;
    width: ${rem(768)};
  }
`;

const ModalHeader = styled.div`
  align-items: center;
  border-bottom: 1px solid ${palette.slate20};
  display: flex;
  justify-content: space-between;
  padding: ${rem(spacing.lg)} ${rem(40)};
`;

const ModalTitle = styled.h2`
  ${typography.Sans16}
  color: ${palette.slate80};
  font-weight: 500;
  margin: 0;
`;

const CloseButton = styled.button.attrs({ type: "button" })`
  align-items: center;
  background: transparent;
  border: 0;
  color: ${palette.slate60};
  cursor: pointer;
  display: flex;
  padding: 0;
`;

const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.lg)};
  padding: ${rem(spacing.xl)} ${rem(40)};
`;

const FullNarrative = styled.div`
  ${typography.Sans14}
  color: ${palette.pine1};
  line-height: 1.6;
  white-space: pre-wrap;
`;

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
    <StyledDialogModal
      isOpen={report !== undefined}
      onRequestClose={onRequestClose}
      aria={{ labelledby: "us-id-dor-modal-title" }}
    >
      <ModalHeader>
        <ModalTitle id="us-id-dor-modal-title">
          Disciplinary Offense Report
        </ModalTitle>
        <CloseButton onClick={onRequestClose} aria-label="Close">
          <Icon kind="Close" size={20} />
        </CloseButton>
      </ModalHeader>
      {report && (
        <ModalBody>
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
                text={report.severity}
                palette={conductClassificationPalette(
                  conductClassificationColors,
                  report.severity,
                )}
              />
            </FactRowStack>
          </FactRow>
          <FullNarrative>{report.description}</FullNarrative>
        </ModalBody>
      )}
    </StyledDialogModal>
  );
}
