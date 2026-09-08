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

import { palette } from "~design-system";

import { SectionCardHeader } from "../../../SectionCard";
import type { OffenseHistorySectionProps } from "../OffenseHistorySection";
import { PaddedSectionCardBody } from "../PaddedSectionCardBody";
import { PAROLE_SECTION_LABELS } from "../ParoleSectionComponents";
import {
  FactLabel,
  FactRow,
  FactRowStack,
  formatDate,
  SectionCard,
  SectionStack,
  SubsectionTitle,
} from "../shared";

// Shown for a date or length that Idaho has not recorded on the offense yet.
const EMPTY_PLACEHOLDER = "----";

// Each offense sits in its own bordered card. A column flex lays out the
// header group and the fact row, so the spacing between them is one `gap`
// rather than per-child margins.
const OffenseCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
  background-color: ${palette.marble2};
  border: 1px solid ${palette.slate10};
  border-radius: ${rem(4)};
  padding: ${rem(spacing.lg)};
`;

// Groups the heading and case number tightly, set apart from the fact row by
// the card's own gap.
const OffenseHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.xs)};
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

const CaseNumber = styled.div`
  ${typography.Sans14}
  color: ${palette.slate70};
`;

const formatDateOrPlaceholder = (date: string | undefined): string =>
  date ? formatDate(date) : EMPTY_PLACEHOLDER;

/**
 * US_ID-specific Offense & Criminal History section. Idaho's design diverges
 * from the generic `OffenseHistorySection`: each offense is a bordered card
 * with a numbered statute header, a case number, and a row of sentencing facts
 * (including the fixed and indeterminate halves of a unified sentence). Wired
 * in through `paroleConfig.offenseHistoryComponent`.
 */
export function UsIdOffenseHistorySection({
  caseDetail,
  config,
}: OffenseHistorySectionProps) {
  return (
    <SectionCard>
      <SectionCardHeader>
        {config.offenseHistoryTitle ?? PAROLE_SECTION_LABELS.offenseHistory}
      </SectionCardHeader>
      <PaddedSectionCardBody>
        <div>
          <SubsectionTitle>Instant Offenses</SubsectionTitle>
          <SectionStack>
            {caseDetail.offenseHistory.offenses.map((offense, index) => {
              const facts: Array<{ label: string; value: string }> = [
                {
                  label: "Sentencing",
                  value: formatDateOrPlaceholder(offense.sentencingDate),
                },
                {
                  label: "Sentence",
                  value: offense.sentence || EMPTY_PLACEHOLDER,
                },
                {
                  label: "Parole elig.",
                  value: formatDateOrPlaceholder(offense.paroleEligibilityDate),
                },
                {
                  label: "Full term",
                  value: formatDateOrPlaceholder(offense.fullTermDate),
                },
                {
                  label: "Fixed Length",
                  value: offense.fixedLength || EMPTY_PLACEHOLDER,
                },
                {
                  label: "Indeterm. Length",
                  value: offense.indeterminateLength || EMPTY_PLACEHOLDER,
                },
              ];

              return (
                <OffenseCard key={`${offense.docket}-${offense.conviction}`}>
                  <OffenseHeader>
                    <OffenseHeading>
                      {index + 1}. {offense.conviction}
                      {offense.statute && (
                        <OffenseStatute>§{offense.statute}</OffenseStatute>
                      )}
                    </OffenseHeading>
                    <CaseNumber>Case # {offense.docket}</CaseNumber>
                  </OffenseHeader>
                  <FactRow>
                    {facts.map((fact) => (
                      <FactRowStack key={fact.label}>
                        <div>{fact.label}</div>
                        <FactLabel>{fact.value}</FactLabel>
                      </FactRowStack>
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
