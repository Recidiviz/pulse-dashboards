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
import { Hr } from "../shared";
import { UsIdDisciplinaryFacilityNotesSection } from "./UsIdDisciplinaryFacilityNotesSection";
import { UsIdStgSection } from "./UsIdStgSection";

/**
 * The Idaho-only sub-sections slotted into the "Institutional & Community
 * Behavior" section (config.conductHistoryChildren), in display order:
 * Disciplinary Facility Notes, then Gang / Security Threat Group (STG). This
 * wrapper owns the separators between the sub-sections; the children render
 * none of their own.
 */
export function UsIdInstitutionalBehaviorSections(props: {
  caseDetail: ParoleCase;
  config: ParoleConfig;
}) {
  return (
    <>
      <UsIdDisciplinaryFacilityNotesSection {...props} />
      <Hr />
      <UsIdStgSection {...props} />
    </>
  );
}
