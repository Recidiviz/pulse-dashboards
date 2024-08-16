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

import { add, differenceInCalendarDays, isEqual } from "date-fns";
import { makeObservable, override } from "mobx";

import { formatRelativeToNow } from "../../../../core/utils/timePeriod";
import { OpportunityValidationError } from "../../../../errors";
import { OpportunityUpdateWithForm } from "../../../../FirestoreStore";
import { formatWorkflowsDate, pluralizeWord } from "../../../../utils";
import { Client } from "../../../Client";
import { CompliantReportingForm } from "../../Forms/CompliantReportingForm";
import { OpportunityBase } from "../../OpportunityBase";
import { OpportunityType } from "../../OpportunityType/types";
import { OpportunityRequirement, OpportunityStatus } from "../../types";
import { formatNoteDate } from "../../utils/caseNotesUtils";
import {
  CompliantReportingDraftData,
  CompliantReportingReferralRecord,
  compliantReportingSchema,
} from "./CompliantReportingReferralRecord";

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

type CompliantReportingUpdateRecord =
  OpportunityUpdateWithForm<CompliantReportingDraftData>;

const getRecordValidator =
  (client: Client) =>
  (record?: CompliantReportingReferralRecord): void => {
    if (!record) {
      throw new OpportunityValidationError("No opportunity record found");
    }
  };

const currentLevelAlmostEligibleText = (
  eligibleDate: Date,
  supervisionLevel: string,
) => {
  const currentLevelEligibilityDaysRemaining = differenceInCalendarDays(
    eligibleDate,
    new Date(),
  );
  return `Needs ${currentLevelEligibilityDaysRemaining} more ${pluralizeWord(
    "day",
    currentLevelEligibilityDaysRemaining,
  )} on ${supervisionLevel.toLowerCase()}`;
};

const sanctionsAlmostEligibleText = (latestHighSanctionDate: Date) => {
  const seriousSanctionsEligibilityDate = add(latestHighSanctionDate, {
    years: 1,
  });
  const seriousSanctionsEligibilityDaysRemaining = differenceInCalendarDays(
    seriousSanctionsEligibilityDate,
    new Date(),
  );
  return {
    text: `Needs ${seriousSanctionsEligibilityDaysRemaining} more ${pluralizeWord(
      "day",
      seriousSanctionsEligibilityDaysRemaining,
    )} without sanction higher than level 1`,
    seriousSanctionsEligibilityDate,
  };
};

export class CompliantReportingOpportunity extends OpportunityBase<
  Client,
  CompliantReportingReferralRecord,
  CompliantReportingUpdateRecord
> {
  readonly type: OpportunityType = "compliantReporting";

  form: CompliantReportingForm;

  constructor(client: Client) {
    super(
      client,
      "compliantReporting",
      client.rootStore,
      compliantReportingSchema.parse,
      getRecordValidator(client),
    );

    makeObservable<CompliantReportingOpportunity>(this, {
      almostEligibleStatusMessage: true,
      requirementsMet: override,
      requirementsAlmostMet: override,
      almostEligibleRecommendedNote: true,
    });

    this.form = new CompliantReportingForm(this, client.rootStore);
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

    const { almostEligible } = this;

    if (!almostEligible) return;

    return this.requirementsAlmostMet[0]?.text ?? "Status unknown";
  }

  get requirementsMet(): OpportunityRequirement[] {
    if (!this.record) return [];
    const { supervisionLevel, supervisionLevelStart } = this.person;
    const {
      eligibleCriteria,
      metadata,
      formInformation: { currentOffenses },
    } = this.record;

    const requirements: OpportunityRequirement[] = [];

    // Required supervision level
    requirements.push({
      text: `Currently on ${supervisionLevel.toLowerCase()} supervision level`,
      tooltip: CRITERIA.supervisionLevel.tooltip,
    });

    // required time on required supervision level

    if (eligibleCriteria.usTnOnEligibleLevelForSufficientTime) {
      // current level by default
      let requiredSupervisionLevel = `${supervisionLevel.toLowerCase()} supervision`;
      // if eligible start is not the same as current level start,
      // this indicates they moved up or down a level but qualify under medium
      const eligibleLevelStart =
        eligibleCriteria.usTnOnEligibleLevelForSufficientTime
          .startDateOnEligibleLevel;
      if (
        supervisionLevelStart &&
        !isEqual(supervisionLevelStart, eligibleLevelStart)
      ) {
        requiredSupervisionLevel = "medium supervision or less";
      }
      requirements.push({
        text: `On ${requiredSupervisionLevel} for ${formatRelativeToNow(
          eligibleLevelStart,
        )}`,
        tooltip: CRITERIA.timeOnSupervision.tooltip,
      });
    }

    // required arrest history
    requirements.push({
      text: `Negative arrest check on ${formatWorkflowsDate(
        metadata.mostRecentArrestCheck.contactDate,
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
          ", ",
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
    const drugScreensPastYear =
      eligibleCriteria.usTnPassedDrugScreenCheck
        .hasAtLeast1NegativeDrugTestPastYear;
    requirements.push({
      text: `Passed drug screens in last 12 months: ${
        drugScreensPastYear
          .map(
            ({ negativeScreenDate, negativeScreenResult }) =>
              `${negativeScreenResult} on ${formatWorkflowsDate(
                negativeScreenDate,
              )}`,
          )
          .join("; ") || "None"
      }`,
      tooltip: CRITERIA.drug.tooltip,
    });

    // required special conditions status

    let specialConditionsText: string;

    switch (metadata.mostRecentSpeNote?.contactType) {
      case "SPEC":
        specialConditionsText = `Special conditions up to date, last SPEC on ${formatWorkflowsDate(
          metadata.mostRecentSpeNote.contactDate,
        )}`;
        break;
      case "SPET":
        specialConditionsText = `SPET on ${formatWorkflowsDate(
          metadata.mostRecentSpeNote.contactDate,
        )}`;
        break;
      default:
        specialConditionsText = "No special conditions";
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
      text: `Valid current offense${
        currentOffenses?.length !== 1 ? "s" : ""
      }: ${currentOffenses?.join("; ") || "None"}`,
      tooltip: CRITERIA.currentOffenses.tooltip,
    });

    // required prior offense types
    const { usTnIneligibleOffensesExpired } = eligibleCriteria;
    if (usTnIneligibleOffensesExpired === null) {
      let ineligibleOffensesText = "No expired ineligible offenses";
      const { ineligibleOffensesExpired } = metadata;
      if (ineligibleOffensesExpired.length) {
        ineligibleOffensesText = `Ineligible offense${
          ineligibleOffensesExpired.length !== 1 ? "s" : ""
        } expired 10+ years ago: ${ineligibleOffensesExpired.join("; ")}`;
      }
      requirements.push({
        text: ineligibleOffensesText,
        tooltip: CRITERIA.lifetimeOffenses.tooltip,
      });
    } else if (usTnIneligibleOffensesExpired) {
      requirements.push({
        text: `Eligible with discretion: Ineligible offenses expired less than 10 years ago: ${usTnIneligibleOffensesExpired
          .map(
            ({ ineligibleOffense, relevantDate }) =>
              `${ineligibleOffense} (Projected Completion Date: ${formatWorkflowsDate(
                relevantDate,
              )})`,
          )
          .join("; ")}`,
        tooltip: CRITERIA.pastOffenses.tooltip,
      });
    }

    const { usTnNotServingUnknownCrOffense } = eligibleCriteria;
    if (usTnNotServingUnknownCrOffense) {
      requirements.push({
        text: `Eligible with discretion: Unknown offenses: ${usTnNotServingUnknownCrOffense
          .map(
            ({ ineligibleOffense, relevantDate }) =>
              `${ineligibleOffense} (Projected Completion Date: ${formatWorkflowsDate(
                relevantDate,
              )})`,
          )
          .join("; ")}`,
        tooltip: CRITERIA.pastOffenses.tooltip,
      });
    }

    const { usTnNoPriorRecordWithIneligibleCrOffense } = eligibleCriteria;
    if (usTnNoPriorRecordWithIneligibleCrOffense) {
      requirements.push({
        text: `Eligible with discretion: Ineligible offenses in prior record (expiration date unknown): ${usTnNoPriorRecordWithIneligibleCrOffense
          .map(
            ({ ineligibleOffense, relevantDate }) =>
              `${ineligibleOffense} (Offense Date: ${formatWorkflowsDate(
                relevantDate,
              )})`,
          )
          .join("; ")}`,
        tooltip: CRITERIA.pastOffenses.tooltip,
      });
    }

    const zeroToleranceCodeDates =
      eligibleCriteria.usTnNoZeroToleranceCodesSpans?.zeroToleranceCodeDates;
    if (zeroToleranceCodeDates?.length) {
      requirements.push({
        text: `Eligible with discretion: Previous zero-tolerance codes on ${zeroToleranceCodeDates
          .map((d) => formatWorkflowsDate(d))
          .join("; ")}`,
        tooltip: CRITERIA.zeroToleranceCodes.tooltip,
      });
    }

    if (
      !eligibleCriteria.hasActiveSentence.hasActiveSentence ||
      // TODO(Recidiviz/recidiviz-data#28110): Have current offenses be part of the criteria
      !currentOffenses?.length
    ) {
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

    if (ineligibleCriteria?.usTnOnEligibleLevelForSufficientTime) {
      requirements.push({
        text: currentLevelAlmostEligibleText(
          ineligibleCriteria.usTnOnEligibleLevelForSufficientTime.eligibleDate,
          this.person.supervisionLevel,
        ),
        tooltip: CRITERIA.timeOnSupervision.tooltip,
      });
    }

    if (ineligibleCriteria?.usTnNoRecentCompliantReportingRejections) {
      requirements.push({
        text: `Double check ${ineligibleCriteria?.usTnNoRecentCompliantReportingRejections.contactCode.join(
          "/",
        )} contact note`,
        tooltip: CRITERIA.compliance.tooltip,
      });
    }

    if (ineligibleCriteria?.usTnNoHighSanctionsInPastYear) {
      requirements.push({
        text: sanctionsAlmostEligibleText(
          ineligibleCriteria.usTnNoHighSanctionsInPastYear
            .latestHighSanctionDate,
        ).text,
        tooltip: CRITERIA.sanctions.tooltip,
      });
    }

    return requirements;
  }

  get almostEligibleRecommendedNote():
    | { title: string; text: string }
    | undefined {
    if (!this.record) return undefined;

    const { ineligibleCriteria } = this.record;

    // note functionality only supports a single missing criterion
    if (Object.keys(ineligibleCriteria).length !== 1) return undefined;

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
            .latestHighSanctionDate,
        );
      title = sanctionsText;
      criterionSpecificCopy = `don’t get any sanctions higher than level 1 until ${formatNoteDate(
        seriousSanctionsEligibilityDate,
      )}`;
    } else if (ineligibleCriteria.usTnOnEligibleLevelForSufficientTime) {
      const { eligibleDate } =
        ineligibleCriteria.usTnOnEligibleLevelForSufficientTime;
      title = currentLevelAlmostEligibleText(
        eligibleDate,
        this.person.supervisionLevel,
      );
      criterionSpecificCopy = `stay on your current supervision level until ${formatNoteDate(
        eligibleDate,
      )}`;
    } else {
      return undefined;
    }

    if (!criterionSpecificCopy) return undefined;

    const text =
      `Hey ${this.person.fullName.givenNames}, you’ve been doing well and are 
    almost eligible for Compliant Reporting, which would let you switch to telephone
    check-ins, rather than needing to report to the office. If you ${criterionSpecificCopy}, 
    you will meet all of the requirements and I can refer you.`.replace(
        /\s+/gm,
        " ",
      );

    return { title, text };
  }
}
