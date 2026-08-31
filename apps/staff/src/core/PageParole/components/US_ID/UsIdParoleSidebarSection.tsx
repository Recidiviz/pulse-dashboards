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

import { ParoleCase } from "~datatypes";

import type { ParoleConfig } from "../../../models/types";
import { AssessmentsSidebarSection } from "../AssessmentsSidebarSection";
import { Hr } from "../shared";
import { UsIdInstantOffensesSection } from "./UsIdInstantOffensesSection";

/**
 * US_ID's `ParoleConfig.sidebarChildren` -- the blocks slotted at the end of
 * the case profile sidebar's info card: the instant-offense list followed by
 * the assessments summary (OBT-45410). `tools` comes from
 * riskAssessmentConfig; the assessments block hides itself when a tenant
 * configures no tools.
 */
export function UsIdParoleSidebarSection({
  caseDetail,
  config,
}: {
  caseDetail: ParoleCase;
  config: ParoleConfig;
}) {
  const tools = config.riskAssessmentConfig?.tools ?? [];

  return (
    <>
      <UsIdInstantOffensesSection
        offenses={caseDetail.offenseHistory.offenses}
      />
      {tools.length > 0 && (
        <>
          <Hr />
          <AssessmentsSidebarSection
            riskAssessments={caseDetail.riskAssessments}
            tools={tools}
          />
        </>
      )}
    </>
  );
}
