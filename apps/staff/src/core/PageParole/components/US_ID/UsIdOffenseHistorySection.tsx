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

import { rem } from "polished";
import styled from "styled-components";

import { ParoleCase, ParoleOffense } from "~datatypes";

import {
  ParoleFactLabel,
  ParoleFactStack,
  paroleRecordCardStyles,
  ParoleRecordHeader,
  ParoleRecordHeaderDetail,
  ParoleRecordHeading,
  ParoleSectionCard,
  ParoleSectionTitle,
  ParoleSmallFactValue,
  ParoleSubsection,
  ParoleSubsectionTitle,
} from "../ParoleCaseProfileStyles";
import {
  FactRow,
  formatDateLong,
  formatDateNumeric,
  SectionStack,
} from "../shared";

// Shown for a date or date range that Idaho has not recorded on the offense yet.
const EMPTY_PLACEHOLDER = "----";

const OffenseCard = styled.div`
  ${paroleRecordCardStyles}
`;

const OffenseFact = styled(ParoleFactStack)`
  flex: 0 0 auto;
  min-width: ${rem(164)};
`;

const LIFE = "Life";

const formatDateOrPlaceholder = (date: string | undefined): string =>
  date ? formatDateLong(date) : EMPTY_PLACEHOLDER;

const formatFullTerm = (offense: ParoleOffense): string =>
  offense.isLife ? LIFE : formatDateOrPlaceholder(offense.fullTermDate);

/**
 * A span running to a date, or to "Life" where the sentence has no end. A
 * life sentence still shows when it began, so the row reads as a real span
 * rather than a placeholder.
 *
 * @param start - First day of the span.
 * @param end - Last day, absent on a life sentence.
 * @param isLife - Whether the sentence runs for life.
 */
const formatSpan = (
  start: string | undefined,
  end: string | undefined,
  isLife: boolean | undefined,
): string => {
  if (!start) return EMPTY_PLACEHOLDER;
  if (isLife) return `${formatDateNumeric(start)} - ${LIFE}`;
  return formatDateRangeOrPlaceholder(start, end);
};

// Both spans on the card are open-ended until their end date is known, so a
// range renders only when both of its bounds are present.
const formatDateRangeOrPlaceholder = (
  start: string | undefined,
  end: string | undefined,
): string =>
  start && end
    ? `${formatDateNumeric(start)} - ${formatDateNumeric(end)}`
    : EMPTY_PLACEHOLDER;

/**
 * US_ID-specific Offense Information section. Contains a card for each offense,
 * showing the conviction, its statute, and its case number, over a row of four sentencing facts.
 *
 * Each fact is either a date or a date range, or a placeholder if the date(s) are unknown.
 *
 * @param caseDetail - The case whose offenses to show.
 */
export function UsIdOffenseHistorySection({
  caseDetail,
}: {
  caseDetail: ParoleCase;
}) {
  return (
    <ParoleSectionCard>
      <ParoleSectionTitle>Offense Information</ParoleSectionTitle>
      <ParoleSubsection>
        <ParoleSubsectionTitle>Instant Offenses</ParoleSubsectionTitle>
        <SectionStack>
          {caseDetail.offenseHistory.offenses.map((offense) => {
            const facts: Array<{ label: string; value: string }> = [
              {
                label: "Parole Elig.",
                value: formatDateOrPlaceholder(offense.paroleEligibilityDate),
              },
              {
                label: "Full Term",
                value: formatFullTerm(offense),
              },
              {
                label: "Sent. Length",
                value: formatSpan(
                  offense.sentenceStartDate,
                  offense.fullTermDate,
                  offense.isLife,
                ),
              },
              {
                label: "Indeterm. Length",
                value: formatSpan(
                  offense.indeterminateStartDate,
                  offense.indeterminateEndDateInclusive,
                  offense.isLife,
                ),
              },
            ];

            return (
              <OffenseCard key={`${offense.docket}-${offense.conviction}`}>
                <ParoleRecordHeader>
                  <ParoleRecordHeading>
                    {offense.conviction}
                    {offense.statute && (
                      <ParoleRecordHeaderDetail as="span">
                        §{offense.statute}
                      </ParoleRecordHeaderDetail>
                    )}
                  </ParoleRecordHeading>
                  <ParoleRecordHeaderDetail>
                    Case # {offense.docket}
                  </ParoleRecordHeaderDetail>
                </ParoleRecordHeader>
                <FactRow>
                  {facts.map((fact) => (
                    <OffenseFact key={fact.label}>
                      <ParoleFactLabel>{fact.label}</ParoleFactLabel>
                      <ParoleSmallFactValue>{fact.value}</ParoleSmallFactValue>
                    </OffenseFact>
                  ))}
                </FactRow>
              </OffenseCard>
            );
          })}
        </SectionStack>
      </ParoleSubsection>
    </ParoleSectionCard>
  );
}
