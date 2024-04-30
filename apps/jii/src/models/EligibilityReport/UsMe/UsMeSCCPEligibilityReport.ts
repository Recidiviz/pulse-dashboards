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

import { hydrateTemplate } from "../../../configs/hydrateTemplate";
import { OpportunityConfig } from "../../../configs/types";
import { EligibilityReport } from "../interface";

const APPLICATION_DATE_OFFSET_MONTHS = 3;

function cleanupInlineTemplate(s: string) {
  return s.trim().replaceAll(/\s+/g, " ");
}

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
    } = this;
    return {
      resident,
      config,
      eligibilityData,
      custom: {
        eligibilityDate,
        applicationDate,
      },
    };
  }

  get headline(): string {
    return cleanupInlineTemplate(
      hydrateTemplate(this.config.copy.headline, this.templateContext),
    );
  }

  get subheading(): string {
    return cleanupInlineTemplate(
      hydrateTemplate(this.config.copy.subheading, this.templateContext),
    );
  }

  private eligibilityDateInFuture(
    reason: { eligibleDate: Date } | undefined,
  ): boolean {
    if (!reason) return false;
    return isFuture(reason.eligibleDate);
  }

  get requirements(): EligibilityReport["requirements"] {
    if (!this.eligibilityData) {
      return { requirementsMet: [], requirementsNotMet: [] };
    }

    // step 1: separate eligible and ineligible (only an extra step for SCCP because of the application date issue)
    const met = { ...this.eligibilityData.eligibleCriteria };
    const notMet = { ...this.eligibilityData.ineligibleCriteria };
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

    // step 2: separate formatting pipeline for each category that runs the configs through handlebars or whatever
    const { trackedCriteria } = this.config.copy.requirements;
    const orderedCriteria = Object.keys(trackedCriteria);

    const requirementsMet: EligibilityReport["requirements"]["requirementsMet"] =
      orderedCriteria
        .filter((key) => key in met)
        .map((key) =>
          cleanupInlineTemplate(
            hydrateTemplate(trackedCriteria[key].criterion, {
              // this assertion is safe because we just filtered it above
              currentCriterion: met[key as keyof typeof met] ?? {},
            }),
          ),
        );

    const requirementsNotMet: EligibilityReport["requirements"]["requirementsNotMet"] =
      orderedCriteria
        .filter((key) => key in notMet)
        .map((key) =>
          mapValues(trackedCriteria[key], (template) =>
            template
              ? cleanupInlineTemplate(
                  hydrateTemplate(template, {
                    // this assertion is safe because we just filtered it above
                    currentCriterion: notMet[key as keyof typeof notMet] ?? {},
                  }),
                )
              : "",
          ),
        );

    return { requirementsMet, requirementsNotMet };
  }
}
