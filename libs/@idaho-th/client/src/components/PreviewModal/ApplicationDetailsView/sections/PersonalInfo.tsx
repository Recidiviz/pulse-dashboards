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
import {
  dobWithAgeLabel,
  FIELD_LABELS,
} from "../../../HousingApplicationForm/constants/fieldLabels";
import * as Styled from "../ApplicationDetailsView.styles";
import { formatDobWithAge } from "../ApplicationDetailsView.utils";
import { MultiSelectField, TextField } from "./Fields";

export const PersonalInfo: React.FC = () => {
  const { formData: values } = useCurrentApplicationDetail() ?? {};

  return (
    <>
      <Styled.Subsection>
        <Styled.SubsectionTitle>
          <BodyS2>CM/PO Contact</BodyS2>
        </Styled.SubsectionTitle>
        <TextField label={FIELD_LABELS.cmPoName} value={values?.cmPoName} />
        <TextField
          label={FIELD_LABELS.cmEmailOnFile}
          value={values?.cmEmailOnFile}
        />
        <TextField label={FIELD_LABELS.cmPoEmail} value={values?.cmPoEmail} />
        <TextField label={FIELD_LABELS.cmPoPhone} value={values?.cmPoPhone} />
      </Styled.Subsection>

      <Styled.SubsectionDivider />

      <Styled.Subsection>
        <Styled.SubsectionTitle>
          <BodyS2>Client Information</BodyS2>
        </Styled.SubsectionTitle>
        <TextField
          label={FIELD_LABELS.currentFacilityLocation}
          value={values?.currentFacilityLocation}
        />
        <TextField
          label={FIELD_LABELS.clientFullName}
          value={values?.clientFullName}
        />
        <TextField label={FIELD_LABELS.idocNumber} value={values?.idocNumber} />
        <TextField
          label={dobWithAgeLabel}
          value={formatDobWithAge(values?.dob, values?.age)}
        />
        <TextField label={FIELD_LABELS.ssnLast4} value={values?.ssnLast4} />
        <TextField label={FIELD_LABELS.gender} value={values?.gender} />
        <TextField
          label={FIELD_LABELS.personalPhoneNumber}
          value={values?.personalPhoneNumber}
        />
        <MultiSelectField
          label={FIELD_LABELS.idsOnFile}
          values={values?.idsOnFile}
        />
      </Styled.Subsection>

      <Styled.SubsectionDivider />

      <Styled.Subsection>
        <Styled.SubsectionTitle>
          <BodyS2>Emergency Contact</BodyS2>
        </Styled.SubsectionTitle>
        <TextField
          label={FIELD_LABELS.emergencyContactName}
          value={values?.emergencyContactName}
        />
        <TextField
          label={FIELD_LABELS.emergencyContactRelationship}
          value={values?.emergencyContactRelationship}
        />
        <TextField
          label={FIELD_LABELS.emergencyContactPhone}
          value={values?.emergencyContactPhone}
        />
      </Styled.Subsection>
    </>
  );
};
