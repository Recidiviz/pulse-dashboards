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
import { YesNoField } from "./Fields";

export const HousingRequirements: React.FC = () => {
  const { formData: values } = useCurrentApplicationDetail() ?? {};

  return (
    <>
      <YesNoField
        label={FIELD_LABELS.childVisitationRequired}
        value={values?.childVisitationRequired}
      />
      <YesNoField
        label={FIELD_LABELS.priorInvoluntaryDischarge}
        value={values?.priorInvoluntaryDischarge}
      />
      <YesNoField
        label={FIELD_LABELS.violenceHistoryDors}
        value={values?.violenceHistoryDors}
      />
      <YesNoField
        label={FIELD_LABELS.paroleHearingCompleted}
        value={values?.paroleHearingCompleted}
      />
      <YesNoField
        label={FIELD_LABELS.vehicleOnSite}
        value={values?.vehicleOnSite}
      />
    </>
  );
};
