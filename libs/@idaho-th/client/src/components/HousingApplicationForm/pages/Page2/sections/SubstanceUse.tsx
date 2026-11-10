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
import { TextInput, YesNoSelectField } from "../../../Form/Elements";
import * as Styled from "../../../HousingApplicationForm.styles";

export const SubstanceUse: React.FC = () => {
  return (
    <Styled.Section>
      <Styled.SubsectionTitle>
        <BodyS2>Substance Use</BodyS2>
      </Styled.SubsectionTitle>
      <Styled.ColumnGroup>
        <Styled.FullWidthRow>
          <TextInput
            name={FIELD_KEYS.prescribedMedications}
            label={PAPER_FORM_FIELD_LABELS.prescribedMedications}
          />
        </Styled.FullWidthRow>
        <Styled.Row>
          <YesNoSelectField
            name={FIELD_KEYS.underInfluenceAtCrime}
            label={PAPER_FORM_FIELD_LABELS.underInfluenceAtCrime}
          />
          <YesNoSelectField
            name={FIELD_KEYS.addictions}
            label={PAPER_FORM_FIELD_LABELS.addictions}
          />
        </Styled.Row>
        <Styled.FullWidthRow>
          <TextInput
            name={FIELD_KEYS.substances}
            label={PAPER_FORM_FIELD_LABELS.substances}
          />
          <TextInput
            name={FIELD_KEYS.lastUseDate}
            label={PAPER_FORM_FIELD_LABELS.lastUseDate}
          />
        </Styled.FullWidthRow>
      </Styled.ColumnGroup>
    </Styled.Section>
  );
};
