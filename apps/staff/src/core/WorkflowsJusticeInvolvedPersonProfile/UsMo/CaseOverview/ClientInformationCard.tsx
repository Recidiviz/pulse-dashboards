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

import { toTitleCase } from "../../../../utils";
import { Client } from "../../../../WorkflowsStore";
import { LabelValue } from "../shared/LabelValue";
import { CardFrame } from "../shared/styles";
import { SARReports } from "./SARReports";
import { Section, SectionHeading } from "./styles";
import {
  buildAddressLines,
  formatDob,
  formatSentence,
  type StructuredAddress,
} from "./utils";

export type { StructuredAddress };

/** Label-over-value field with the Client Information card's row padding. */
const Row = styled(LabelValue)`
  padding: ${rem(8)} ${rem(16)} ${rem(8)} 0;
`;

export type ClientInformationCardProps = {
  // Personal Details
  client: Client;
  className?: string;
};

/** Placeholder shown when a field is missing. */
const EMPTY_PLACEHOLDER = "N/A";

/**
 * Presentational card rendering the US_MO client information sections inside
 * a bordered "Client Information" frame — currently Personal Details + Housing
 * (Reports is out of scope for OBT-29091 and lands later). Takes plain props
 * — no data fetching, no state — so it is trivially exercised by unit tests.
 * The outer "Case Overview" section heading and the full-column layout are
 * the parent's responsibility (`UsMoCaseOverview`).
 */
export const ClientInformationCard = ({
  client,
  className,
}: ClientInformationCardProps) => {
  const { sex, birthdate, latestCycleSentences } =
    client.metadata as UsMoClientMetadata;
  const address = client.currentPhysicalResidenceAddressStructured;

  const formattedSex = toTitleCase(sex);
  const addressLines = buildAddressLines(address);

  return (
    <CardFrame className={className}>
      <Section aria-labelledby="personal-details-heading">
        <SectionHeading id="personal-details-heading">
          Personal Details
        </SectionHeading>

        <Row label="Gender">{formattedSex || EMPTY_PLACEHOLDER}</Row>

        <Row label="DOB">
          {birthdate ? formatDob(birthdate) : EMPTY_PLACEHOLDER}
        </Row>

        <Row label="Offenses">
          {latestCycleSentences.length === 0
            ? EMPTY_PLACEHOLDER
            : latestCycleSentences.map((sentence, index) => (
                // No stable id; rendered statically from a server-sourced
                // array and not reordered client-side.
                // eslint-disable-next-line react/no-array-index-key
                <div key={index}>{formatSentence(sentence)}</div>
              ))}
        </Row>
      </Section>

      <Section aria-labelledby="housing-heading">
        <SectionHeading id="housing-heading">Housing</SectionHeading>

        <Row label="Address">
          {addressLines.length === 0
            ? EMPTY_PLACEHOLDER
            : addressLines.map((line, index) => (
                // No stable id; rendered statically from a structured
                // address object.
                // eslint-disable-next-line react/no-array-index-key
                <div key={index}>{line}</div>
              ))}
        </Row>
      </Section>

      <SARReports clientExternalId={client.externalId} />
    </CardFrame>
  );
};

export default ClientInformationCard;
