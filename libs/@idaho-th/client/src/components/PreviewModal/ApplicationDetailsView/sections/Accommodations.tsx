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

import { useCurrentApplicationDetail } from "../../../../hooks/useApplicationDetail";
import { BodyS2 } from "../../../../styles";
import { FIELD_LABELS } from "../../../HousingApplicationForm/constants/fieldLabels";
import * as Styled from "../ApplicationDetailsView.styles";
import { joinOrUndefined } from "../ApplicationDetailsView.utils";
import { LongTextField, MultiSelectField, TextField } from "./Fields";

export const Accommodations: React.FC = () => {
  const { formData: values } = useCurrentApplicationDetail() ?? {};

  return (
    <>
      <Styled.Subsection>
        <Styled.SubsectionTitle>
          <BodyS2>Assistance Accommodations</BodyS2>
        </Styled.SubsectionTitle>
        <MultiSelectField
          label={FIELD_LABELS.accommodations}
          values={values?.accommodations}
        />
        <TextField
          label={FIELD_LABELS.otherAccommodations}
          value={values?.otherAccommodations}
        />
        <TextField
          label={FIELD_LABELS.accommodationsInfo}
          value={values?.accommodationsInfo}
        />
      </Styled.Subsection>

      <Styled.SubsectionDivider />

      <Styled.Subsection>
        <Styled.SubsectionTitle>
          <BodyS2>Medical Accommodations</BodyS2>
        </Styled.SubsectionTitle>
        <LongTextField
          label={FIELD_LABELS.medicalAccommodations}
          value={joinOrUndefined(values?.medicalAccommodations ?? [])}
        />
        <TextField
          label={FIELD_LABELS.otherMedicalAccommodation}
          value={values?.otherMedicalAccommodation}
        />
        <TextField
          label={FIELD_LABELS.additionalMedicalInfo}
          value={values?.additionalMedicalInfo}
        />
      </Styled.Subsection>
    </>
  );
};
