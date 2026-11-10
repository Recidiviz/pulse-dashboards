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

import { RELEASE_DATE_GUIDANCE } from "../../../../PreviewModal/UpdateReleaseDateModal";
import { FIELD_KEYS } from "../../../constants/fieldKeys";
import { GENDER_OPTIONS } from "../../../constants/fieldOptions";
import { PAPER_FORM_FIELD_LABELS } from "../../../constants/paperFormFieldLabels";
import {
  DateField,
  DropdownSelect,
  TextInput,
  YesNoSelectField,
} from "../../../Form/Elements";
import * as Styled from "../../../HousingApplicationForm.styles";
import { ImportantFieldsSection } from "../../../ImportantFieldsSection";

export const Page1ImportantFields: React.FC = () => {
  return (
    <ImportantFieldsSection>
      <Styled.ImportantFieldsRow>
        <TextInput
          name={FIELD_KEYS.clientFullName}
          label={PAPER_FORM_FIELD_LABELS.clientFullName}
        />
        <DropdownSelect
          name={FIELD_KEYS.gender}
          label={PAPER_FORM_FIELD_LABELS.gender}
          options={GENDER_OPTIONS}
        />
        <TextInput
          name={FIELD_KEYS.idocNumber}
          label={PAPER_FORM_FIELD_LABELS.idocNumber}
          maxLength={7}
        />
      </Styled.ImportantFieldsRow>
      <Styled.ImportantFieldsRow>
        <DateField
          name={FIELD_KEYS.tpdHousingNeededDate}
          label={PAPER_FORM_FIELD_LABELS.tpdHousingNeededDate}
          tooltip={RELEASE_DATE_GUIDANCE}
        />
        <YesNoSelectField
          name={FIELD_KEYS.legalSexOffenderRegistry}
          label={PAPER_FORM_FIELD_LABELS.legalSexOffenderRegistry}
        />
        <YesNoSelectField
          name={FIELD_KEYS.violenceHistoryDors}
          label={PAPER_FORM_FIELD_LABELS.violenceHistoryDors}
        />
      </Styled.ImportantFieldsRow>
      <Styled.ImportantFieldsRow>
        <YesNoSelectField
          name={FIELD_KEYS.paroleHearingCompleted}
          label={PAPER_FORM_FIELD_LABELS.paroleHearingCompleted}
          maxWidth="calc((100% - 24px) / 3)"
        />
      </Styled.ImportantFieldsRow>
    </ImportantFieldsSection>
  );
};
