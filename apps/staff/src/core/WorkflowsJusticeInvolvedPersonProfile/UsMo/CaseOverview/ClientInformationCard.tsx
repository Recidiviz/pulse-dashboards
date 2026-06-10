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

import { UsMoClientMetadata } from "~datatypes";
import { palette, typography } from "~design-system";

import { toTitleCase } from "../../../../utils";
import {
  buildAddressLines,
  formatDob,
  formatSentence,
  type StructuredAddress,
} from "./utils";

export type { StructuredAddress };

export type ClientInformationCardProps = {
  // Personal Details
  sex: string;
  birthdate?: Date;
  latestCycleSentences: UsMoClientMetadata["latestCycleSentences"];
  // Housing
  address?: StructuredAddress;
  // Custom styles
  className?: string;
};

/** Placeholder shown when a field is missing. */
const EMPTY_PLACEHOLDER = "N/A";

/** Bordered frame for the card. Tokens come from Figma node 7432-2685:
 * 1px solid border at rgba(43,84,105,0.2), 4px rounded corners. The
 * "Case Overview" section heading sits above this card and is owned by the
 * parent layout (`UsMoCaseOverview`). */
const CardFrame = styled.div`
  background: ${palette.white};
  border: 1px solid ${palette.slate20};
  border-radius: ${rem(4)};
  display: flex;
  flex-direction: column;
  overflow: hidden;
  width: 100%;

  /* Divider between adjacent sections (Personal Details → Housing → …). */
  & > section + section {
    border-top: 1px solid ${palette.slate20};
  }
`;

// Section primitives for the US_MO Case Overview cards. Tokens come from
// Figma node 7364-3879 / 7432-2685.
const Section = styled.section`
  display: flex;
  flex-direction: column;
  padding: ${rem(16)};
  width: 100%;
`;

const SectionHeading = styled.h3`
  color: ${palette.slate60};
  ${typography.Sans14}
  letter-spacing: -0.01em;
  line-height: 1.2;
  margin: 0 0 ${rem(8)};
  padding-right: ${rem(16)};
`;

const Row = styled.div`
  display: flex;
  flex-direction: column;
  font-size: ${rem(12)};
  font-weight: 500;
  gap: ${rem(8)};
  letter-spacing: -0.01em;
  line-height: 1.2;
  padding: ${rem(8)} ${rem(16)} ${rem(8)} 0;
`;

const Label = styled.div`
  ${typography.Sans12}
  color: ${palette.pine1};
`;

const Value = styled.div.attrs({ className: "fs-exclude" })`
  ${typography.Sans12}
  color: ${palette.slate85};
  display: flex;
  flex-direction: column;
  gap: ${rem(2)};
`;

/**
 * Presentational card rendering the US_MO client information sections inside
 * a bordered "Client Information" frame — currently Personal Details + Housing
 * (Reports is out of scope for OBT-29091 and lands later). Takes plain props
 * — no data fetching, no state — so it is trivially exercised by unit tests.
 * The outer "Case Overview" section heading and the full-column layout are
 * the parent's responsibility (`UsMoCaseOverview`).
 */
export const ClientInformationCard = ({
  className,
  sex,
  birthdate,
  latestCycleSentences,
  address,
}: ClientInformationCardProps) => {
  const formattedSex = toTitleCase(sex);
  const addressLines = buildAddressLines(address);

  return (
    <CardFrame className={className}>
      <Section aria-labelledby="personal-details-heading">
        <SectionHeading id="personal-details-heading">
          Personal Details
        </SectionHeading>

        <Row>
          <Label>Gender</Label>
          <Value>{formattedSex || EMPTY_PLACEHOLDER}</Value>
        </Row>

        <Row>
          <Label>DOB</Label>
          <Value>{birthdate ? formatDob(birthdate) : EMPTY_PLACEHOLDER}</Value>
        </Row>

        <Row>
          <Label>Offenses</Label>
          <Value>
            {latestCycleSentences.length === 0
              ? EMPTY_PLACEHOLDER
              : latestCycleSentences.map((sentence, index) => (
                  // No stable id; rendered statically from a server-sourced
                  // array and not reordered client-side.
                  // eslint-disable-next-line react/no-array-index-key
                  <div key={index}>{formatSentence(sentence)}</div>
                ))}
          </Value>
        </Row>
      </Section>

      <Section aria-labelledby="housing-heading">
        <SectionHeading id="housing-heading">Housing</SectionHeading>

        <Row>
          <Label>Address</Label>
          <Value>
            {addressLines.length === 0
              ? EMPTY_PLACEHOLDER
              : addressLines.map((line, index) => (
                  // No stable id; rendered statically from a structured
                  // address object.
                  // eslint-disable-next-line react/no-array-index-key
                  <div key={index}>{line}</div>
                ))}
          </Value>
        </Row>
      </Section>
    </CardFrame>
  );
};

export default ClientInformationCard;
