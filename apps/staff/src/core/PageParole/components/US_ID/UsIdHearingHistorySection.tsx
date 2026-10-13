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

import { ParoleHearingHistoryEntry } from "~datatypes";
import { palette } from "~design-system";

import { formatMonthYearNumeric, Hr } from "../shared";
import {
  UsIdSectionCard,
  UsIdSectionTitle,
  UsIdSubsectionCaption,
} from "./UsIdCaseProfileStyles";

const EMPTY_STATE_TEXT = "No hearing history on record";

const HearingList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.lg)};
  margin: 0;
  padding: 0;
  list-style: none;
`;

const HearingItem = styled.li`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.lg)};
`;

const HearingDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.sm)};
`;

const HearingDate = styled.div`
  ${typography.Sans12}
  color: ${palette.slate85};
`;

const HearingType = styled.div`
  ${typography.Sans16}
  font-weight: 600;
  color: ${palette.pine2};
`;

const HearingDecision = styled.div`
  ${typography.Sans14}
  color: ${palette.text.primary};
`;

/**
 * US_ID's Hearing History card: one entry per hearing the Board already held,
 * with the month it took place, its type, and the decision. Shows an empty
 * state when the case has no held hearings.
 *
 * @param hearingHistory - The case's held hearings, in the order to show them.
 */
export function UsIdHearingHistorySection({
  hearingHistory,
}: {
  hearingHistory: Array<ParoleHearingHistoryEntry>;
}) {
  if (!hearingHistory.length) {
    return (
      <UsIdSectionCard>
        <UsIdSectionTitle>Hearing History</UsIdSectionTitle>
        <UsIdSubsectionCaption>{EMPTY_STATE_TEXT}</UsIdSubsectionCaption>
      </UsIdSectionCard>
    );
  }

  return (
    <UsIdSectionCard>
      <UsIdSectionTitle>Hearing History</UsIdSectionTitle>
      <HearingList>
        {hearingHistory.map((hearing, index) => (
          <HearingItem
            key={`${hearing.hearingDate}-${hearing.hearingType}-${hearing.hearingSubtype}-${hearing.hearingDecision}`}
          >
            <HearingDetails>
              <HearingDate>
                {formatMonthYearNumeric(hearing.hearingDate)}
              </HearingDate>
              <HearingType>{hearing.hearingType}</HearingType>
              {hearing.hearingDecision && (
                <HearingDecision>{hearing.hearingDecision}</HearingDecision>
              )}
            </HearingDetails>
            {index < hearingHistory.length - 1 && <Hr />}
          </HearingItem>
        ))}
      </HearingList>
    </UsIdSectionCard>
  );
}
