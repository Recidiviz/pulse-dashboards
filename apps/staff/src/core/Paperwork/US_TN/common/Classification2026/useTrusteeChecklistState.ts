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

import {
  showTrusteeChecklist,
  UsTnReclassification2026DraftData,
} from "~datatypes";

import { useFeatureVariants } from "../../../../../components/StoreProvider";

/**
 * Where the Trustee Assessment stands for this packet. Both RCAF versions ask
 * the same three questions of it, so they ask them here.
 */
export function useTrusteeChecklistState(
  totalText: string,
  formData: Partial<UsTnReclassification2026DraftData>,
): {
  /** Passed to the template builders, which still render the pilot's form when off. */
  reworkEnabled: boolean;
  /** Whether the checklist is part of this packet at all. */
  includeTrusteeChecklist: boolean;
  /** Whether it is in the packet and so has to be filled in before download. */
  trusteeAssessmentRequired: boolean;
} {
  const { trusteeChecklistRework } = useFeatureVariants();
  const reworkEnabled = !!trusteeChecklistRework;
  const includeTrusteeChecklist = showTrusteeChecklist(
    totalText,
    formData,
    reworkEnabled,
  );

  return {
    reworkEnabled,
    includeTrusteeChecklist,
    trusteeAssessmentRequired: reworkEnabled && includeTrusteeChecklist,
  };
}
