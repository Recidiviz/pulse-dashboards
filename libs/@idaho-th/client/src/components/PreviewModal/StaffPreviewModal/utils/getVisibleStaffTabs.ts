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

import { APPLICATION_STAGE, isRider } from "~@idaho-th/shared";

import type { StaffApplicationDetail } from "../../../../interfaces/common";
import type { HousingApplicationForm } from "../../../HousingApplicationForm/types";
import { TAB_IDS, type TabDef } from "../../constants";

/**
 * The Parole Commission Decision only applies to Termers and Parole Violators,
 * and only once the case is submitted.
 */
export const getVisibleStaffTabs = (
  tabs: TabDef[],
  application: StaffApplicationDetail | undefined,
): TabDef[] => {
  const showApprovals =
    application?.stage != null &&
    application.stage !== APPLICATION_STAGE.DRAFT &&
    !isRider(
      (application.formData as HousingApplicationForm).legalCurrentStatus,
    );

  return showApprovals
    ? tabs
    : tabs.filter((tab) => tab.id !== TAB_IDS.APPROVALS);
};
