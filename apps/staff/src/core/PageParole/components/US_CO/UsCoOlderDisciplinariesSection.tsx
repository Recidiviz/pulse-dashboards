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
import { useState } from "react";
import styled from "styled-components";

import { ParoleCase } from "~datatypes";
import { Icon, IconSVG, palette } from "~design-system";

import type { ParoleConfig } from "../../../models/types";
import { ConductRecordCard } from "../ConductRecordCard";
import {
  DEFAULT_CONDUCT_HISTORY_YEARS,
  partitionConductHistoryByRecency,
  SectionStack,
} from "../shared";

const ToggleButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${rem(spacing.xs)};
  background: none;
  border: none;
  padding: 0;
  color: ${palette.slate70};
  font-weight: 600;
  cursor: pointer;

  svg {
    transition: transform 150ms;
  }

  &[aria-expanded="true"] svg {
    transform: rotate(180deg);
  }
`;

// Referenced by the ToggleButton's aria-controls so assistive tech can
// associate the toggle with the region it reveals.
const OLDER_DISCIPLINARIES_ID = "conduct-history-older-disciplinaries";

export function UsCoOlderDisciplinariesSection({
  caseDetail,
  config,
}: {
  caseDetail: ParoleCase;
  config: ParoleConfig;
}) {
  const [showOlder, setShowOlder] = useState(false);
  // Same window the section itself uses, so the records it hides are
  // exactly the ones this toggle reveals.
  const { olderRecords } = partitionConductHistoryByRecency(
    caseDetail.conductHistory,
    config.conductHistory.visibleYears ?? DEFAULT_CONDUCT_HISTORY_YEARS,
  );

  if (olderRecords.length === 0) return null;

  return (
    <>
      <ToggleButton
        type="button"
        aria-expanded={showOlder}
        aria-controls={OLDER_DISCIPLINARIES_ID}
        onClick={() => setShowOlder((prev) => !prev)}
      >
        <Icon kind={IconSVG.Caret} width={10} aria-hidden="true" />
        See Older Disciplinaries ({olderRecords.length})
      </ToggleButton>
      {showOlder && (
        <SectionStack id={OLDER_DISCIPLINARIES_ID}>
          {olderRecords.map((record, idx) => (
            <ConductRecordCard
              // eslint-disable-next-line react/no-array-index-key
              key={`${record.date}-${record.violation}-${idx}`}
              record={record}
              conductClassificationColors={
                config.conductHistory.classificationColors
              }
            />
          ))}
        </SectionStack>
      )}
    </>
  );
}
