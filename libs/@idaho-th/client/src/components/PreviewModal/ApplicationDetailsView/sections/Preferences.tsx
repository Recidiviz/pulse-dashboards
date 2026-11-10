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
import { MultiSelectField, TextField, YesNoField } from "./Fields";

export const Preferences: React.FC = () => {
  const { formData: values, preferredProviders = [] } =
    useCurrentApplicationDetail() ?? {};

  return (
    <>
      <YesNoField
        label={FIELD_LABELS.faithBasedPreferred}
        value={values?.faithBasedPreferred}
      />
      <YesNoField
        label={FIELD_LABELS.previousTransitionalHome}
        value={values?.previousTransitionalHome}
      />
      <TextField
        label={FIELD_LABELS.previousHomeName}
        value={values?.previousHomeName}
      />
      <TextField
        label={FIELD_LABELS.previousHomeCity}
        value={values?.previousHomeCity}
      />
      <MultiSelectField
        label={FIELD_LABELS.preferredDistrict}
        values={values?.preferredDistrict}
      />
      <MultiSelectField
        label={FIELD_LABELS.preferredProviders}
        values={preferredProviders.map((provider) => provider.name)}
      />
    </>
  );
};
