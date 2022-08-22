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

import { makeAutoObservable } from "mobx";

import { formatWorkflowsDate } from "../../utils";
import { Client } from "../Client";
import { fieldToDate, OpportunityValidationError } from "../utils";
import { OTHER_KEY } from "../WorkflowsStore";
import {
  EarlyTerminationReferralRecord,
  TransformedEarlyTerminationReferral,
} from "./EarlyTerminationReferralRecord";
import {
  DenialReasonsMap,
  Opportunity,
  OpportunityCriterion,
  OpportunityRequirement,
  OpportunityStatus,
  OpportunityType,
} from "./types";
import {
  earlyTerminationOpportunityStatuses,
  rankByReviewStatus,
} from "./utils";

const DENIAL_REASONS_MAP = {
  "INT MEASURE":
    "Under active intermediate measure as a result of 1+ violations",
  "CASE PLAN NC": "Has not completed case plan goals",
  SO: "Being supervised for sex offense",
  "FINES/FEES": "Willfull nonpayment of fines/fees despite ability to pay",
  INC: "Incarcerated on another offense",
  "SA DECLINE": "State's Attorney permanently declined consideration",
  [OTHER_KEY]: "Please specify a reason",
};

// This could be configured externally once it's fleshed out
// to include all copy and other static data
const CRITERIA: Record<string, OpportunityCriterion> = {
  eligibleDate: {
    tooltip:
      "Early termination date (as calculated by DOCSTARS) has passed or is within 30 days.",
  },
  supervisionLevel: {
    tooltip: `Currently on diversion, minimum, medium, maximum, IC-in, or IC-out supervision level.`,
  },
  supervisionType: {
    tooltip: `Serving a suspended, deferred, or IC-probation sentence.`,
  },
  revocationStatus: {
    tooltip: `Not on active revocation status.`,
  },
};

class EarlyTerminationOpportunity implements Opportunity {
  client: Client;

  readonly type: OpportunityType = "earlyTermination";

  private record: EarlyTerminationReferralRecord;

  readonly denialReasonsMap: DenialReasonsMap;

  constructor(record: EarlyTerminationReferralRecord, client: Client) {
    makeAutoObservable<
      EarlyTerminationOpportunity,
      "record" | "transformedRecord"
    >(this, {
      record: true,
      transformedRecord: true,
    });

    this.client = client;
    this.record = record;
    this.denialReasonsMap = DENIAL_REASONS_MAP;
  }

  private get transformedRecord() {
    const {
      stateCode,
      externalId,
      formInformation: {
        clientName,
        convictionCounty,
        judicialDistrictCode,
        criminalNumber,
        judgeName,
        priorCourtDate,
        sentenceLengthYears,
        crimeNames,
        probationExpirationDate,
        probationOfficerFullName,
      },
      reasons,
      metadata,
    } = this.record;

    const transformedReasons: TransformedEarlyTerminationReferral["reasons"] = {};

    reasons.forEach(({ criteriaName, reason }) => {
      switch (criteriaName) {
        case "SUPERVISION_EARLY_DISCHARGE_DATE_WITHIN_30_DAYS":
          transformedReasons.pastEarlyDischarge = {
            eligibleDate: reason.eligibleDate
              ? fieldToDate(reason.eligibleDate)
              : undefined,
          };
          break;
        case "US_ND_NOT_IN_ACTIVE_REVOCATION_STATUS":
          transformedReasons.notActiveRevocationStatus = {
            revocationDate: reason.revocationDate
              ? fieldToDate(reason.revocationDate)
              : undefined,
          };
          break;
        case "US_ND_IMPLIED_VALID_EARLY_TERMINATION_SUPERVISION_LEVEL":
          transformedReasons.eligibleSupervisionLevel = reason;
          break;
        case "US_ND_IMPLIED_VALID_EARLY_TERMINATION_SENTENCE_TYPE":
          transformedReasons.eligibleSupervisionType = reason;
          break;
        default:
      }
    });

    const transformedRecord: TransformedEarlyTerminationReferral = {
      stateCode,
      externalId,
      formInformation: {
        clientName,
        convictionCounty,
        judicialDistrictCode,
        criminalNumber,
        judgeName,
        priorCourtDate: fieldToDate(priorCourtDate),
        probationExpirationDate: fieldToDate(probationExpirationDate),
        probationOfficerFullName,
        sentenceLengthYears: parseInt(sentenceLengthYears),
        crimeNames,
      },
      reasons: transformedReasons,
      metadata,
    };

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
      reasons: {
        pastEarlyDischarge,
        eligibleSupervisionLevel,
        eligibleSupervisionType,
        notActiveRevocationStatus,
      },
    } = this.transformedRecord;

    if (!pastEarlyDischarge?.eligibleDate) {
      throw new OpportunityValidationError(
        "Missing early termination opportunity eligible date"
      );
    }

    if (!eligibleSupervisionLevel?.supervisionLevel) {
      throw new OpportunityValidationError(
        "Missing early termination opportunity supervision level"
      );
    }

    if (!eligibleSupervisionType?.supervisionType) {
      throw new OpportunityValidationError(
        "Missing early termination opportunity supervision type"
      );
    }

    if (
      !notActiveRevocationStatus ||
      (notActiveRevocationStatus && notActiveRevocationStatus.revocationDate)
    ) {
      throw new OpportunityValidationError(
        "Early termination opportunity has revocation date"
      );
    }
  }

  // eslint-disable-next-line class-methods-use-this
  get almostEligible(): boolean {
    return false;
  }

  get rank(): number {
    return rankByReviewStatus(this);
  }

  get reviewStatus(): OpportunityStatus {
    const updates = this.client.opportunityUpdates.earlyTermination;
    if ((updates?.denial?.reasons?.length || 0) !== 0) {
      return "DENIED";
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
    return earlyTerminationOpportunityStatuses[this.reviewStatus];
  }

  get statusMessageLong(): string {
    // TODO #2141 Update status message once denial reason is added to the client update record
    return earlyTerminationOpportunityStatuses[this.reviewStatus];
  }

  get requirementsMet(): OpportunityRequirement[] {
    const requirements: OpportunityRequirement[] = [];
    const {
      reasons: {
        pastEarlyDischarge,
        eligibleSupervisionLevel,
        eligibleSupervisionType,
      },
    } = this.transformedRecord;

    if (pastEarlyDischarge?.eligibleDate) {
      requirements.push({
        text: `Early termination date is ${formatWorkflowsDate(
          pastEarlyDischarge?.eligibleDate
        )}`,
        tooltip: CRITERIA.eligibleDate.tooltip,
      });
    }

    if (eligibleSupervisionLevel?.supervisionLevel) {
      requirements.push({
        text: `Currently on ${eligibleSupervisionLevel?.supervisionLevel.toLowerCase()} supervision`,
        tooltip: CRITERIA.supervisionLevel.tooltip,
      });
    }
    if (eligibleSupervisionType?.supervisionType) {
      requirements.push({
        text: `Serving ${eligibleSupervisionType?.supervisionType?.toLowerCase()} sentence`,
        tooltip: CRITERIA.supervisionType.tooltip,
      });
    }
    requirements.push({
      text: `Not on active revocation status`,
      tooltip: CRITERIA.revocationStatus.tooltip,
    });

    return requirements;
  }

  // eslint-disable-next-line class-methods-use-this
  get requirementsAlmostMet(): OpportunityRequirement[] {
    return [];
  }

  get metadata(): TransformedEarlyTerminationReferral["metadata"] {
    return this.transformedRecord.metadata;
  }
}

/**
 * Returns an `Opportunity` if the provided data indicates the client is eligible
 */
export function createEarlyTerminationOpportunity(
  eligible: boolean | undefined,
  record: EarlyTerminationReferralRecord | undefined,
  client: Client
): EarlyTerminationOpportunity | undefined {
  if (!record || !eligible) return undefined;
  try {
    const opp = new EarlyTerminationOpportunity(record, client);
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
