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

import { captureException } from "@sentry/react";

import { EligibilityModuleConfig } from "../../configs/types";
import { ComparisonTeaserProps } from "../OpportunityComparison/ComparisonTeaser";
import { IdTuple, idTupleSchema } from "../OpportunityComparison/types";
import { findMatchingComparisonConfig } from "../OpportunityComparison/utils";

export type ComparisonTeaserInCopyProps = { opportunityTypes?: string };

export class ComparisonTeaserInCopyPresenter {
  constructor(
    private props: ComparisonTeaserInCopyProps,
    private eligibilityConfig: EligibilityModuleConfig,
  ) {}

  private get opportunityIds(): IdTuple {
    return idTupleSchema.parse(JSON.parse(this.props.opportunityTypes ?? ""));
  }

  private get comparisonConfig() {
    const match = findMatchingComparisonConfig(
      this.eligibilityConfig,
      this.opportunityIds,
    );

    if (!match) {
      throw new Error(
        `No comparison found for ${this.opportunityIds.join(" and ")}`,
      );
    }
    return match;
  }

  get linkProps(): ComparisonTeaserProps | undefined {
    try {
      return { config: this.comparisonConfig };
    } catch (e) {
      captureException(e);
      return;
    }
  }
}
