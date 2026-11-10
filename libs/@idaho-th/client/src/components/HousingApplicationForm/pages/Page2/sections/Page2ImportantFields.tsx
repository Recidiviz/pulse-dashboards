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

import { FIELD_KEYS } from "../../../constants/fieldKeys";
import { DISTRICT_OPTIONS } from "../../../constants/fieldOptions";
import { PAPER_FORM_FIELD_LABELS } from "../../../constants/paperFormFieldLabels";
import { MultiSelectDropdown, YesNoSelectField } from "../../../Form/Elements";
import * as Styled from "../../../HousingApplicationForm.styles";
import { ImportantFieldsSection } from "../../../ImportantFieldsSection";
import { PreferredProviders } from "./PreferredProviders";

export const Page2ImportantFields: React.FC = () => {
  return (
    <ImportantFieldsSection>
      <Styled.ImportantFieldsRow>
        <MultiSelectDropdown
          name={FIELD_KEYS.preferredDistrict}
          label={PAPER_FORM_FIELD_LABELS.preferredDistrict}
          options={DISTRICT_OPTIONS}
        />
        <YesNoSelectField
          name={FIELD_KEYS.faithBasedPreferred}
          label={PAPER_FORM_FIELD_LABELS.faithBasedPreferred}
        />
      </Styled.ImportantFieldsRow>
      <PreferredProviders />
    </ImportantFieldsSection>
  );
};
