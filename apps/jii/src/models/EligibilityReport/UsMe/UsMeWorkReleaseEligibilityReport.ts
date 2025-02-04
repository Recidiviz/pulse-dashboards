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

import { ResidentRecord, UsMeWorkReleaseRecord } from "~datatypes";

import { OpportunityConfig } from "../../../configs/types";
import { ReportBase } from "../ReportBase";
import { EligibilityReport, eligibilityStatusEnum } from "../types";

export class UsMeWorkReleaseEligibilityReport
  extends ReportBase<"usMeWorkRelease">
  implements EligibilityReport
{
  constructor(
    private resident: ResidentRecord,
    config: OpportunityConfig,
    protected override eligibilityData: UsMeWorkReleaseRecord,
  ) {
    super(config, eligibilityData);
  }

  override get status() {
    const baseStatus = super.status;
    if (baseStatus.value === "INELIGIBLE") {
      // we use this custody level as a proxy for program enrollment,
      // which we cannot yet observe directly
      if (this.resident.custodyLevel?.toLowerCase() === "community") {
        return {
          value: eligibilityStatusEnum.enum.NA,
          label: this.config.statusLabels.NA,
        };
      }
    }

    return baseStatus;
  }

  private get threeYearsRemainingDate(): Date | undefined | null {
    return (
      this.requirementsByStatus.met.usMeThreeYearsRemainingOnSentence
        ?.eligibleDate ??
      this.requirementsByStatus.notMet.usMeThreeYearsRemainingOnSentence
        ?.eligibleDate
    );
  }

  protected get highlightsTemplateContext() {
    const { threeYearsRemainingDate } = this;
    return { threeYearsRemainingDate };
  }

  private get onlyMissingYearsRemaining() {
    if (
      Object.keys(this.requirementsByStatus.notMet).length === 1 &&
      this.requirementsByStatus.notMet.usMeThreeYearsRemainingOnSentence !==
        undefined
    ) {
      return true;
    }
    return false;
  }

  protected override get showHighlights(): boolean {
    switch (this.status.value) {
      case "ELIGIBLE":
        return true;
      case "ALMOST_ELIGIBLE":
      case "INELIGIBLE":
        if (this.onlyMissingYearsRemaining) return true;
        return false;
      default:
        return false;
    }
  }
}
