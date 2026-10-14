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

import { Opportunity } from "../../../../types";
import { ApiOpportunityConfiguration } from "../../ApiOpportunityConfigurationImpl";

export class UsOrEarnedDischargeSentenceConfiguration extends ApiOpportunityConfiguration {
  /**
   * Counts distinct people, not records: a person can hold several sentences,
   * and the card reports people.
   *
   * The one count a tab histogram cannot express, so this overrides the base
   * accessor instead of supplying `countFromTabCounts`. The indexed-search
   * homepage reports this type as unreconstructable rather than showing the
   * generic total, which would be a plausible wrong number.
   */
  override get countByFunction() {
    return (opportunities: Opportunity[]) =>
      new Set(opportunities.map((opp) => opp.person.externalId)).size;
  }
}
