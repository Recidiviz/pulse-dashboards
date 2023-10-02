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

import assertNever from "assert-never";
import { add, differenceInCalendarDays, isEqual } from "date-fns";
import { mapValues } from "lodash";
import { makeObservable, toJS } from "mobx";

import { formatRelativeToNow } from "../../../../core/utils/timePeriod";
import { OpportunityProfileModuleName } from "../../../../core/WorkflowsClientProfile/OpportunityProfile";
import {
  FeatureGateError,
  OpportunityValidationError,
} from "../../../../errors";
import { OpportunityUpdateWithForm } from "../../../../FirestoreStore";
import { formatWorkflowsDate, pluralizeWord } from "../../../../utils";
import { Client } from "../../../Client";
import { OTHER_KEY } from "../../../utils";
import { CompliantReportingForm } from "../../Forms/CompliantReportingForm";
import { OpportunityBase } from "../../OpportunityBase";
import { OpportunityType } from "../../OpportunityConfigs";
import {
  DenialReasonsMap,
  OpportunityRequirement,
  OpportunityStatus,
} from "../../types";
import { formatNoteDate } from "../../utils";
import {
  AlmostEligibleCriteria,
  CompliantReportingDraftData,
  CompliantReportingReferralRecordFull,
  transformCompliantReportingReferral,
} from "./CompliantReportingReferralRecord";

// ranked roughly by actionability
export const COMPLIANT_REPORTING_ALMOST_CRITERIA_RANKED: (
  | keyof AlmostEligibleCriteria
  | keyof CompliantReportingReferralRecordFull["ineligibleCriteria"]
)[] = [
  "usTnFinesFeesEligible",
  "passedDrugScreenNeeded",
  "usTnNoRecentCompliantReportingRejections",
  "usTnNoHighSanctionsInPastYear",
  "currentLevelEligibilityDate",
];

/**
 * Clients with values other than these should not appear as eligible in the UI.
 */
const COMPLIANT_REPORTING_ACTIVE_CATEGORIES = ["c1", "c2", "c3", "c4"];

// This could be configured externally once it's fleshed out
// to include all copy and other static data
const CRITERIA: Record<string, Partial<OpportunityRequirement>> = {
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

type CompliantReportingUpdateRecord =
  OpportunityUpdateWithForm<CompliantReportingDraftData>;

const getRecordValidator =
  (client: Client) =>
  (record?: CompliantReportingReferralRecordFull): void => {
    if (!record) {
      throw new OpportunityValidationError("No opportunity record found");
    }
    const {
      eligibilityCategory,
      remainingCriteriaNeeded,
      almostEligibleCriteria,
    } = record;

    // only the explicitly allowed categories can be shown to users.
    // if any others are added they must be suppressed until explicitly enabled.
    if (!COMPLIANT_REPORTING_ACTIVE_CATEGORIES.includes(eligibilityCategory)) {
      throw new OpportunityValidationError("Unsupported eligibility category");
    }

    if (remainingCriteriaNeeded) {
      const definedAlmostEligibleKeys = almostEligibleCriteria
        ? (
            Object.keys(
              almostEligibleCriteria
            ) as (keyof AlmostEligibleCriteria)[]
          ).filter((key) => almostEligibleCriteria[key] !== undefined)
        : [];

      // almost eligible is currently defined as missing exactly one criterion
      if (remainingCriteriaNeeded > 1) {
        throw new OpportunityValidationError(`Too many remaining criteria`);
      }

      // drug screen criteria remain behind a feature gate while initial backstop analysis is ongoing
      if (
        definedAlmostEligibleKeys.includes("passedDrugScreenNeeded") &&
        !client.rootStore.workflowsStore.featureVariants
          .CompliantReportingAlmostEligible
      ) {
        throw new FeatureGateError("Missing drug screen feature disabled");
      }
    }
  };

const sanctionsAlmostEligibleText = (latestHighSanctionDate: Date) => {
  const seriousSanctionsEligibilityDate = add(latestHighSanctionDate, {
    years: 1,
  });
  const seriousSanctionsEligibilityDaysRemaining = differenceInCalendarDays(
    seriousSanctionsEligibilityDate,
    new Date()
  );
  return {
    text: `Needs ${seriousSanctionsEligibilityDaysRemaining} more ${pluralizeWord(
      "day",
      seriousSanctionsEligibilityDaysRemaining
    )} without sanction higher than level 1`,
    seriousSanctionsEligibilityDate,
  };
};

export class CompliantReportingOpportunity extends OpportunityBase<
  Client,
  CompliantReportingReferralRecordFull,
  CompliantReportingUpdateRecord
> {
  readonly type: OpportunityType = "compliantReporting";

  readonly denialReasonsMap: DenialReasonsMap;

  form: CompliantReportingForm;

  readonly isAlert = false;

  readonly policyOrMethodologyUrl =
    "https://drive.google.com/file/d/1YNAUTViqg_Pgt15KsZPUiNG11Dh2TTiB/view";

  readonly opportunityProfileModules: OpportunityProfileModuleName[] = [
    "SpecialConditions",
    "ClientProfileDetails",
    "ClientHousing",
    "FinesAndFees",
  ];

  constructor(client: Client) {
    super(
      client,
      "compliantReporting",
      client.rootStore,
      transformCompliantReportingReferral,
      getRecordValidator(client)
    );

    makeObservable<CompliantReportingOpportunity, "requirementAlmostMetMap">(
      this,
      {
        almostEligible: true,
        almostEligibleStatusMessage: true,
        requirementsMet: true,
        requirementsAlmostMet: true,
        requirementAlmostMetMap: true,
        almostEligibleRecommendedNote: true,
        validAlmostEligibleKeys: true,
      }
    );

    this.denialReasonsMap = DENIAL_REASONS_MAP;
    this.form = new CompliantReportingForm(this, client.rootStore);
  }

  get almostEligible(): boolean {
    return (
      this.validAlmostEligibleKeys.length > 0 ||
      Object.keys(this.record?.ineligibleCriteria ?? {}).length > 0
    );
  }

  get reviewStatus(): OpportunityStatus {
    const { updates, denial } = this;

    if ((denial?.reasons?.length || 0) !== 0) {
      return "DENIED";
    }

    if (this.almostEligible) {
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

  get almostEligibleStatusMessage(): string | undefined {
    if (!this.record) return undefined;

    const { validAlmostEligibleKeys, almostEligible } = this;

    if (!almostEligible) return;

    if (validAlmostEligibleKeys.length > 1) {
      return `Needs ${validAlmostEligibleKeys.length} updates`;
    }

    return this.requirementsAlmostMet[0]?.text ?? "Status unknown";
  }

  get requirementsMet(): OpportunityRequirement[] {
    if (!this.record) return [];
    const { supervisionLevel, supervisionLevelStart } = this.person;
    const {
      currentOffenses,
      drugScreensPastYear,
      eligibilityCategory,
      eligibleLevelStart,
      lastSpecialConditionsNote,
      lifetimeOffensesExpired,
      pastOffenses,
      specialConditionsFlag,
      specialConditionsTerminatedDate,
      zeroToleranceCodes,
      offenseTypeEligibility,
      eligibleCriteria,
      metadata,
    } = this.record;
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
        metadata.mostRecentArrestCheck.contactDate
      )}`,
      tooltip: CRITERIA.arrests.tooltip,
    });

    // required sanction history
    if (eligibleCriteria.usTnNoHighSanctionsInPastYear) {
      requirements.push({
        text: "No sanctions higher than Level 1 in the last year",
        tooltip: CRITERIA.sanctions.tooltip,
      });
    }

    // required fee payment status
    if (eligibleCriteria.usTnFinesFeesEligible) {
      let feeText =
        "Fee balance for current sentence less than $2,000 and has made payments on three consecutive months";
      const exemption =
        eligibleCriteria.usTnFinesFeesEligible.hasPermanentFinesFeesExemption?.currentExemptions.join(
          ", "
        );
      if (exemption) {
        feeText = `Exemption: ${exemption}`;
      } else if (
        eligibleCriteria.usTnFinesFeesEligible.hasFinesFeesBalanceBelow500
          .amountOwed <= 500
      ) {
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
    if (eligibleCriteria.usTnNoRecentCompliantReportingRejections) {
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

    if (offenseTypeEligibility === "2" && pastOffenses.length) {
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

    if (eligibilityCategory === "c3" && currentOffenses.length === 0) {
      requirements.push({
        text: "Eligible with discretion: Missing sentence information",
        tooltip: CRITERIA.missingSentences.tooltip,
      });
    }

    return requirements;
  }

  get requirementsAlmostMet(): OpportunityRequirement[] {
    if (!this.record) {
      return [];
    }

    const { ineligibleCriteria } = this.record;

    const requirements: OpportunityRequirement[] = [];
    if (ineligibleCriteria?.usTnFinesFeesEligible) {
      const text = "Needs balance <$500 or a payment three months in a row";
      requirements.push({ text, tooltip: CRITERIA.payments.tooltip });
    }

    const configMap: Record<
      keyof AlmostEligibleCriteria,
      Partial<OpportunityRequirement>
    > = {
      passedDrugScreenNeeded: CRITERIA.drug,
      currentLevelEligibilityDate: CRITERIA.timeOnSupervision,
    };

    const { validAlmostEligibleKeys } = this;
    validAlmostEligibleKeys.forEach((criterionKey) => {
      const text = this.requirementAlmostMetMap[criterionKey];
      // in practice this should always be true so this is mostly type safety
      if (text) {
        requirements.push({ text, tooltip: configMap[criterionKey].tooltip });
      }
    });

    if (ineligibleCriteria?.usTnNoRecentCompliantReportingRejections) {
      requirements.push({
        text: `Double check ${ineligibleCriteria?.usTnNoRecentCompliantReportingRejections.contactCode.join(
          "/"
        )} contact note`,
        tooltip: CRITERIA.compliance.tooltip,
      });
    }

    if (ineligibleCriteria?.usTnNoHighSanctionsInPastYear) {
      requirements.push({
        text: sanctionsAlmostEligibleText(
          ineligibleCriteria.usTnNoHighSanctionsInPastYear
            .latestHighSanctionDate
        ).text,
        tooltip: CRITERIA.sanctions.tooltip,
      });
    }

    return requirements;
  }

  /**
   * Maps each possible almost-eligible criterion to a display value,
   * where valid data exists for this client.
   */
  private get requirementAlmostMetMap(): Partial<
    Record<keyof AlmostEligibleCriteria, string | undefined>
  > {
    if (!this.record?.almostEligibleCriteria) {
      return {};
    }

    const { currentLevelEligibilityDate, passedDrugScreenNeeded } =
      this.record?.almostEligibleCriteria ?? {};

    const currentLevelEligibilityDaysRemaining = currentLevelEligibilityDate
      ? differenceInCalendarDays(currentLevelEligibilityDate, new Date())
      : undefined;

    return mapValues(
      toJS(this.record?.almostEligibleCriteria),
      (_value: unknown, key: keyof AlmostEligibleCriteria) => {
        switch (key) {
          case "passedDrugScreenNeeded":
            return passedDrugScreenNeeded
              ? "Needs one more passed drug screen"
              : undefined;
          case "currentLevelEligibilityDate": {
            return currentLevelEligibilityDaysRemaining !== undefined
              ? `Needs ${currentLevelEligibilityDaysRemaining} more ${pluralizeWord(
                  "day",
                  currentLevelEligibilityDaysRemaining
                )} on ${this.person.supervisionLevel.toLowerCase()}`
              : undefined;
          }
          default:
            return assertNever(key);
        }
      }
    );
  }

  get almostEligibleRecommendedNote():
    | { title: string; text: string }
    | undefined {
    if (!this.record) return undefined;

    const { ineligibleCriteria } = this.record;

    // note functionality only supports a single missing criterion
    if (
      this.validAlmostEligibleKeys.length +
        Object.keys(ineligibleCriteria).length !==
      1
    )
      return undefined;

    let criterionSpecificCopy: string | undefined;
    let title: string | undefined;
    if (ineligibleCriteria.usTnFinesFeesEligible) {
      title = "Needs balance <$500 or a payment three months in a row";
      criterionSpecificCopy =
        "have a balance of less than $500 or make a payment three months in a row";
    } else if (ineligibleCriteria.usTnNoHighSanctionsInPastYear) {
      const { text: sanctionsText, seriousSanctionsEligibilityDate } =
        sanctionsAlmostEligibleText(
          ineligibleCriteria.usTnNoHighSanctionsInPastYear
            .latestHighSanctionDate
        );
      title = sanctionsText;
      criterionSpecificCopy = `don’t get any sanctions higher than level 1 until ${formatNoteDate(
        seriousSanctionsEligibilityDate
      )}`;
    } else {
      const missingCriterionKey = this.validAlmostEligibleKeys[0];

      title = this.requirementAlmostMetMap[missingCriterionKey];
      // not expected to happen in practice but Typescript doesn't know that
      if (!title) return undefined;

      const { currentLevelEligibilityDate } =
        this.record?.almostEligibleCriteria ?? {};

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
        default:
          break;
      }
    }

    if (!criterionSpecificCopy) return undefined;

    const text =
      `Hey ${this.person.fullName.givenNames}, you’ve been doing well and are 
    almost eligible for Compliant Reporting, which would let you switch to telephone
    check-ins, rather than needing to report to the office. If you ${criterionSpecificCopy}, 
    you will meet all of the requirements and I can refer you.`.replace(
        /\s+/gm,
        " "
      );

    return { title, text };
  }

  get validAlmostEligibleKeys(): (keyof AlmostEligibleCriteria)[] {
    return (
      Object.keys(
        this.requirementAlmostMetMap
      ) as (keyof AlmostEligibleCriteria)[]
    ).filter((key) => this.requirementAlmostMetMap[key] !== undefined);
  }
}
