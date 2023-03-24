/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2023 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 */

import { isPast } from "date-fns";
import { makeObservable } from "mobx";

import { OpportunityProfileModuleName } from "../../core/WorkflowsClientProfile/OpportunityProfile";
import { Client } from "../Client";
import { TransformFunction } from "../subscriptions";
import { fieldToDate, OTHER_KEY } from "../utils";
import { OpportunityBase } from "./OpportunityBase";
import { OpportunityRequirement } from "./types";

type SharedCriteria = {
  supervisionPastHalfFullTermReleaseDate: { eligibleDate: Date };
  supervisionNotPastFullTermCompletionDate: { eligibleDate: Date };
  usMiNoActivePpo: { activePpo: boolean };
  usMiNoNewIneligibleOffensesForEarlyDischargeFromSupervision: {
    latestIneligibleConvictions: Date[];
  };
};

type ParoleDualCriteria = {
  supervisionLevelIsNotHigh: { supervisionLevel: string };
  servingAtLeastOneYearOnParoleSupervision: {
    projectedCompletionDateMax: Date;
  };
  usMiParoleDualSupervisionPastEarlyDischargeDate: {
    sentenceType: string;
    eligibleDate: Date;
  };
  usMiNoPendingDetainer: { pendingDetainer: boolean };
  usMiNotServingIneligibleOffensesForEarlyDischargeFromParoleDualSupervision: {
    ineligibleOffenses: string[];
  };
  usMiSupervisionLevelIsNotSai: { supervisionLevelIsSai: boolean };
  usMiNoOwiViolationOnParoleDualSupervision: {
    latestIneligibleConvictions: Date[];
  };
};

type ProbationCriteria = {
  usMiNotServingIneligibleOffensesFromEarlyDischargeFromProbationSupervision: {
    ineligibleOffenses: string[];
  };
};

export type UsMiEarlyDischargeReferralRecord = {
  criteria: SharedCriteria & ParoleDualCriteria & ProbationCriteria;
  metadata: {
    supervisionType: "Probation" | "Parole";
  };
};

export const getRecordTransformer = (client: Client) => {
  const transformer: TransformFunction<UsMiEarlyDischargeReferralRecord> = (
    record
  ) => {
    if (!record) {
      throw new Error("No record found");
    }

    const {
      stateCode,
      externalId,
      metadata,
      criteria: {
        supervisionPastHalfFullTermReleaseDate,
        supervisionNotPastFullTermCompletionDate,
        supervisionLevelIsNotHigh: {
          supervisionLevel: supervisionLevelIsNotHighSupervisionLevel,
        } = { supervisionLevel: null },
        servingAtLeastOneYearOnParoleSupervision,
        usMiParoleDualSupervisionPastEarlyDischargeDate,
        usMiNoNewIneligibleOffensesForEarlyDischargeFromSupervision,
        usMiNoOwiViolationOnParoleDualSupervision,
      },
    } = record;

    return {
      stateCode,
      externalId,
      metadata,
      criteria: {
        ...record.criteria,
        supervisionLevelIsNotHigh: {
          supervisionLevel:
            client.rootStore.workflowsStore.formatSupervisionLevel(
              supervisionLevelIsNotHighSupervisionLevel
            ),
        },
        supervisionPastHalfFullTermReleaseDate: {
          eligibleDate: supervisionPastHalfFullTermReleaseDate
            ? fieldToDate(supervisionPastHalfFullTermReleaseDate.eligibleDate)
            : null,
        },

        supervisionNotPastFullTermCompletionDate: {
          eligibleDate: supervisionNotPastFullTermCompletionDate
            ? fieldToDate(supervisionNotPastFullTermCompletionDate.eligibleDate)
            : null,
        },
        servingAtLeastOneYearOnParoleSupervision: {
          projectedCompletionDateMax: servingAtLeastOneYearOnParoleSupervision
            ? fieldToDate(
                servingAtLeastOneYearOnParoleSupervision.projectedCompletionDateMax
              )
            : null,
        },
        usMiParoleDualSupervisionPastEarlyDischargeDate: {
          eligibleDate: usMiParoleDualSupervisionPastEarlyDischargeDate
            ? fieldToDate(
                usMiParoleDualSupervisionPastEarlyDischargeDate.eligibleDate
              )
            : null,
        },

        usMiNoNewIneligibleOffensesForEarlyDischargeFromSupervision: {
          latestIneligibleConvictions: (
            usMiNoNewIneligibleOffensesForEarlyDischargeFromSupervision?.latestIneligibleConvictions ??
            []
          ).map(fieldToDate),
        },
        usMiNoOwiViolationOnParoleDualSupervision: {
          latestIneligibleConvictions: (
            usMiNoOwiViolationOnParoleDualSupervision?.latestIneligibleConvictions ??
            []
          ).map(fieldToDate),
        },
      },
    };
  };
  return transformer;
};
export class UsMiEarlyDischargeOpportunity extends OpportunityBase<
  Client,
  UsMiEarlyDischargeReferralRecord
> {
  readonly sidebarModules: OpportunityProfileModuleName[] = [
    "ClientProfileDetails",
  ];

  constructor(client: Client) {
    super(
      client,
      "usMiEarlyDischarge",
      client.rootStore,
      getRecordTransformer(client)
    );

    makeObservable(this, { requirementsMet: true });
  }

  get requirementsMet(): OpportunityRequirement[] {
    if (!this.record) return [];

    const requirements = [];
    const isParole = this.record.metadata.supervisionType === "Parole";
    const supervisionWord = isParole ? "parole" : "probation";

    const {
      criteria: {
        supervisionPastHalfFullTermReleaseDate: {
          eligibleDate: pastHalfFullTermReleaseDate,
        },
      },
    } = this.record;

    if (isPast(pastHalfFullTermReleaseDate)) {
      requirements.push({
        text: `Completed at least half of ${supervisionWord} term`,
        tooltip: isParole
          ? "A parolee is eligible for early discharge consideration prior to the expiration of the original term of parole if they have completed at least one-half of an original parole term of 12 months or more..."
          : "An offender may be considered for discharge prior to the expiration of the original term of probation if they have completed at least one-half of the probation term...",
      });
    }

    if (isParole) {
      requirements.push({
        text: "Serving a parole term of 12 months or more",
        tooltip:
          "A parolee is eligible for early discharge consideration prior to the expiration of the original term of parole if they have completed at least one-half of an original parole term of 12 months or more...",
      });

      requirements.push({
        text: "Served mandatory period of parole",
        tooltip:
          "The parolee has served any mandatory period of parole as set forth in Paragraph F.",
      });
    }

    requirements.push({
      text: `No active PPO ordered during the ${supervisionWord} term`,
    });

    requirements.push({
      text: `Not involved in a felony, assaultive misdemeanor, or offense requiring SORA registration while on ${supervisionWord}`,
      tooltip: isParole
        ? "The parolee is not known to have been involved in...felonious behavior, assaultive misdemeanor behavior (as set forth in Attachment A)...or an offense that requires registration under the Sex Offender Registration Act while on parole."
        : "The offender is not known to have been involved in...felonious behavior or assaultive misdemeanor behavior as set forth in Attachment A “OP 06.01.145B Assaultive Misdemeanor List” which occurred while on probation or any offense that requires registration under the Sex Offender Registration Act (SORA), which occurred while on probation.",
    });

    requirements.push({
      text: "Not serving for an offense excluded from early discharge eligibility by policy.",
      tooltip: isParole
        ? "The parolee is not serving for an offense...required to be registered under the Sex Offender Registration Act."
        : "The offender is not currently serving for an offense that requires a mandatory term of probation as identified in Paragraph H. The offender is not currently serving for MCL 750.81 or MCL 750.84 (Assault with Intent to commit Great Bodily Harm Less than Murder).",
    });

    if (isParole) {
      requirements.push({
        text: "Not serving for an offense excluded from early discharge eligibility by policy.",
        tooltip:
          "The parolee is not serving for an offense...required to be registered under the Sex Offender Registration Act.",
      });
    }

    if (!isParole) {
      requirements.push({
        text: "Not serving for an offense excluded from early discharge eligibility by policy.",
        tooltip:
          "The offender is not currently serving for an offense that requires a mandatory term of probation as identified in Paragraph H. The offender is not currently serving for MCL 750.81 or MCL 750.84 (Assault with Intent to commit Great Bodily Harm Less than Murder).",
      });
    }

    if (isParole) {
      requirements.push({
        text: "Not paroled from SAI on current term",
        tooltip:
          "The parolee was not paroled from the Special Alternative Incarceration (SAI) program on the current term (see definition).",
      });

      requirements.push({
        text: "Not on intensive supervision",
      });

      requirements.push({
        text: "Not involved in an OWI offense while on parole.",
        tooltip:
          "The parolee is not known to have been involved in... a violation of MCL 257.625 (OWI)...while on parole.",
      });
    }

    requirements.push({
      text: "No pending detainers",
    });

    return requirements;
  }

  // TODO(#2969): Update copy once finalized
  readonly policyOrMethodologyUrl = "";

  readonly isAlert = false;

  denialReasonsMap = {
    "CHILD ABUSE ORDER":
      "CHILD ABUSE ORDER: Child abuse prevention order filed during supervision period",
    "SUSPECTED OFFENSE":
      "SUSPECTED OFFENSE: Suspected of a felony, assaultive misdemeanor, OWI, or offense requiring SORA registration",
    "FELONY/STATE PROBATION":
      "FELONY/STATE PROBATION: On parole and also on other state or federal probation supervision for an offense committed during the current period",
    "PUBLIC ACT 223":
      "PUBLIC ACT 223: On parole and serving pursuant to Public Act 223 of 2010",
    NEEDS:
      "NEEDS: On parole and all criminogenic needs have not been addressed",
    NONCOMPLIANT: "NONCOMPLIANT: Not compliant with the order of supervision",
    PROGRAMMING:
      "PROGRAMMING: On probation and has not completed all required programming",
    "PRO-SOCIAL": "PRO-SOCIAL: Has not demonstrated pro-social behavior",
    RESTITUTION:
      "RESTITUTION: On parole and has not completed court-ordered restitution payments",
    "FINES & FEES":
      "FINES & FEES: Willful nonpayment of restitution, fees, court costs, fines, and other monetary obligations despite clear ability to pay",
    "PENDING CHARGES": "PENDING CHARGES: Pending felony charges/warrant",
    "COURT ORDERED TREATMENT":
      "COURT ORDERED TREATMENT: On probation and has not completed court ordered drug, veterans, or mental health treatment",
    "EXCLUDED OFFENSE":
      "EXCLUDED OFFENSE: On parole for an offense resulting in death or serious bodily injury or an offense involving the discharge of a firearm",
    [OTHER_KEY]: "Other: please specify a reason",
  };

  get eligibilityDate(): Date | undefined {
    if (!this.record) return;
    return this.record.criteria.supervisionPastHalfFullTermReleaseDate
      .eligibleDate;
  }
}
