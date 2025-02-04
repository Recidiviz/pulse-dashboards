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

import { isFuture, max, subMonths } from "date-fns";

import { ResidentRecord, UsMeSCCPRecord } from "~datatypes";

import { OpportunityConfig } from "../../../configs/types";
import { ReportBase } from "../ReportBase";
import { EligibilityReport, eligibilityStatusEnum } from "../types";

const APPLICATION_DATE_OFFSET_MONTHS = 3;

export class UsMeSCCPEligibilityReport
  extends ReportBase<"usMeSCCP">
  implements EligibilityReport
{
  constructor(
    resident: ResidentRecord,
    config: OpportunityConfig,
    protected override eligibilityData: UsMeSCCPRecord["output"],
  ) {
    super(config, eligibilityData);
  }

  private dateCriteria = [
    "usMeServedXPortionOfSentence",
    "usMeXMonthsRemainingOnSentence",
  ] as const;

  private get eligibilityDate(): Date {
    const eligibleDates = this.dateCriteria.map((criterion) => {
      const eligibleDate =
        this.eligibilityData.eligibleCriteria[criterion]?.eligibleDate ??
        this.eligibilityData.ineligibleCriteria[criterion]?.eligibleDate;

      // we don't expect to encounter this, but if we do it means data was malformed
      if (!eligibleDate) {
        throw new Error(`missing eligible date for ${criterion}`);
      }

      return eligibleDate;
    });

    return max(eligibleDates);
  }

  private get applicationDate() {
    return subMonths(this.eligibilityDate, APPLICATION_DATE_OFFSET_MONTHS);
  }

  private get ineligibleViolation(): boolean {
    return (
      this.eligibilityData.ineligibleCriteria
        .usMeNoClassAOrBViolationFor90Days !== undefined
    );
  }

  protected get highlightsTemplateContext() {
    const { applicationDate, eligibilityDate, ineligibleViolation } = this;

    return {
      eligibilityDate,
      applicationDate,
      ineligibleViolation,
    };
  }

  override get status() {
    const baseStatus = super.status;

    // users within application period
    if (baseStatus.value === "ELIGIBLE") {
      if (isFuture(this.eligibilityDate)) {
        return {
          value: eligibilityStatusEnum.enum.ALMOST_ELIGIBLE,
          label: this.config.statusLabels.ALMOST_ELIGIBLE,
        };
      }
    }

    return baseStatus;
  }

  private eligibilityDateInFuture(
    reason: { eligibleDate: Date } | undefined,
  ): boolean {
    if (!reason) return false;
    return isFuture(reason.eligibleDate);
  }

  /**
   * Groups tracked requirements by their eligibility status. For many opportunities
   * this would be trivial, but for SCCP the groupings are different for staff vs JII
   * due to the way that the application process is handled.
   */
  protected override get requirementsByStatus() {
    const { met, notMet } = super.requirementsByStatus;

    // these criteria will be "met" if the resident is within the pre-eligibility application window,
    // but we want to display them based on the actual eligibility date here
    this.dateCriteria.forEach((key) => {
      if (this.eligibilityDateInFuture(met[key])) {
        // @ts-expect-error TS cannot match the keys with their corresponding values here
        notMet[key] = met[key];
        delete met[key];
      }
    });

    return { met, notMet };
  }

  protected get showHighlights(): boolean {
    switch (this.status.value) {
      case "ELIGIBLE":
        return true;
      case "ALMOST_ELIGIBLE":
        if (this.ineligibleViolation) {
          // this criterion either has a date when the violation will be cleared,
          // or a freetext field indicating that it is still pending. Suppress the
          // highlights for pending violations only
          if (
            this.requirementsByStatus.notMet.usMeNoClassAOrBViolationFor90Days
              ?.eligibleDate
          ) {
            return true;
          }
          return false;
        }
        return true;
      case "INELIGIBLE": {
        // we only want to show highlights if everything is met but the eligibility date
        const nonDateIneligibleCriteria = Object.keys(
          this.requirementsByStatus.notMet,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ).filter((c) => !this.dateCriteria.includes(c as any));
        if (nonDateIneligibleCriteria.length > 0) {
          return false;
        }
        return true;
      }
      default:
        // no other values are explicitly supported by this opportunity
        return false;
    }
  }
}
