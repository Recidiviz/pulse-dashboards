// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import * as Sentry from "@sentry/react";
import assertNever from "assert-never";
import { differenceInCalendarDays, isEqual } from "date-fns";
import { mapValues } from "lodash";
import { makeAutoObservable, toJS } from "mobx";

import { formatRelativeToNow } from "../../core/utils/timePeriod";
import {
  CompliantReportingEligibleRecord,
  CompliantReportingFinesFeesEligible,
} from "../../firestore";
import { formatWorkflowsDate } from "../../utils";
import { Client, UNKNOWN } from "../Client";
import {
  fieldToDate,
  OpportunityValidationError,
  optionalFieldToDate,
} from "../utils";
import {
  Opportunity,
  OpportunityRequirement,
  OpportunityStatus,
  OpportunityType,
} from "./types";
import { defaultOpportunityStatuses, rankByReviewStatus } from "./utils";

type AlmostEligibleCriteria = {
  currentLevelEligibilityDate?: Date;
  passedDrugScreenNeeded?: boolean;
  paymentNeeded?: boolean;
  recentRejectionCodes?: string[];
  seriousSanctionsEligibilityDate?: Date;
};

type CompliantReportingRecordTransformed = {
  eligibilityCategory: string;
  /** Any number greater than zero indicates the client is _almost_ eligible. */
  remainingCriteriaNeeded: number;
  eligibleLevelStart?: Date;
  currentOffenses: string[];
  lifetimeOffensesExpired: string[];
  judicialDistrict: string;
  drugScreensPastYear: { result: string; date: Date }[];
  sanctionsPastYear: { type: string }[];
  mostRecentArrestCheck?: Date;
  finesFeesEligible: CompliantReportingFinesFeesEligible;
  pastOffenses: string[];
  zeroToleranceCodes: { contactNoteType: string; contactNoteDate: Date }[];
  almostEligibleCriteria?: AlmostEligibleCriteria;
};

// ranked roughly by actionability
const COMPLIANT_REPORTING_ALMOST_CRITERIA_RANKED: (keyof AlmostEligibleCriteria)[] = [
  "paymentNeeded",
  "passedDrugScreenNeeded",
  "recentRejectionCodes",
  "seriousSanctionsEligibilityDate",
  "currentLevelEligibilityDate",
];

/**
 * Clients with values other than these should not appear as eligible in the UI.
 */
const COMPLIANT_REPORTING_ACTIVE_CATEGORIES = ["c1", "c2", "c3", "c4"];

export class CompliantReportingOpportunity implements Opportunity {
  client: Client;

  readonly type: OpportunityType = "compliantReporting";

  private record: CompliantReportingEligibleRecord;

  constructor(record: CompliantReportingEligibleRecord, client: Client) {
    makeAutoObservable<
      CompliantReportingOpportunity,
      "record" | "transformedRecord"
    >(this, {
      record: true,
      transformedRecord: true,
    });

    this.client = client;
    this.record = record;
  }

  private get transformedRecord() {
    const {
      almostEligibleCriteria,
      currentOffenses,
      drugScreensPastYear,
      eligibilityCategory,
      eligibleLevelStart,
      finesFeesEligible,
      judicialDistrict,
      lifetimeOffensesExpired,
      mostRecentArrestCheck,
      pastOffenses,
      remainingCriteriaNeeded,
      sanctionsPastYear,
      zeroToleranceCodes,
    } = this.record;

    const transformedRecord: CompliantReportingRecordTransformed = {
      eligibilityCategory,
      remainingCriteriaNeeded: remainingCriteriaNeeded ?? 0,
      eligibleLevelStart: optionalFieldToDate(eligibleLevelStart),
      currentOffenses,
      lifetimeOffensesExpired,
      judicialDistrict: judicialDistrict ?? UNKNOWN,
      drugScreensPastYear: drugScreensPastYear.map(({ result, date }) => ({
        result,
        date: fieldToDate(date),
      })),
      sanctionsPastYear:
        sanctionsPastYear.map((type) => ({
          type,
        })) || [],
      mostRecentArrestCheck: optionalFieldToDate(mostRecentArrestCheck),
      finesFeesEligible,
      pastOffenses,
      zeroToleranceCodes:
        zeroToleranceCodes?.map(({ contactNoteDate, contactNoteType }) => ({
          contactNoteType,
          contactNoteDate: new Date(contactNoteDate),
        })) ?? [],
    };

    if (almostEligibleCriteria) {
      const {
        currentLevelEligibilityDate,
        passedDrugScreenNeeded,
        paymentNeeded,
        recentRejectionCodes,
        seriousSanctionsEligibilityDate,
      } = almostEligibleCriteria;

      transformedRecord.almostEligibleCriteria = {
        currentLevelEligibilityDate: optionalFieldToDate(
          currentLevelEligibilityDate
        ),
        passedDrugScreenNeeded,
        paymentNeeded,
        recentRejectionCodes,
        seriousSanctionsEligibilityDate: optionalFieldToDate(
          seriousSanctionsEligibilityDate
        ),
      };
    }
    return transformedRecord;
  }

  /**
   * Throws OpportunityValidationError if it detects any condition in external configuration
   * or the object's input or output that indicates this Opportunity should be excluded.
   * This may be due to feature gating rather than any actual problem with the input data.
   * Don't call this in the constructor because it causes MobX to explode!
   */
  validate(): void {
    const {
      eligibilityCategory,
      remainingCriteriaNeeded,
    } = this.transformedRecord;

    // only the explicitly allowed categories can be shown to users.
    // if any others are added they must be suppressed until explicitly enabled.
    if (!COMPLIANT_REPORTING_ACTIVE_CATEGORIES.includes(eligibilityCategory)) {
      throw new OpportunityValidationError("Unsupported eligibility category");
    }

    if (remainingCriteriaNeeded) {
      if (
        !this.client.rootStore.workflowsStore.featureVariants
          .CompliantReportingAlmostEligible
      ) {
        throw new OpportunityValidationError(
          "Almost-eligible feature disabled"
        );
      }

      // this is a critical error if we expect an almost-eligible client
      // but don't have any valid criteria to report, because it could result in the
      // client being erroneously marked eligible
      if (this.validAlmostEligibleKeys.length === 0) {
        throw new OpportunityValidationError(
          "Missing required valid almost-eligible criteria"
        );
      }

      if (
        this.validAlmostEligibleKeys.length !==
        this.record.remainingCriteriaNeeded
      ) {
        // we can recover from this by displaying the valid criteria that remain,
        // but it should be logged for investigation
        Sentry.captureException(
          new OpportunityValidationError(
            `Expected ${this.record.remainingCriteriaNeeded} valid almost-criteria 
            for client ${this.client.pseudonymizedId} but only produced 
            ${this.validAlmostEligibleKeys.length}`
          )
        );
      }
      // almost defined for now as missing exactly one criterion
      if (remainingCriteriaNeeded > 1) {
        throw new OpportunityValidationError("Too many remaining criteria");
      }
    }
  }

  get almostEligible(): boolean {
    return this.validAlmostEligibleKeys.length > 0;
  }

  get rank(): number {
    if (this.almostEligible) {
      // sort denials to the bottom
      if (this.reviewStatus === "DENIED") {
        return COMPLIANT_REPORTING_ALMOST_CRITERIA_RANKED.length;
      }
      return Math.min(
        ...this.validAlmostEligibleKeys.map((key) =>
          COMPLIANT_REPORTING_ALMOST_CRITERIA_RANKED.indexOf(key)
        )
      );
    }

    return rankByReviewStatus(this);
  }

  get reviewStatus(): OpportunityStatus {
    let status: OpportunityStatus;

    const updates = this.client.updates?.compliantReporting;

    if ((updates?.denial?.reasons?.length || 0) !== 0) {
      status = "DENIED";
    } else if (this.validAlmostEligibleKeys.length) {
      status = "ALMOST";
    } else if (updates) {
      if (updates.completed) {
        status = "COMPLETED";
      } else {
        status = "IN_PROGRESS";
      }
    } else {
      status = "PENDING";
    }

    return status;
  }

  get statusMessageShort(): string {
    return defaultOpportunityStatuses[this.reviewStatus];
  }

  get statusMessageLong(): string {
    const {
      validAlmostEligibleKeys,
      reviewStatus,
      almostEligible,
      requirementAlmostMetMap,
    } = this;

    if (reviewStatus === "DENIED") {
      const baseMessage = defaultOpportunityStatuses[reviewStatus];
      let additionalText = "";
      if (this.client.updates?.compliantReporting?.denial) {
        additionalText = ` (${this.client.updates.compliantReporting.denial.reasons.join(
          ", "
        )})`;
      }
      return `${baseMessage}${additionalText}`;
    }

    if (!almostEligible) {
      return defaultOpportunityStatuses[reviewStatus];
    }

    if (validAlmostEligibleKeys.length > 1) {
      return `Needs ${validAlmostEligibleKeys.length} updates`;
    }

    // from here on we expect there is only one valid criterion
    // so we can stop as soon as we find it
    const criterion = validAlmostEligibleKeys[0];
    return (
      requirementAlmostMetMap[criterion] ??
      // in practice we do not expect this to ever happen
      // because we will catch these cases upstream
      "Status unknown"
    );
  }

  get requirementsMet(): OpportunityRequirement[] {
    const {
      supervisionLevel,
      supervisionLevelStart,
      specialConditionsFlag,
      lastSpecialConditionsNote,
      specialConditionsTerminatedDate,
      feeExemptions,
    } = this.client;
    const {
      eligibilityCategory,
      eligibleLevelStart,
      sanctionsPastYear,
      drugScreensPastYear,
      currentOffenses,
      lifetimeOffensesExpired,
      mostRecentArrestCheck,
      finesFeesEligible,
      pastOffenses,
      zeroToleranceCodes,
    } = this.transformedRecord;

    // current level by default
    let requiredSupervisionLevel = `${supervisionLevel.toLowerCase()} supervision`;
    // if eligible start is not the same as current level start,
    // this indicates they moved up or down a level but qualify under medium
    if (
      supervisionLevelStart &&
      eligibleLevelStart &&
      !isEqual(supervisionLevelStart, eligibleLevelStart)
    ) {
      requiredSupervisionLevel = "medium supervision or less";
    }

    let supervisionDurationText: string;
    let supervisionDurationTooltip: string;
    if (eligibilityCategory === "c4") {
      supervisionDurationText = "ICOTS";
      supervisionDurationTooltip = `All misdemeanor cases and ICOTS minimum cases shall automatically 
      transfer to Compliant Reporting after intake and after the completion of the risk needs 
      assessment pursuant to Policy #704.01.1.`;
    } else {
      supervisionDurationText = `On ${requiredSupervisionLevel} for ${formatRelativeToNow(
        // this date should only ever be missing for ICOTS cases,
        // since it's not actually part of their eligibility criteria
        eligibleLevelStart as Date
      )}`;
      supervisionDurationTooltip = `Policy requirement: On minimum supervision level for 1 year
      or medium level for 18 months.`;
    }

    let feeText =
      "Fee balance for current sentence less than $2,000 and has made payments on three consecutive months";
    if (finesFeesEligible === "exempt") {
      feeText = `Exemption: ${feeExemptions}`;
    } else if (finesFeesEligible === "low_balance") {
      feeText = "Fee balance less than $500";
    }

    // legacy version
    let specialConditionsText: string;

    switch (specialConditionsFlag) {
      case "current":
        specialConditionsText = `Special conditions up to date, last SPEC on ${formatWorkflowsDate(
          lastSpecialConditionsNote
        )}`;
        break;
      case "none":
        specialConditionsText = "No special conditions";
        break;
      case "terminated":
        specialConditionsText = `SPET on ${formatWorkflowsDate(
          specialConditionsTerminatedDate
        )}`;
        break;
      default:
        // this can happen while schema is in transition, or if we get an unexpected value;
        // provides a generic fallback
        specialConditionsText = "Special conditions up to date";
        break;
    }

    let sanctionsText: string;
    if (sanctionsPastYear.length) {
      sanctionsText = `Sanctions in the past year: ${sanctionsPastYear
        .map((s) => s.type)
        .join(", ")}`;
    } else {
      sanctionsText = "No sanctions in the past year";
    }

    let lifetimeOffensesText = "No lifetime offenses";
    if (lifetimeOffensesExpired.length) {
      lifetimeOffensesText = `Lifetime offense${
        lifetimeOffensesExpired.length !== 1 ? "s" : ""
      } expired 10+ years ago: ${lifetimeOffensesExpired.join("; ")}`;
    }

    const requirements = [
      {
        text: `Currently on ${supervisionLevel.toLowerCase()} supervision level`,
        tooltip:
          "Policy requirement: Currently on medium or minimum supervision.",
      },
      {
        text: supervisionDurationText,
        tooltip: supervisionDurationTooltip,
      },
      {
        text: `Negative arrest check on ${formatWorkflowsDate(
          mostRecentArrestCheck
        )}`,
        tooltip: "Policy requirement: No arrests in the last 1 year.",
      },
      {
        text: sanctionsText,
        tooltip:
          "Policy requirement: No sanctions higher than Level 1 in the last 1 year.",
      },
      {
        text: feeText,
      },
      {
        text: `Passed drug screens in last 12 months: ${
          drugScreensPastYear
            .map(
              ({ result, date }) => `${result} on ${formatWorkflowsDate(date)}`
            )
            .join("; ") || "None"
        }`,
        tooltip: `Policy requirement: Passed drug screen in the last 12 months for non-drug offenders.
        Passed 2 drug screens in last 12 months for drug offenders, most recent is negative.`,
      },
      {
        text: specialConditionsText,
        tooltip: "Policy requirement: Special conditions are current.",
      },
      {
        text: "No DECF, DEDF, DEDU, DEIO, DEIR codes in the last 3 months",
        tooltip: `Policy requirement: Has reported as instructed without incident unless excused
        and documented by the officer.`,
      },
      {
        text: `Valid current offense${
          currentOffenses.length !== 1 ? "s" : ""
        }: ${currentOffenses.join("; ") || "None"}`,
        tooltip: `Policy requirement: Offense type not domestic abuse or sexual assault,
        DUI in past 5 years, not crime against person that resulted in physical bodily harm,
        not crime where victim was under 18.`,
      },
      {
        text: lifetimeOffensesText,
        tooltip: `Policy requirement: If the offender has a previous conviction for one of
        the crimes listed in Section VI.(A)(3) but is not currently on supervision for one
        of those crimes, then the  DD shall make a case by case determination as to whether
        an offender is suitable for CR. The DD review process is waived if the expiration date
        is more than ten years old.`,
      },
    ];

    if (eligibilityCategory === "c2" && pastOffenses.length) {
      requirements.push({
        text: `Eligible with discretion: Prior offenses and lifetime offenses
        expired less than 10 years ago: ${pastOffenses.join("; ")}`,
        tooltip: `If the offender has a previous conviction for one of the crimes listed in
        Section VI.(A)(3) but is not currently on supervision for one of those crimes,
        then the  DD shall make a case by case determination as to whether an offender
        is suitable for CR. The DD review process is waived if the expiration date is
        more than ten years old.`,
      });
    }

    if (eligibilityCategory === "c3" && zeroToleranceCodes.length) {
      requirements.push({
        text: `Eligible with discretion: Previous zero-tolerance codes ${zeroToleranceCodes
          .map(
            ({ contactNoteDate, contactNoteType }) =>
              `${contactNoteType} on ${formatWorkflowsDate(contactNoteDate)}`
          )
          .join("; ")}`,
        tooltip: `If the person has received a zero tolerance code since starting their
          latest supervision, they may still be eligible for compliant reporting.`,
      });
    }

    if (
      eligibilityCategory === "c3" &&
      currentOffenses.length === 0 &&
      pastOffenses.length === 0
    ) {
      requirements.push({
        text: "Eligible with discretion: Missing sentence information",
        tooltip: `If the person is missing sentencing information, they may still be
            eligible for compliant reporting.`,
      });
    }

    return requirements;
  }

  get requirementsAlmostMet(): OpportunityRequirement[] {
    const { validAlmostEligibleKeys } = this;
    if (!validAlmostEligibleKeys.length) return [];
    // TODO(#13264): implement this!
    return [];
  }

  /**
   * Maps each possible almost-eligible criterion to a display value,
   * where valid data exists for this client.
   */
  private get requirementAlmostMetMap(): Partial<
    Record<keyof AlmostEligibleCriteria, string | undefined>
  > {
    return mapValues(
      toJS(this.record.almostEligibleCriteria),
      (value, key: keyof AlmostEligibleCriteria) => {
        switch (key) {
          case "passedDrugScreenNeeded":
            return value ? "Needs one more passed drug screen" : undefined;
          case "paymentNeeded":
            return value ? "Needs one more payment" : undefined;
          case "currentLevelEligibilityDate":
            return value instanceof Date
              ? `Needs ${differenceInCalendarDays(
                  value,
                  new Date()
                )} more days on ${this.client.supervisionLevel}`
              : undefined;
          case "seriousSanctionsEligibilityDate":
            return value instanceof Date
              ? `Needs ${differenceInCalendarDays(
                  value,
                  new Date()
                )} more days without sanction higher than level 1`
              : undefined;
          case "recentRejectionCodes":
            return Array.isArray(value) && value.length
              ? `Double check ${value.join("/")} contact note`
              : undefined;
          default:
            return assertNever(key);
        }
      }
    );
  }

  private get validAlmostEligibleKeys() {
    return (Object.keys(
      this.requirementAlmostMetMap
    ) as (keyof AlmostEligibleCriteria)[]).filter(
      (key) => this.requirementAlmostMetMap[key] !== undefined
    );
  }
}

/**
 * Returns an `Opportunity` if the provided data indicates the client is eligible or almost eligible
 */
export function createCompliantReportingOpportunity(
  record: CompliantReportingEligibleRecord | undefined,
  client: Client
): CompliantReportingOpportunity | undefined {
  if (!record) return undefined;

  try {
    const opp = new CompliantReportingOpportunity(record, client);
    opp.validate();
    return opp;
  } catch (e) {
    // constructor performs further validation that may fail
    if (e instanceof OpportunityValidationError) {
      return undefined;
    }
    // don't handle anything unexpected, it's probably a bug!
    throw e;
  }
}
