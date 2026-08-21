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

import { Chip } from "../Chip/Chip";
import {
  BodyText,
  Disclaimer,
  FooterWrapper,
  LabelDescription,
  LabelItem,
  Section,
  SectionHeading,
} from "./Footer.styles";

export interface FooterContent {
  aboutHeading: string;
  aboutBody: string;
  labelsHeading: string;
  serviceLabels: { label: string; description: string }[];
  disclaimerLabel: string;
  disclaimer: string;
}

export function Footer({ content }: { content: FooterContent }) {
  const {
    aboutHeading,
    aboutBody,
    labelsHeading,
    serviceLabels,
    disclaimerLabel,
    disclaimer,
  } = content;

  return (
    <FooterWrapper>
      <Section>
        <SectionHeading>{aboutHeading}</SectionHeading>
        <BodyText>{aboutBody}</BodyText>
      </Section>

      <Section>
        <SectionHeading>{labelsHeading}</SectionHeading>
        {serviceLabels.map(({ label, description }) => (
          <LabelItem key={label}>
            <Chip inverted>{label}</Chip>
            <LabelDescription>{description}</LabelDescription>
          </LabelItem>
        ))}
      </Section>

      <Disclaimer>
        <strong>{disclaimerLabel}</strong> {disclaimer}
      </Disclaimer>
    </FooterWrapper>
  );
}
