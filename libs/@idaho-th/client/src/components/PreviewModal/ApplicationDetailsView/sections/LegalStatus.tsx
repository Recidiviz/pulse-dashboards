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
import { FIELD_LABELS } from "../../../HousingApplicationForm/constants/fieldLabels";
import { EnumField, TextField, YesNoField } from "./Fields";

export const LegalStatus: React.FC = () => {
  const { formData: values } = useCurrentApplicationDetail() ?? {};

  return (
    <>
      <EnumField
        label={FIELD_LABELS.legalCurrentStatus}
        value={values?.legalCurrentStatus}
      />
      <TextField
        label={FIELD_LABELS.legalMostRecentConviction}
        value={values?.legalMostRecentConviction}
      />
      <EnumField
        label={FIELD_LABELS.legalCountyOfCrime}
        value={values?.legalCountyOfCrime}
      />
      <YesNoField
        label={FIELD_LABELS.legalSexOffenderRegistry}
        value={values?.legalSexOffenderRegistry}
      />
      <YesNoField
        label={FIELD_LABELS.legalBackupForIcOrIce}
        value={values?.legalBackupForIcOrIce}
      />
      <YesNoField
        label={FIELD_LABELS.housingProbationParoleAtRelease}
        value={values?.housingProbationParoleAtRelease}
      />
    </>
  );
};
