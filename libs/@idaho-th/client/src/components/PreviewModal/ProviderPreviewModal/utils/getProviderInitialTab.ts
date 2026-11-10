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

import { APPLICATION_STAGE } from "~@idaho-th/shared";

import { ApplicationStage } from "../../../../interfaces/common";
import { TAB_IDS } from "../../constants";
import { PreviewTab } from "../../types";

export const getProviderInitialTab = (stage: ApplicationStage): PreviewTab => {
  const shouldRenderHomePlan =
    stage === APPLICATION_STAGE.APPROVALS ||
    stage === APPLICATION_STAGE.RELEASE;

  return shouldRenderHomePlan ? TAB_IDS.HOME_PLAN : TAB_IDS.APPLICATION_DETAILS;
};
