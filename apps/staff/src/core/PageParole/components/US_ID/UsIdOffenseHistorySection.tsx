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

import { ParoleCase, ParoleOffense } from "~datatypes";
import { palette } from "~design-system";

import { SectionCardHeader } from "../../../SectionCard";
import { PaddedSectionCardBody } from "../PaddedSectionCardBody";
import {
  FactRow,
  FactRowStack,
  formatDateLong,
  formatDateNumeric,
  SectionCard,
  SectionStack,
  SubsectionTitle,
} from "../shared";

// Shown for a date or date range that Idaho has not recorded on the offense yet.
const EMPTY_PLACEHOLDER = "----";

const OffenseCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.lg)};
  background-color: ${palette.marble2};
  border: 1px solid ${palette.slate10};
  border-radius: ${rem(4)};
  padding: ${rem(spacing.lg)};
`;

const OffenseHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  column-gap: ${rem(spacing.md)};
  row-gap: ${rem(spacing.xs)};
`;

const OffenseHeading = styled.div`
  ${typography.Sans16}
  font-weight: 600;
  color: ${palette.pine1};
`;

const OffenseStatute = styled.span`
  ${typography.Sans14}
  font-weight: 400;
  color: ${palette.slate70};
  margin-left: 0.5rem;
`;

const MutedText = styled.div`
  ${typography.Sans14}
  color: ${palette.slate70};
`;

const FactValue = styled.div`
  ${typography.Sans14}
  color: ${palette.pine1};
`;

const OffenseFact = styled(FactRowStack)`
  flex: 0 1 ${rem(164)};
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
    <SectionCard>
      <SectionCardHeader>Offense Information</SectionCardHeader>
      <PaddedSectionCardBody>
        <div>
          <SubsectionTitle>Instant Offenses</SubsectionTitle>
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
                  <OffenseHeader>
                    <OffenseHeading>
                      {offense.conviction}
                      {offense.statute && (
                        <OffenseStatute>§{offense.statute}</OffenseStatute>
                      )}
                    </OffenseHeading>
                    <MutedText>Case # {offense.docket}</MutedText>
                  </OffenseHeader>
                  <FactRow>
                    {facts.map((fact) => (
                      <OffenseFact key={fact.label}>
                        <MutedText>{fact.label}</MutedText>
                        <FactValue>{fact.value}</FactValue>
                      </OffenseFact>
                    ))}
                  </FactRow>
                </OffenseCard>
              );
            })}
          </SectionStack>
        </div>
      </PaddedSectionCardBody>
    </SectionCard>
  );
}
