// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { genderValueToLabel } from "../../utils/formatStrings";
import { translate } from "../../utils/i18nSettings";

const getLabelByMode = (mode) => {
  switch (mode) {
    case "FEMALE":
      return genderValueToLabel.FEMALE;
    case "MALE":
      return genderValueToLabel.MALE;
    case "WHITE":
      return translate("raceLabelMap").WHITE;
    case "BLACK":
      return translate("raceLabelMap").BLACK;
    case "HISPANIC":
      return translate("raceLabelMap").HISPANIC;
    case "ASIAN":
      return translate("raceLabelMap").ASIAN;
    case "AMERICAN_INDIAN_ALASKAN_NATIVE":
      return translate("raceLabelMap").AMERICAN_INDIAN_ALASKAN_NATIVE;
    case "counts":
      return `${translate("Revocation")} count`;
    case "exits":
      return "Percent revoked out of all exits";
    case "rates":
    default:
      return translate("percentOfPopulationRevoked");
  }
};

export default getLabelByMode;
