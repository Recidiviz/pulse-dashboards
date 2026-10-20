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

import { spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import styled, { css } from "styled-components";

import { PaletteKey, WorkflowsBadgePill } from "../../BadgePill/BadgePill";
import {
  PAROLE_RECORD_CORNER_RADIUS,
  ParoleFactLabel,
  ParoleFactStack,
  paroleRecordCardStyles,
  ParoleSmallFactValue,
} from "./ParoleCaseProfileStyles";
import { FactRow } from "./shared";

/**
 * Box around one disciplinary record: a bordered, unfilled card. A css block
 * rather than a component, so a record that opens on click can put it on a
 * button.
 */
export const paroleDisciplinaryRecordStyles = css`
  ${paroleRecordCardStyles}
  background-color: transparent;
  border-radius: ${PAROLE_RECORD_CORNER_RADIUS};
  width: 100%;
`;

/** A disciplinary record that does nothing when clicked. */
export const ParoleDisciplinaryRecord = styled.div`
  ${paroleDisciplinaryRecordStyles}
`;

const RecordHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${rem(spacing.md)};
`;

const RecordFacts = styled(FactRow)<{ $shouldKeepOnOneLine: boolean }>`
  flex: 1;
  min-width: 0;
  ${({ $shouldKeepOnOneLine }) => $shouldKeepOnOneLine && "flex-wrap: nowrap;"}
`;

const RecordFact = styled(ParoleFactStack)`
  flex: 0 1 ${rem(220)};
  min-width: 0;
  overflow-wrap: anywhere;
`;

export type ParoleDisciplinaryRecordFact = {
  label: string;
  value: string;
};

/**
 * The top row of a disciplinary record: its facts side by side, with the
 * severity badge on the right.
 *
 * @param facts - Label and value of each fact, in display order.
 * @param badgeText - Text of the severity badge.
 * @param badgePalette - Color of the severity badge.
 * @param shouldKeepFactsOnOneLine - Whether the facts share one row, shrinking
 *   and wrapping their values to fit, instead of wrapping onto a second row.
 */
export function ParoleDisciplinaryRecordHeader({
  facts,
  badgeText,
  badgePalette,
  shouldKeepFactsOnOneLine,
}: {
  facts: ReadonlyArray<ParoleDisciplinaryRecordFact>;
  badgeText: string;
  badgePalette: PaletteKey;
  shouldKeepFactsOnOneLine: boolean;
}) {
  return (
    <RecordHeader>
      <RecordFacts $shouldKeepOnOneLine={shouldKeepFactsOnOneLine}>
        {facts.map((fact) => (
          <RecordFact key={fact.label}>
            <ParoleFactLabel>{fact.label}</ParoleFactLabel>
            <ParoleSmallFactValue>{fact.value}</ParoleSmallFactValue>
          </RecordFact>
        ))}
      </RecordFacts>
      <WorkflowsBadgePill text={badgeText} palette={badgePalette} />
    </RecordHeader>
  );
}
