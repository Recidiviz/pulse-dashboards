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

import assertNever from "assert-never";
import { isFuture, max, subMonths } from "date-fns";
import { mapValues } from "lodash";

import { ResidentRecord, UsMeSCCPRecord } from "~datatypes";

import {
  cleanupInlineTemplate,
  hydrateTemplate,
} from "../../../configs/hydrateTemplate";
import { OpportunityConfig } from "../../../configs/types";
import {
  EligibilityReport,
  eligibilityStatusEnum,
  RequirementsSectionContent,
} from "../interface";
import { ReportBase } from "../ReportBase";

const APPLICATION_DATE_OFFSET_MONTHS = 3;

export class UsMeSCCPEligibilityReport
  extends ReportBase
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
  private get requirementsByStatus() {
    const met = { ...this.eligibilityData.eligibleCriteria };
    const notMet = { ...this.eligibilityData.ineligibleCriteria };
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

  get requirements(): EligibilityReport["requirements"] {
    const sections: Array<RequirementsSectionContent> = [];

    const { trackedCriteria } = this.config.requirements.summary;
    const orderedCriteria = Object.keys(trackedCriteria);

    // run a separate formatting pipeline for each grouping
    // since they are processed a little differently
    const { met, notMet } = this.requirementsByStatus;

    if (Object.keys(met).length) {
      sections.push({
        label: "Requirements you **have** met",
        icon: "Success",
        requirements: orderedCriteria
          .filter((key) => key in met)
          .map((key) => ({
            // ineligible reason is excluded, since these criteria are met
            criterion: cleanupInlineTemplate(
              hydrateTemplate(trackedCriteria[key].criterion, {
                currentCriterion: met[key],
              }),
            ),
          })),
      });
    }

    if (Object.keys(notMet).length) {
      sections.push({
        label: "Requirements you **have not** met yet",
        icon: "CloseOutlined",
        requirements: orderedCriteria
          .filter((key) => key in notMet)
          .map((key) =>
            // here, by mapping over both values in the copy object,
            // we are including criterion and ineligible reason, when it is present
            mapValues(trackedCriteria[key], (template) =>
              template
                ? cleanupInlineTemplate(
                    hydrateTemplate(template, {
                      currentCriterion: notMet[key],
                    }),
                  )
                : "",
            ),
          ),
      });
    }

    if (this.config.requirements.summary.untrackedCriteria.length) {
      sections.push({
        label: "Ask your case manager if you’ve met these requirements",
        icon: "ArrowCircled",
        requirements: this.config.requirements.summary.untrackedCriteria,
      });
    }

    return sections;
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
        return assertNever(this.status.value);
    }
  }
}
