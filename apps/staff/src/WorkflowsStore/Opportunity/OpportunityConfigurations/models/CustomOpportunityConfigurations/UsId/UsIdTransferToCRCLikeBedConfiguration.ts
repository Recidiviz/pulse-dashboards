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

import { ApiOpportunityConfiguration } from "../../ApiOpportunityConfigurationImpl";

/**
 * Configuration for the usIdTransferToCRCLikeBed opportunity.
 *
 * - "OTHER" and "VICTIM" denial reasons are indefinite (do not auto-expire)
 * - All other denial reasons have a max snooze of 180 days (inherited from base config)
 */
export class UsIdTransferToCRCLikeBedConfiguration extends ApiOpportunityConfiguration {
  get maxSnoozeDaysByDenialReason(): Record<string, number | undefined> {
    // Denial reasons that should be indefinite (no auto-expiration)
    const indefiniteDenialReasons: Record<string, number | undefined> = {
      VICTIM: undefined, // "A victim lives in the area" - indefinite
      OTHER: undefined, // "Other, please specify a reason" - indefinite
    };

    return {
      ...super.maxSnoozeDaysByDenialReason,
      ...indefiniteDenialReasons,
    };
  }

  get indefiniteSnoozeSectionSubheading(): string {
    return "";
  }
}
