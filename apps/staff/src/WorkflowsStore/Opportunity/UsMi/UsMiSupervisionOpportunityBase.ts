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

import { DocumentData } from "firebase/firestore";

import { Client } from "../../Client";
import { OpportunityBase } from "../OpportunityBase";
import { OpportunityTab } from "../types";

/**
 * Base class for US_MI supervision opportunities that combine the
 * "Eligible Now" and "Almost Eligible" tabs into a single tab with
 * two sub-sections.
 *
 * The subcategory keys default to "ELIGIBLE_NOW" and "ALMOST_ELIGIBLE" but
 * can be overridden by subclasses that need different values in their config.
 *
 * Relies on the following from {@link OpportunityBase}:
 * - `almostEligible` — whether the record has `isAlmostEligible: true`
 * - `tabTitle()` — default tab routing logic (denied, submitted, eligible, etc.)
 */

type UsMiSupervisionOpportunitySubcategory = "ALMOST_ELIGIBLE" | "ELIGIBLE_NOW";

export abstract class UsMiSupervisionOpportunityBase<
  TRecord extends DocumentData,
> extends OpportunityBase<Client, TRecord> {
  protected readonly eligibleTabTitle = "Eligible Now";

  tabTitle(): OpportunityTab {
    if (this.almostEligible) return this.eligibleTabTitle;
    return super.tabTitle();
  }

  get subcategory(): UsMiSupervisionOpportunitySubcategory | undefined {
    if (this.tabTitle() === this.eligibleTabTitle) {
      if (this.almostEligible) return "ALMOST_ELIGIBLE";
      return "ELIGIBLE_NOW";
    }

    return undefined;
  }
}
