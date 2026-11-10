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
import { IDS_ON_FILE_OPTIONS } from "../../../constants/fieldOptions";
import { PAPER_FORM_FIELD_LABELS } from "../../../constants/paperFormFieldLabels";
import { MultiSelectDropdown, YesNoSelectField } from "../../../Form/Elements";
import * as Styled from "../../../HousingApplicationForm.styles";

export const HousingRequirements: React.FC = () => {
  return (
    <Styled.Section>
      <Styled.Subsection>
        <Styled.SubsectionTitle>
          <BodyS2>Housing Requirements</BodyS2>
        </Styled.SubsectionTitle>
        <Styled.ColumnGroup>
          <Styled.Row>
            <YesNoSelectField
              name={FIELD_KEYS.childVisitationRequired}
              label={PAPER_FORM_FIELD_LABELS.childVisitationRequired}
            />
            <YesNoSelectField
              name={FIELD_KEYS.priorInvoluntaryDischarge}
              label={PAPER_FORM_FIELD_LABELS.priorInvoluntaryDischarge}
            />
            <YesNoSelectField
              name={FIELD_KEYS.housingProbationParoleAtRelease}
              label={PAPER_FORM_FIELD_LABELS.housingProbationParoleAtRelease}
            />
          </Styled.Row>
          <Styled.Row>
            <YesNoSelectField
              name={FIELD_KEYS.vehicleOnSite}
              label={PAPER_FORM_FIELD_LABELS.vehicleOnSite}
            />
          </Styled.Row>
          <Styled.Row>
            <MultiSelectDropdown
              name={FIELD_KEYS.idsOnFile}
              label={PAPER_FORM_FIELD_LABELS.idsOnFile}
              options={IDS_ON_FILE_OPTIONS}
            />
          </Styled.Row>
        </Styled.ColumnGroup>
      </Styled.Subsection>
    </Styled.Section>
  );
};
