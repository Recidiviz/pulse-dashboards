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
import { makeObservable } from "mobx";

import { Client } from "../../../Client";
import { OpportunityBase } from "../../OpportunityBase";
import { OpportunityRequirement } from "../../types";
import {
  UsMiEarlyDischargeAllCriteria,
  UsMiEarlyDischargeReferralRecord,
  usMiEarlyDischargeSchema,
} from "./UsMiEarlyDischargeReferralRecord";

type SupervisionType =
  UsMiEarlyDischargeReferralRecord["metadata"]["supervisionType"];

export const INTERSTATE_COPY = {
  "IC-IN": {
    text: "This client appears to be eligible for early discharge. Please review the client's eligibility status and send an early discharge request to the sending state via ICOTS.",
  },
  "IC-OUT": {
    Parole: {
      text: "This client appears to be eligible for early discharge. Request a progress report from state in which this client is being supervised and provide to the parole board.",
    },
    Probation: {
      text: "This client appears to be eligible for early discharge. Request a progress report from state in which this client is being supervised and submit to the judge.",
    },
  },
} as const;

export const ELIGIBLE_CRITERIA_COPY: Record<
  UsMiEarlyDischargeAllCriteria,
  OpportunityRequirement | Record<SupervisionType, OpportunityRequirement>
> = {
  supervisionOrSupervisionOutOfStatePastHalfFullTermReleaseDate: {
    Parole: {
      text: "Completed at least half of parole term",
      tooltip:
        "A parolee is eligible for early discharge consideration prior to the expiration of the original term of parole if they have completed at least one-half of an original parole term of 12 months or more",
    },
    Probation: {
      text: "Completed at least half of probation term",
      tooltip:
        "An offender may be considered for discharge prior to the expiration of the original term of probation if they have completed at least one-half of the probation term",
    },
  },
  supervisionNotPastFullTermCompletionDate: {
    text: "",
  },
  servingAtLeastOneYearOnParoleSupervisionOrSupervisionOutOfState: {
    text: "Serving a parole term of 12 months or more",
    tooltip:
      "A parolee is eligible for early discharge consideration prior to the expiration of the original term of parole if they have completed at least one-half of an original parole term of 12 months or more",
  },
  usMiParoleDualSupervisionPastEarlyDischargeDate: {
    text: "Served mandatory period of parole",
    tooltip:
      "The parolee has served any mandatory period of parole as set forth in Paragraph F. ",
  },
  usMiNoActivePpo: {
    Parole: {
      text: "No active PPO ordered during the parole term",
      tooltip:
        "The parolee does not have an active PPO […] that was ordered against him/her during the parole term.",
    },
    Probation: {
      text: "No active PPO ordered during the probation term",
      tooltip:
        "The offender does not have an active PPO […] that was ordered against him/her during the probation term.",
    },
  },
  usMiNoNewIneligibleOffensesForEarlyDischargeFromSupervision: {
    Parole: {
      text: "Not involved in a felony, assaultive misdemeanor, or offense requiring SORA registration while on parole",
      tooltip:
        "The parolee is not known to have been involved in […] felonious behavior, assaultive misdemeanor behavior (as set forth in Attachment A) […] or an offense that requires registration under the Sex Offender Registration Act while on parole.",
    },
    Probation: {
      text: "Not involved in a felony, assaultive misdemeanor, or offense requiring SORA registration while on probation",
      tooltip:
        "The offender is not known to have been involved in […] felonious behavior or assaultive misdemeanor behavior as set forth in Attachment A “OP 06.01.145B Assaultive Misdemeanor List” which occurred while on probation or any offense that requires registration under the Sex Offender Registration Act (SORA), which occurred while on probation.",
    },
  },
  usMiNotServingIneligibleOffensesForEarlyDischargeFromParoleDualSupervision: {
    text: "Not serving for an offense excluded from early discharge eligibility by policy.",
    tooltip:
      "The parolee is not serving for an offense […] required to be registered under the Sex Offender Registration Act.",
  },
  usMiNotServingIneligibleOffensesForEarlyDischargeFromProbationSupervision: {
    text: "Not serving for an offense excluded from early discharge eligibility by policy.",
    tooltip:
      "The offender is not currently serving for an offense that requires a mandatory term of probation as identified in Paragraph H. The offender is not currently serving for MCL 750.81 or MCL 750.84 (Assault with Intent to commit Great Bodily Harm Less than Murder).",
  },
  usMiSupervisionOrSupervisionOutOfStateLevelIsNotSai: {
    text: "Not paroled from SAI on current term",
    tooltip:
      "The parolee was not paroled from the Special Alternative Incarceration (SAI) program on the current term (see definition).",
  },
  supervisionOrSupervisionOutOfStateLevelIsNotHigh: {
    text: "Not on intensive supervision",
  },
  usMiNoOwiViolationOnParoleDualSupervision: {
    text: "Not involved in an OWI offense while on parole.",
    tooltip:
      "The parolee is not known to have been involved in […] a violation of MCL 257.625 (OWI) […] while on parole.",
  },
  usMiNoPendingDetainer: {
    text: "No pending detainers",
  },
} as const;

export class UsMiEarlyDischargeOpportunity extends OpportunityBase<
  Client,
  UsMiEarlyDischargeReferralRecord
> {
  constructor(client: Client) {
    super(client, "usMiEarlyDischarge", client.rootStore, (r) =>
      usMiEarlyDischargeSchema.parse(r),
    );

    makeObservable(this, { requirementsMet: true });
  }

  get requirementsMet(): OpportunityRequirement[] {
    if (!this.record) return [];
    const {
      metadata: { supervisionType },
      eligibleCriteria,
    } = this.record;

    const requirements: OpportunityRequirement[] = [];

    const criteriaKeys: UsMiEarlyDischargeAllCriteria[] = [
      "supervisionOrSupervisionOutOfStatePastHalfFullTermReleaseDate",
      "servingAtLeastOneYearOnParoleSupervisionOrSupervisionOutOfState",
      "usMiParoleDualSupervisionPastEarlyDischargeDate",
      "usMiNoActivePpo",
      "usMiNoNewIneligibleOffensesForEarlyDischargeFromSupervision",
      "usMiNotServingIneligibleOffensesForEarlyDischargeFromParoleDualSupervision",
      "usMiNotServingIneligibleOffensesForEarlyDischargeFromProbationSupervision",
      "usMiSupervisionOrSupervisionOutOfStateLevelIsNotSai",
      "supervisionOrSupervisionOutOfStateLevelIsNotHigh",
      "usMiNoOwiViolationOnParoleDualSupervision",
      "usMiNoPendingDetainer",
    ];

    criteriaKeys.forEach((key) => {
      if (key in eligibleCriteria) {
        const copy = ELIGIBLE_CRITERIA_COPY[key];
        if ("text" in copy) {
          requirements.push(copy);
        } else {
          requirements.push(copy[supervisionType]);
        }
      }
    });

    return requirements;
  }

  get eligibilityDate(): Date | undefined {
    return this.record?.metadata.eligibleDate;
  }

  get metadata(): UsMiEarlyDischargeReferralRecord["metadata"] | undefined {
    return this.record?.metadata;
  }
}
