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
import { action, makeAutoObservable, observable, set, toJS } from "mobx";

import { transform } from "../../core/Paperwork/US_TN/Transformer";
import { formatRelativeToNow } from "../../core/utils/timePeriod";
import {
  CompliantReportingEligibleRecord,
  CompliantReportingFinesFeesEligible,
  subscribeToCompliantReportingReferral,
} from "../../firestore";
import { formatWorkflowsDate, pluralizeWord } from "../../utils";
import { Client, UNKNOWN } from "../Client";
import {
  fieldToDate,
  observableSubscription,
  OpportunityValidationError,
  optionalFieldToDate,
  SubscriptionValue,
} from "../utils";
import { OTHER_KEY } from "../WorkflowsStore";
import {
  CompliantReportingReferralRecord,
  TransformedCompliantReportingReferral,
} from "./CompliantReportingReferralRecord";
import {
  DenialReasonsMap,
  Opportunity,
  OpportunityCriterion,
  OpportunityRequirement,
  OpportunityStatus,
  OpportunityType,
} from "./types";
import {
  defaultOpportunityStatuses,
  formatNoteDate,
  rankByReviewStatus,
} from "./utils";

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

// This could be configured externally once it's fleshed out
// to include all copy and other static data
const CRITERIA: Record<string, OpportunityCriterion> = {
  drug: {
    tooltip:
      "Policy requirement: Passed drug screen in the last 12 months for non-drug offenders. Passed 2 drug screens in last 12 months for drug offenders, most recent is negative.",
  },
  timeOnSupervision: {
    tooltip:
      "Policy requirement: On minimum supervision level for 1 year or medium level for 18 months.",
  },
  payments: {},
  compliance: {
    tooltip:
      "Policy requirement: Has reported as instructed without incident unless excused and documented by the officer.",
  },
  sanctions: {
    tooltip:
      "Policy requirement: No sanctions higher than Level 1 in the last 1 year.",
  },
  supervisionLevel: {
    tooltip: "Policy requirement: Currently on medium or minimum supervision.",
  },
  icots: {
    tooltip:
      "All misdemeanor cases and ICOTS minimum cases shall automatically transfer to Compliant Reporting after intake and after the completion of the risk needs assessment pursuant to Policy #704.01.1.",
  },
  arrests: {
    tooltip: "Policy requirement: No arrests in the last 1 year.",
  },
  specialConditions: {
    tooltip: "Policy requirement: Special conditions are current.",
  },
  currentOffenses: {
    tooltip:
      "Policy requirement: Offense type not domestic abuse or sexual assault, DUI in past 5 years, not crime against person that resulted in physical bodily harm, not crime where victim was under 18.",
  },
  lifetimeOffenses: {
    tooltip:
      "Policy requirement: If the offender has a previous conviction for one of the crimes listed in Section VI.(A)(3) but is not currently on supervision for one of those crimes, then the  DD shall make a case by case determination as to whether an offender is suitable for CR. The DD review process is waived if the expiration date is more than ten years old.",
  },
  pastOffenses: {
    tooltip:
      "If the offender has a previous conviction for one of the crimes listed in Section VI.(A)(3) but is not currently on supervision for one of those crimes, then the  DD shall make a case by case determination as to whether an offender is suitable for CR. The DD review process is waived if the expiration date is more than ten years old.",
  },
  zeroToleranceCodes: {
    tooltip:
      "If the person has received a zero tolerance code since starting their latest supervision, they may still be eligible for compliant reporting.",
  },
  missingSentences: {
    tooltip:
      "If the person is missing sentencing information, they may still be eligible for compliant reporting.",
  },
};

const DENIAL_REASONS_MAP = {
  DECF: "DECF: No effort to pay fine and costs",
  DECR: "DECR: Criminal record",
  DECT: "DECT: Insufficient time in supervision level",
  DEDF: "DEDF: No effort to pay fees",
  DEDU: "DEDU: Serious compliance problems ",
  DEIJ: "DEIJ: Not allowed per court",
  DEIR: "DEIR: Failure to report as instructed",
  [OTHER_KEY]: "Other, please specify a reason",
};

class CompliantReportingOpportunity implements Opportunity {
  client: Client;

  readonly type: OpportunityType = "compliantReporting";

  private record: CompliantReportingEligibleRecord;

  readonly denialReasonsMap: DenialReasonsMap;

  draftData: Partial<TransformedCompliantReportingReferral>;

  private fetchedCompliantReportingReferral: SubscriptionValue<CompliantReportingReferralRecord>;

  constructor(record: CompliantReportingEligibleRecord, client: Client) {
    makeAutoObservable<
      CompliantReportingOpportunity,
      "record" | "transformedRecord"
    >(this, {
      record: true,
      transformedRecord: true,
      draftData: true,
      setDataField: action,
    });

    this.client = client;
    this.record = record;
    this.denialReasonsMap = DENIAL_REASONS_MAP;
    this.draftData = observable<Partial<TransformedCompliantReportingReferral>>(
      {}
    );

    this.fetchedCompliantReportingReferral = observableSubscription((handler) =>
      subscribeToCompliantReportingReferral(this.client.recordId, (result) => {
        if (result) handler(result);
      })
    );
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
        sanctionsPastYear.map(({ ProposedSanction }) => ({
          type: ProposedSanction,
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
    const updates = this.client.opportunityUpdates.compliantReporting;

    if ((updates?.denial?.reasons?.length || 0) !== 0) {
      return "DENIED";
    }

    if (this.validAlmostEligibleKeys.length) {
      return "ALMOST";
    }

    if (updates?.completed) {
      return "COMPLETED";
    }

    if (updates?.referralForm) {
      return "IN_PROGRESS";
    }

    return "PENDING";
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
      if (this.client.opportunityUpdates.compliantReporting?.denial) {
        additionalText = ` (${this.client.opportunityUpdates.compliantReporting.denial.reasons.join(
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
    const { requirementAlmostMetMap } = this;

    const requirements: OpportunityRequirement[] = [];

    // Required supervision level
    requirements.push({
      text: `Currently on ${supervisionLevel.toLowerCase()} supervision level`,
      tooltip: CRITERIA.supervisionLevel.tooltip,
    });

    // required time on required supervision level

    if (eligibilityCategory === "c4") {
      requirements.push({
        text: "ICOTS",
        tooltip: CRITERIA.icots.tooltip,
      });
    } else if (!requirementAlmostMetMap.currentLevelEligibilityDate) {
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
      requirements.push({
        text: `On ${requiredSupervisionLevel} for ${formatRelativeToNow(
          // this date should only ever be missing for ICOTS cases,
          // since it's not actually part of their eligibility criteria
          eligibleLevelStart as Date
        )}`,
        tooltip: CRITERIA.timeOnSupervision.tooltip,
      });
    }

    // required arrest history
    requirements.push({
      text: `Negative arrest check on ${formatWorkflowsDate(
        mostRecentArrestCheck
      )}`,
      tooltip: CRITERIA.arrests.tooltip,
    });

    // required sanction history
    if (!requirementAlmostMetMap.seriousSanctionsEligibilityDate) {
      let sanctionsText: string;
      if (sanctionsPastYear.length) {
        sanctionsText = `Sanctions in the past year: ${sanctionsPastYear
          .map((s) => s.type)
          .join(", ")}`;
      } else {
        sanctionsText = "No sanctions in the past year";
      }
      requirements.push({
        text: sanctionsText,
        tooltip: CRITERIA.sanctions.tooltip,
      });
    }

    // required fee payment status
    if (!requirementAlmostMetMap.paymentNeeded) {
      let feeText =
        "Fee balance for current sentence less than $2,000 and has made payments on three consecutive months";
      if (finesFeesEligible === "exempt") {
        feeText = `Exemption: ${feeExemptions}`;
      } else if (finesFeesEligible === "low_balance") {
        feeText = "Fee balance less than $500";
      }
      requirements.push({ text: feeText, tooltip: CRITERIA.payments.tooltip });
    }

    // Required drug screen history
    if (!requirementAlmostMetMap.passedDrugScreenNeeded) {
      requirements.push({
        text: `Passed drug screens in last 12 months: ${
          drugScreensPastYear
            .map(
              ({ result, date }) => `${result} on ${formatWorkflowsDate(date)}`
            )
            .join("; ") || "None"
        }`,
        tooltip: CRITERIA.drug.tooltip,
      });
    }

    // required special conditions status

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
        // this can happen if we get an unexpected value;
        // provides a generic fallback
        specialConditionsText = "Special conditions up to date";
        break;
    }
    requirements.push({
      text: specialConditionsText,
      tooltip: CRITERIA.specialConditions.tooltip,
    });

    // required compliance history
    if (!requirementAlmostMetMap.recentRejectionCodes) {
      requirements.push({
        text: "No DECF, DEDF, DEDU, DEIO, DEIR codes in the last 3 months",
        tooltip: CRITERIA.compliance.tooltip,
      });
    }

    // required offense types
    requirements.push({
      text: `Valid current offense${currentOffenses.length !== 1 ? "s" : ""}: ${
        currentOffenses.join("; ") || "None"
      }`,
      tooltip: CRITERIA.currentOffenses.tooltip,
    });

    // required prior offense types
    let lifetimeOffensesText = "No lifetime offenses";
    if (lifetimeOffensesExpired.length) {
      lifetimeOffensesText = `Lifetime offense${
        lifetimeOffensesExpired.length !== 1 ? "s" : ""
      } expired 10+ years ago: ${lifetimeOffensesExpired.join("; ")}`;
    }
    requirements.push({
      text: lifetimeOffensesText,
      tooltip: CRITERIA.lifetimeOffenses.tooltip,
    });

    if (eligibilityCategory === "c2" && pastOffenses.length) {
      requirements.push({
        text: `Eligible with discretion: Prior offenses and lifetime offenses
        expired less than 10 years ago: ${pastOffenses.join("; ")}`,
        tooltip: CRITERIA.pastOffenses.tooltip,
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
        tooltip: CRITERIA.zeroToleranceCodes.tooltip,
      });
    }

    if (
      eligibilityCategory === "c3" &&
      currentOffenses.length === 0 &&
      pastOffenses.length === 0
    ) {
      requirements.push({
        text: "Eligible with discretion: Missing sentence information",
        tooltip: CRITERIA.missingSentences.tooltip,
      });
    }

    return requirements;
  }

  get requirementsAlmostMet(): OpportunityRequirement[] {
    const { validAlmostEligibleKeys } = this;
    if (!validAlmostEligibleKeys.length) return [];

    const configMap: Record<
      keyof AlmostEligibleCriteria,
      OpportunityCriterion
    > = {
      passedDrugScreenNeeded: CRITERIA.drug,
      currentLevelEligibilityDate: CRITERIA.timeOnSupervision,
      paymentNeeded: CRITERIA.payments,
      recentRejectionCodes: CRITERIA.compliance,
      seriousSanctionsEligibilityDate: CRITERIA.sanctions,
    };

    const requirements: OpportunityRequirement[] = [];
    validAlmostEligibleKeys.forEach((criterionKey) => {
      const text = this.requirementAlmostMetMap[criterionKey];
      // in practice this should always be true so this is mostly type safety
      if (text) {
        requirements.push({ text, tooltip: configMap[criterionKey].tooltip });
      }
    });

    return requirements;
  }

  private get almostEligibleCriteriaTransformed() {
    const {
      recentRejectionCodes,
      currentLevelEligibilityDate: currentLevelEligibilityDateString,
      passedDrugScreenNeeded,
      paymentNeeded,
      seriousSanctionsEligibilityDate: seriousSanctionsEligibilityDateString,
    } = this.record.almostEligibleCriteria ?? {};

    const currentLevelEligibilityDate = optionalFieldToDate(
      currentLevelEligibilityDateString
    );
    const currentLevelEligibilityDaysRemaining =
      currentLevelEligibilityDate &&
      differenceInCalendarDays(currentLevelEligibilityDate, new Date());

    const seriousSanctionsEligibilityDate = optionalFieldToDate(
      seriousSanctionsEligibilityDateString
    );
    const seriousSanctionsEligibilityDaysRemaining =
      seriousSanctionsEligibilityDate &&
      differenceInCalendarDays(seriousSanctionsEligibilityDate, new Date());

    return {
      passedDrugScreenNeeded,
      paymentNeeded,
      currentLevelEligibilityDate,
      currentLevelEligibilityDaysRemaining,
      seriousSanctionsEligibilityDate,
      seriousSanctionsEligibilityDaysRemaining,
      recentRejectionCodes,
    };
  }

  /**
   * Maps each possible almost-eligible criterion to a display value,
   * where valid data exists for this client.
   */
  private get requirementAlmostMetMap(): Partial<
    Record<keyof AlmostEligibleCriteria, string | undefined>
  > {
    const {
      almostEligibleCriteriaTransformed: {
        recentRejectionCodes,
        currentLevelEligibilityDaysRemaining,
        passedDrugScreenNeeded,
        paymentNeeded,
        seriousSanctionsEligibilityDaysRemaining,
      },
    } = this;

    return mapValues(
      toJS(this.record.almostEligibleCriteria),
      (value, key: keyof AlmostEligibleCriteria) => {
        switch (key) {
          case "passedDrugScreenNeeded":
            return passedDrugScreenNeeded
              ? "Needs one more passed drug screen"
              : undefined;
          case "paymentNeeded":
            return paymentNeeded
              ? "Needs balance <$500 or a payment three months in a row"
              : undefined;
          case "currentLevelEligibilityDate": {
            return currentLevelEligibilityDaysRemaining !== undefined
              ? `Needs ${currentLevelEligibilityDaysRemaining} more ${pluralizeWord(
                  currentLevelEligibilityDaysRemaining,
                  "day"
                )} on ${this.client.supervisionLevel.toLowerCase()}`
              : undefined;
          }
          case "seriousSanctionsEligibilityDate": {
            return seriousSanctionsEligibilityDaysRemaining !== undefined
              ? `Needs ${seriousSanctionsEligibilityDaysRemaining} more ${pluralizeWord(
                  seriousSanctionsEligibilityDaysRemaining,
                  "day"
                )} without sanction higher than level 1`
              : undefined;
          }
          case "recentRejectionCodes":
            return recentRejectionCodes?.length
              ? `Double check ${recentRejectionCodes.join("/")} contact note`
              : undefined;
          default:
            return assertNever(key);
        }
      }
    );
  }

  get printText(): string {
    if (this.client.formIsPrinting) {
      return "Printing PDF...";
    }

    if (this.client.opportunityUpdates?.compliantReporting?.completed) {
      return "Reprint PDF";
    }

    return "Print PDF";
  }

  get almostEligibleRecommendedNote():
    | { title: string; text: string }
    | undefined {
    // note functionality only supports a single missing criterion
    if (this.validAlmostEligibleKeys.length !== 1) return undefined;

    const missingCriterionKey = this.validAlmostEligibleKeys[0];

    const title = this.requirementAlmostMetMap[missingCriterionKey];
    // not expected to happen in practice but Typescript doesn't know that
    if (!title) return undefined;

    const {
      almostEligibleCriteriaTransformed: {
        currentLevelEligibilityDate,
        seriousSanctionsEligibilityDate,
      },
    } = this;

    let criterionSpecificCopy: string | undefined;
    switch (missingCriterionKey) {
      case "currentLevelEligibilityDate":
        criterionSpecificCopy =
          currentLevelEligibilityDate &&
          `stay on your current supervision level until ${formatNoteDate(
            currentLevelEligibilityDate
          )}`;
        break;
      case "passedDrugScreenNeeded":
        criterionSpecificCopy = "pass one drug screen";
        break;
      case "paymentNeeded":
        criterionSpecificCopy =
          "have a balance of less than $500 or make a payment three months in a row";
        break;
      case "recentRejectionCodes":
        // intentionally left blank; no note required in this case
        break;
      case "seriousSanctionsEligibilityDate":
        criterionSpecificCopy =
          seriousSanctionsEligibilityDate &&
          `don’t get any sanctions higher than level 1 until ${formatNoteDate(
            seriousSanctionsEligibilityDate
          )}`;
        break;
      default:
        break;
    }

    if (!criterionSpecificCopy) return undefined;

    const text = `Hey ${this.client.fullName.givenNames}, you’ve been doing well and are 
    almost eligible for Compliant Reporting, which would let you switch to telephone
    check-ins, rather than needing to report to the office. If you ${criterionSpecificCopy}, 
    you will meet all of the requirements and I can refer you.`.replace(
      /\s+/gm,
      " "
    );

    return { title, text };
  }

  get prefilledData(): Partial<TransformedCompliantReportingReferral> {
    const prefillSourceInformation = this.fetchedCompliantReportingReferral.current();

    if (prefillSourceInformation) {
      return transform(this.client, prefillSourceInformation);
    }

    return {};
  }

  get formData(): Partial<TransformedCompliantReportingReferral> {
    return { ...toJS(this.prefilledData), ...toJS(this.draftData) };
  }

  async setDataField(
    key: keyof TransformedCompliantReportingReferral | string,
    value: boolean | string | string[]
  ): Promise<void> {
    set(this.draftData, key, value);
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
