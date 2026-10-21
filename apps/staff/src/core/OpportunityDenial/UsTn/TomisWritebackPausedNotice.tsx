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
import { type ReactElement } from "react";
import styled from "styled-components";

import { palette } from "~design-system";

// Shown while usTnTomisWritebackPaused is on, from the TOMIS 1.0 shutoff until
// the TOMIS 2.0 contact note writeback goes live.
export const TOMIS_WRITEBACK_PAUSED_COPY = {
  denialCodes:
    "Submitting denial comments to TOMIS is temporarily disabled starting October 23 until the TOMIS 2.0 migration is complete. Please mark the user ineligible by selecting the denial reason and snooze period, and manually enter the denial comments into TOMIS 2.0.",
  reioNote:
    "Submitting referral notes to TOMIS is temporarily disabled starting October 23 until the TOMIS 2.0 migration is complete. Please download the form and manually enter the referral note into TOMIS 2.0.",
  tepeNote:
    "Submitting TEPE notes to TOMIS is temporarily disabled starting October 23 until the TOMIS 2.0 migration is complete. Please review the note as data may be outdated and copy the note manually into TOMIS 2.0.",
} as const;

const Notice = styled.div`
  ${typography.Sans14}
  color: ${palette.pine2};
  background-color: #fff5f5;
  border-left: ${rem(spacing.xs)} solid #e00e00;
  padding: ${rem(spacing.md)};
  margin: ${rem(spacing.sm)} 0 ${rem(spacing.md)};
  text-align: left;
`;

export function TomisWritebackPausedNotice({
  message,
}: {
  message: string;
}): ReactElement {
  return (
    <Notice role="status" data-testid="tomis-writeback-paused-notice">
      {message}
    </Notice>
  );
}
