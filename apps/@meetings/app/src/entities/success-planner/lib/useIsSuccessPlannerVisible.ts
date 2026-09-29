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

import { Platform } from "react-native";

import { useCurrentAgencyConfig } from "~@meetings/app/entities/agency-config/@x/success-planner";
import {
  useFeatureVariants,
  useUserContext,
} from "~@meetings/app/entities/user/@x/success-planner";

export function useIsSuccessPlannerVisible() {
  const agencyConfig = useCurrentAgencyConfig();
  const { isRecidivizUser } = useUserContext();
  const { isVariantActive } = useFeatureVariants();

  if (Platform.OS !== "web" || !agencyConfig?.successPlannerEnabled) {
    return false;
  }

  return isRecidivizUser || isVariantActive("usNeSuccessPlanner");
}
