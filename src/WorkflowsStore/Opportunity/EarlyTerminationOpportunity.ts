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

import { Client } from "../Client";
import { fieldToDate, OpportunityValidationError } from "../utils";
import {
  EarlyTerminationReferralRecord,
  TransformedEarlyTerminationReferral,
} from "./EarlyTerminationReferralRecord";
import {
  Opportunity,
  OpportunityRequirement,
  OpportunityStatus,
  OpportunityType,
} from "./types";
import {
  earlyTerminationOpportunityStatuses,
  rankByReviewStatus,
} from "./utils";

class EarlyTerminationOpportunity implements Opportunity {
  client: Client;

  readonly type: OpportunityType = "earlyTermination";

  private record: EarlyTerminationReferralRecord;

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
  }

  private get transformedRecord() {
    const {
      stateCode,
      externalId,
      formInformation: {
        plaintiffName,
        judgeName,
        sentencingDate,
        sentenceLengthYears,
        chargeName,
        remainingFees,
      },
      reasons: {
        pastEarlyDischarge,
        eligibleSupervisionLevel,
        eligibleSupervisionType,
      },
    } = this.record;

    const transformedRecord: TransformedEarlyTerminationReferral = {
      stateCode,
      externalId,
      formInformation: {
        plaintiffName,
        judgeName,
        sentencingDate: fieldToDate(sentencingDate),
        sentenceLengthYears,
        chargeName,
        remainingFees,
      },
      reasons: {
        pastEarlyDischarge: {
          eligibleDate: pastEarlyDischarge
            ? fieldToDate(pastEarlyDischarge.eligibleDate)
            : undefined,
        },
        eligibleSupervisionLevel: {
          supervisionLevel: eligibleSupervisionLevel?.supervisionLevel,
        },
        eligibleSupervisionType: {
          supervisionType: eligibleSupervisionType?.supervisionType,
        },
        notActiveRevocationStatus: {},
      },
    };

    return transformedRecord;
  }

  /**
   * Throws OpportunityValidationError if it detects any condition in external configuration
   * or the object's input or output that indicates this Opportunity should be excluded.
   * This may be due to feature gating rather than any actual problem with the input data.
   * Don't call this in the constructor because it causes MobX to explode!
   */
  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-empty-function
  validate(): void {}

  // eslint-disable-next-line class-methods-use-this
  get almostEligible(): boolean {
    return false;
  }

  // eslint-disable-next-line class-methods-use-this
  get rank(): number {
    return rankByReviewStatus(this);
  }

  // eslint-disable-next-line class-methods-use-this
  get reviewStatus(): OpportunityStatus {
    // TODO #2139 Update status logic once early termination is added to the client update record
    const status: OpportunityStatus = "PENDING";

    return status;
  }

  get statusMessageShort(): string {
    return earlyTerminationOpportunityStatuses[this.reviewStatus];
  }

  get statusMessageLong(): string {
    // TODO #2141 Update status message once denial reason is added to the client update record
    return earlyTerminationOpportunityStatuses[this.reviewStatus];
  }

  // eslint-disable-next-line class-methods-use-this
  get requirementsMet(): OpportunityRequirement[] {
    return [];
  }

  // eslint-disable-next-line class-methods-use-this
  get requirementsAlmostMet(): OpportunityRequirement[] {
    return [];
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
