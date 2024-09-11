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
import { mapValues } from "lodash";
import { makeAutoObservable } from "mobx";

import { ResidentRecord, UsMeSCCPRecord } from "~datatypes";

import {
  cleanupInlineTemplate,
  hydrateTemplate,
} from "../../../configs/hydrateTemplate";
import { OpportunityConfig } from "../../../configs/types";
import { EligibilityReport, RequirementsSectionContent } from "../interface";

const APPLICATION_DATE_OFFSET_MONTHS = 3;

export class UsMeSCCPEligibilityReport implements EligibilityReport {
  constructor(
    private resident: ResidentRecord["output"],
    private config: OpportunityConfig,
    private eligibilityData: UsMeSCCPRecord["output"] | undefined,
  ) {
    makeAutoObservable(this);
  }

  private get eligibilityDate() {
    const eligibleDates = (
      [
        "usMeServedXPortionOfSentence",
        "usMeXMonthsRemainingOnSentence",
      ] as const
    )
      .map(
        (criterion) =>
          this.eligibilityData?.eligibleCriteria[criterion]?.eligibleDate ??
          this.eligibilityData?.ineligibleCriteria[criterion]?.eligibleDate,
      )
      .filter((d): d is Date => d instanceof Date);

    if (eligibleDates.length === 0) return;

    return max(eligibleDates);
  }

  private get applicationDate() {
    if (this.eligibilityDate) {
      return subMonths(this.eligibilityDate, APPLICATION_DATE_OFFSET_MONTHS);
    }
    return;
  }

  private get ineligibleViolation(): boolean {
    return (
      this.eligibilityData?.ineligibleCriteria
        .usMeNoClassAOrBViolationFor90Days !== undefined
    );
  }

  /**
   * Generic preparation of report data for template rendering. Opportunity-specific
   * properties should be added to an object called "custom" on this context
   */
  private get templateContext() {
    const {
      resident,
      config,
      eligibilityData,
      applicationDate,
      eligibilityDate,
      ineligibleViolation,
    } = this;
    return {
      resident,
      config,
      eligibilityData,
      custom: {
        eligibilityDate,
        applicationDate,
        ineligibleViolation,
      },
    };
  }

  get hasEligibilityData(): boolean {
    return this.eligibilityData !== undefined;
  }

  get headline(): string {
    return cleanupInlineTemplate(
      hydrateTemplate(this.config.headline, this.templateContext),
    );
  }

  get subheading(): string {
    return cleanupInlineTemplate(
      hydrateTemplate(this.config.subheading, this.templateContext),
    );
  }

  private eligibilityDateInFuture(
    reason: { eligibleDate: Date } | undefined,
  ): boolean {
    if (!reason) return false;
    return isFuture(reason.eligibleDate);
  }

  /**
   * For use when eligibility data is not present; should return a single section
   * of all tracked and untracked requirements without any personalization
   */
  private get staticRequirements(): [RequirementsSectionContent] {
    const trackedRequirements = Object.values(
      this.config.requirements.summary.trackedCriteria,
    ).map((r) => ({
      // ineligible reasons are dropped since we don't know eligibility info
      criterion: hydrateTemplate(r.criterion, {}),
    }));

    return [
      {
        label: this.config.requirements.summary.staticRequirementsLabel,
        icon: "ArrowCircled",
        requirements: [
          ...trackedRequirements,
          ...this.config.requirements.summary.untrackedCriteria,
        ],
      },
    ];
  }

  /**
   * Groups tracked requirements by their eligibility status. For many opportunities
   * this would be trivial, but for SCCP the groupings are different for staff vs JII
   * due to the way that the application process is handled.
   */
  private getRequirementsByStatus(eligibilityData: UsMeSCCPRecord["output"]) {
    const met = { ...eligibilityData.eligibleCriteria };
    const notMet = { ...eligibilityData.ineligibleCriteria };
    // these criteria will be "met" if the resident is within the pre-eligibility application window,
    // but we want to display them based on the actual eligibility date here
    (
      [
        "usMeXMonthsRemainingOnSentence",
        "usMeServedXPortionOfSentence",
      ] as const
    ).forEach((key) => {
      if (this.eligibilityDateInFuture(met[key])) {
        // @ts-expect-error TS cannot match the keys with their corresponding values here
        notMet[key] = met[key];
        delete met[key];
      }
    });

    return { met, notMet };
  }

  get requirements(): EligibilityReport["requirements"] {
    if (!this.eligibilityData) return this.staticRequirements;

    const sections: Array<RequirementsSectionContent> = [];

    const { trackedCriteria } = this.config.requirements.summary;
    const orderedCriteria = Object.keys(trackedCriteria);

    // run a separate formatting pipeline for each grouping
    // since they are processed a little differently
    const { met, notMet } = this.getRequirementsByStatus(this.eligibilityData);

    if (Object.keys(met).length) {
      sections.push({
        label: "Requirements you **have** met",
        icon: "Success",
        requirements: orderedCriteria
          .filter((key): key is keyof typeof met => key in met)
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
          .filter((key): key is keyof typeof notMet => key in notMet)
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
}
