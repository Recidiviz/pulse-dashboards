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

import { FC } from "react";

import type { ContactRow } from "../../hooks/types";
import {
  ContactRowList,
  ContactSectionHeading,
  HowToReachSection,
} from "./ContactInformation.styles";
import { ContactRow as ContactRowItem } from "./ContactRow";

type GeneralContactSectionProps = {
  heading: string;
  rows: ContactRow[];
};

export const GeneralContactSection: FC<GeneralContactSectionProps> = ({
  heading,
  rows,
}) => (
  <HowToReachSection>
    <ContactSectionHeading>{heading}</ContactSectionHeading>
    <ContactRowList>
      {rows.map((row) => (
        <ContactRowItem key={row.key} label={row.label} value={row.value} />
      ))}
    </ContactRowList>
  </HowToReachSection>
);
