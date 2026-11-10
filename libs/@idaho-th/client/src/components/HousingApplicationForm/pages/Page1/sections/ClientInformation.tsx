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

import React from "react";

import { BodyS2 } from "../../../../../styles";
import { FIELD_KEYS } from "../../../constants/fieldKeys";
import { PAPER_FORM_FIELD_LABELS } from "../../../constants/paperFormFieldLabels";
import {
  DateField,
  DigitsInput,
  PhoneInput,
  TextInput,
} from "../../../Form/Elements";
import * as Styled from "../../../HousingApplicationForm.styles";

export const ClientInformation: React.FC = () => {
  return (
    <Styled.Section>
      <Styled.SubsectionTitle>
        <BodyS2>Client Information</BodyS2>
      </Styled.SubsectionTitle>
      <Styled.ColumnGroup>
        <Styled.Row>
          <TextInput
            name={FIELD_KEYS.currentFacilityLocation}
            label={PAPER_FORM_FIELD_LABELS.currentFacilityLocation}
          />
          <PhoneInput
            name={FIELD_KEYS.personalPhoneNumber}
            label={PAPER_FORM_FIELD_LABELS.personalPhoneNumber}
          />
        </Styled.Row>
        <Styled.Row>
          <DateField
            name={FIELD_KEYS.dob}
            label={PAPER_FORM_FIELD_LABELS.dob}
          />
          <DigitsInput
            name={FIELD_KEYS.age}
            label={PAPER_FORM_FIELD_LABELS.age}
            maxDigits={3}
          />
          <TextInput
            name={FIELD_KEYS.ssnLast4}
            label={PAPER_FORM_FIELD_LABELS.ssnLast4}
            maxLength={4}
          />
        </Styled.Row>
      </Styled.ColumnGroup>
    </Styled.Section>
  );
};
