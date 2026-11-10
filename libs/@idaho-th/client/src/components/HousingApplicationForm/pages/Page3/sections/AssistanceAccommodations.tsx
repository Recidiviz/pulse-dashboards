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
import { ACCOMMODATIONS_OPTIONS } from "../../../constants/fieldOptions";
import { PAPER_FORM_FIELD_LABELS } from "../../../constants/paperFormFieldLabels";
import {
  MultiSelectDropdown,
  TextArea,
  TextInput,
} from "../../../Form/Elements";
import * as Styled from "../../../HousingApplicationForm.styles";

export const AssistanceAccommodations: React.FC = () => {
  return (
    <Styled.Section>
      <Styled.SubsectionTitle>
        <BodyS2>Assistance Accommodations</BodyS2>
      </Styled.SubsectionTitle>
      <Styled.ColumnGroup>
        <Styled.FullWidthRow>
          <MultiSelectDropdown
            name={FIELD_KEYS.accommodations}
            label={PAPER_FORM_FIELD_LABELS.accommodations}
            options={ACCOMMODATIONS_OPTIONS}
          />
        </Styled.FullWidthRow>
        <Styled.Row>
          <TextInput
            name={FIELD_KEYS.otherAccommodations}
            label={PAPER_FORM_FIELD_LABELS.otherAccommodations}
          />
        </Styled.Row>
        <Styled.FullWidthRow>
          <TextArea
            name={FIELD_KEYS.accommodationsInfo}
            label={PAPER_FORM_FIELD_LABELS.accommodationsInfo}
          />
        </Styled.FullWidthRow>
      </Styled.ColumnGroup>
    </Styled.Section>
  );
};
