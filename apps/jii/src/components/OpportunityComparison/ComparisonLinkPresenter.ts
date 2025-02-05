// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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
  ComparisonPageConfig,
  IncarcerationOpportunityId,
  ResidentsConfig,
} from "../../configs/types";

export class ComparisonLinkPresenter {
  constructor(
    private config: ComparisonPageConfig,
    private opportunities: ResidentsConfig["incarcerationOpportunities"],
  ) {}

  get text() {
    return this.config.summary.text;
  }

  private findOpportunitySlug(id: IncarcerationOpportunityId) {
    const slug = this.opportunities[id]?.urlSlug;

    if (!slug) {
      throw new Error(`Opportunity type ${id} is not supported`);
    }

    return slug;
  }

  get link() {
    return {
      text: this.config.summary.linkText,
      params: {
        opportunitySlug1: this.findOpportunitySlug(
          this.config.opportunities[0],
        ),
        opportunitySlug2: this.findOpportunitySlug(
          this.config.opportunities[1],
        ),
      },
    };
  }
}
