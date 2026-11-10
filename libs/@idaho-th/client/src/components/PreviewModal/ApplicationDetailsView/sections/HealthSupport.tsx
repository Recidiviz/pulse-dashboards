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
import { LongTextField, TextField, YesNoField } from "./Fields";

export const HealthSupport: React.FC = () => {
  const { formData: values } = useCurrentApplicationDetail() ?? {};

  return (
    <>
      <Styled.Subsection>
        <Styled.SubsectionTitle>
          <BodyS2>Medical Info</BodyS2>
        </Styled.SubsectionTitle>
        <YesNoField
          label={FIELD_LABELS.medicalMhSupportNeeded}
          value={values?.medicalMhSupportNeeded}
        />
        <YesNoField
          label={FIELD_LABELS.contagiousDisease}
          value={values?.contagiousDisease}
        />
        <LongTextField
          label={FIELD_LABELS.prescribedMedications}
          value={values?.prescribedMedications}
        />
      </Styled.Subsection>

      <Styled.SubsectionDivider />

      <Styled.Subsection>
        <Styled.SubsectionTitle>
          <BodyS2>Financial Info</BodyS2>
        </Styled.SubsectionTitle>
        <YesNoField
          label={FIELD_LABELS.ssiSsdiSsrbMedicareMedicaid}
          value={values?.ssiSsdiSsrbMedicareMedicaid}
        />
        <TextField
          label={FIELD_LABELS.benefitsReinstatementDate}
          value={values?.benefitsReinstatementDate}
        />
        <TextField
          label={FIELD_LABELS.benefitsDuration}
          value={values?.benefitsDuration}
        />
      </Styled.Subsection>

      <Styled.SubsectionDivider />

      <Styled.Subsection>
        <Styled.SubsectionTitle>
          <BodyS2>Substance Use</BodyS2>
        </Styled.SubsectionTitle>
        <YesNoField
          label={FIELD_LABELS.addictions}
          value={values?.addictions}
        />
        <TextField label={FIELD_LABELS.substances} value={values?.substances} />
        <TextField
          label={FIELD_LABELS.lastUseDate}
          value={values?.lastUseDate}
        />
        <YesNoField
          label={FIELD_LABELS.underInfluenceAtCrime}
          value={values?.underInfluenceAtCrime}
        />
      </Styled.Subsection>
    </>
  );
};
