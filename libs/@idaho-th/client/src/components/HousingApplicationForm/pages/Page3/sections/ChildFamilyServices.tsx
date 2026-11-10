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
import { CHILD_FAMILY_SERVICES_DOCUMENTATION_OPTIONS } from "../../../constants/fieldOptions";
import { PAPER_FORM_FIELD_LABELS } from "../../../constants/paperFormFieldLabels";
import { MultiSelectDropdown, TextInput } from "../../../Form/Elements";
import * as Styled from "../../../HousingApplicationForm.styles";

export const ChildFamilyServices: React.FC = () => {
  return (
    <Styled.Section>
      <Styled.SubsectionTitle>
        <BodyS2>Child/Family Services</BodyS2>
      </Styled.SubsectionTitle>
      <Styled.ColumnGroup>
        <Styled.FullWidthRow>
          <MultiSelectDropdown
            name={FIELD_KEYS.childFamilyServicesDocumentation}
            label={PAPER_FORM_FIELD_LABELS.childFamilyServicesDocumentation}
            options={CHILD_FAMILY_SERVICES_DOCUMENTATION_OPTIONS}
          />
        </Styled.FullWidthRow>
        <Styled.FullWidthRow>
          <TextInput
            name={FIELD_KEYS.parentGuardianNames}
            label={PAPER_FORM_FIELD_LABELS.parentGuardianNames}
          />
        </Styled.FullWidthRow>
        {[
          FIELD_KEYS.child1Info,
          FIELD_KEYS.child2Info,
          FIELD_KEYS.child3Info,
        ].map((name) => (
          <Styled.FullWidthRow key={name}>
            <TextInput name={name} label={PAPER_FORM_FIELD_LABELS[name]} />
          </Styled.FullWidthRow>
        ))}
        <Styled.FullWidthRow>
          <TextInput
            name={FIELD_KEYS.childVisitationInfo}
            label={PAPER_FORM_FIELD_LABELS.childVisitationInfo}
          />
        </Styled.FullWidthRow>
      </Styled.ColumnGroup>
    </Styled.Section>
  );
};
