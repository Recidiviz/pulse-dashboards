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

import { ContactRowList } from "./ContactInformation.styles";
import { ContactRow } from "./ContactRow";
import { ContactRow as ContactRowData } from "./utils";

type ContactInformationProps = {
  rows: ContactRowData[];
};

export const ContactInformation: FC<ContactInformationProps> = ({ rows }) => (
  <ContactRowList>
    {rows.map(({ key, label, value }) => (
      <ContactRow key={key} label={label} value={value} />
    ))}
  </ContactRowList>
);
