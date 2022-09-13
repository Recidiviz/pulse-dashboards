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

import { subscribeToLSUReferral } from "../../firestore";
import { Client } from "../Client";
import {
  fieldToDate,
  observableSubscription,
  OpportunityValidationError,
  SubscriptionValue,
} from "../utils";
import { OTHER_KEY } from "../WorkflowsStore";
import { LSUReferralRecord, TransformedLSUReferral } from "./LSUReferralRecord";
import {
  DenialReasonsMap,
  Opportunity,
  OpportunityRequirement,
  OpportunityStatus,
  OpportunityType,
} from "./types";
import { LSUOpportunityStatuses, rankByReviewStatus } from "./utils";

const DENIAL_REASONS_MAP = {
  SCNC:
    "SCNC: Not compliant with all court-ordered conditions and special conditions",
  FFR:
    "FFR: Failure to make payments toward fines, fees, and restitution despite ability to pay",
  "NCO/CPO": "NCO/CPO: Has an active NCO, CPO, or restraining order",
  INTERLOCK: "INTERLOCK: Has an active interlock device",
  [OTHER_KEY]: "Other, please specify a reason",
};

// This could be configured externally once it's fleshed out
// to include all copy and other static data
const CRITERIA: Record<string, OpportunityRequirement> = {
  riskLevel: {
    // The risk level text is an empty string but is always overwritten with a custom string based on actual risk level in requirementsMet
    text: "",
    tooltip:
      "Policy requirement: Assessed at low risk level on LSI-R with no risk increase in past 90 days or moderate risk level on LSI-R with no risk increase in past 360 days",
  },
  negativeUA: {
    text: "Negative UA within past 90 days",
    tooltip:
      "Policy requirement: Negative UA within past 90 days, unless the client lacks a history of drug/alcohol abuse or has been supervised at low risk for more than one year",
  },
  noFelonyConvictions: {
    text: "No felony convictions in past 24 months",
    tooltip:
      "Policy requirement: Has not committed a felony while on probation or parole in past 24 months",
  },
  noViolentOrDUIConvictions: {
    text: "No violent or DUI misdemeanor convictions in past 12 months",
    tooltip:
      "Policy requirement: Has not committed a violent misdemeanor or DUI misdemeanor while on probation or parole in past 12 months",
  },
  verifiedEmployment: {
    text: "Verified compliant employment",
    tooltip:
      "Policy requirement: Verified employment status, full-time student, or adequate lawful income from non-employment sources have been confirmed within past 3 months",
  },
};

class LSUOpportunity implements Opportunity {
  client: Client;

  readonly type: OpportunityType = "LSU";

  readonly denialReasonsMap: DenialReasonsMap;

  private fetchedLSUReferral: SubscriptionValue<LSUReferralRecord>;

  constructor(client: Client) {
    makeAutoObservable<LSUOpportunity, "record" | "transformedRecord">(this, {
      record: true,
      client: false,
      transformedRecord: true,
    });

    this.client = client;
    this.denialReasonsMap = DENIAL_REASONS_MAP;
    this.fetchedLSUReferral = observableSubscription((handler) =>
      subscribeToLSUReferral(this.client.recordId, (result) => {
        if (result) handler(result);
      })
    );
  }

  get record(): LSUReferralRecord | undefined {
    return this.fetchedLSUReferral.current();
  }

  private get transformedRecord() {
    if (!this.record) return;
    const {
      stateCode,
      externalId,
      formInformation: { clientName },
      reasons,
    } = this.record;

    const transformedCriteria: TransformedLSUReferral["criteria"] = {};

    reasons.forEach(({ criteriaName, reason }) => {
      switch (criteriaName) {
        case "RISK_LEVEL":
          transformedCriteria.eligibleRiskLevel = {
            riskLevel: reason.eligibleRiskLevel?.riskLevel,
            lastIncrease: reason.eligibleRiskLevel?.lastIncrease
              ? fieldToDate(reason.eligibleRiskLevel?.lastIncrease)
              : undefined,
          };
          break;
        case "NEGATIVE_UA_WITHIN_90_DAYS":
          transformedCriteria.negativeUA = {
            lastNegativeUA: reason.lastNegativeUA
              ? fieldToDate(reason.lastNegativeUA)
              : undefined,
          };
          break;
        case "NO_FELONY_CONVICTIONS":
          transformedCriteria.noFelonyConvictions = {
            lastFelonyConviction: reason.lastFelonyConviction
              ? fieldToDate(reason.lastFelonyConviction)
              : undefined,
          };
          break;
        case "NO_VIOLENT_OR_DUI_CONVICTIONS":
          transformedCriteria.noViolentOrDUIConvictions = {
            lastViolentOrDUIConviction: reason.lastViolentOrDUIConviction
              ? fieldToDate(reason.lastViolentOrDUIConviction)
              : undefined,
          };
          break;
        case "VERIFIED_EMPLOYMENT":
          transformedCriteria.verifiedEmployment = {
            employmentVerifiedDate: reason.employmentVerifiedDate
              ? fieldToDate(reason.employmentVerifiedDate)
              : undefined,
          };
          break;
        default:
      }
    });

    const transformedRecord: TransformedLSUReferral = {
      stateCode,
      externalId,
      formInformation: {
        clientName,
      },
      criteria: transformedCriteria,
    };

    return transformedRecord;
  }

  // TODO(#2263): This is currently not being called. we need to consider a different interface for validating and hydrating,
  // possibly using the `hydrate` pattern for workflows models.
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

  get rank(): number {
    return rankByReviewStatus(this);
  }

  get reviewStatus(): OpportunityStatus {
    const updates = this.client.opportunityUpdates.LSU;
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
    return LSUOpportunityStatuses[this.reviewStatus];
  }

  get statusMessageLong(): string {
    return LSUOpportunityStatuses[this.reviewStatus];
  }

  get requirementsMet(): OpportunityRequirement[] {
    if (!this.transformedRecord) return [];
    const requirements: OpportunityRequirement[] = [];
    const {
      criteria: {
        eligibleRiskLevel,
        negativeUA,
        noFelonyConvictions,
        noViolentOrDUIConvictions,
        verifiedEmployment,
      },
    } = this.transformedRecord;

    if (eligibleRiskLevel?.riskLevel) {
      const text =
        eligibleRiskLevel.riskLevel === "LOW"
          ? "Currently low risk with no increase in risk level in past 90 days"
          : "Currently moderate risk with no increase in risk level in past 360 days";
      requirements.push({
        text,
        tooltip: CRITERIA.riskLevel.tooltip,
      });
    }

    if (negativeUA) {
      requirements.push({
        text: CRITERIA.negativeUA.text,
        tooltip: CRITERIA.negativeUA.tooltip,
      });
    }

    if (noFelonyConvictions) {
      requirements.push({
        text: CRITERIA.noFelonyConvictions.text,
        tooltip: CRITERIA.noFelonyConvictions.tooltip,
      });
    }

    if (noViolentOrDUIConvictions) {
      requirements.push({
        text: CRITERIA.noViolentOrDUIConvictions.text,
        tooltip: CRITERIA.noViolentOrDUIConvictions.tooltip,
      });
    }

    if (verifiedEmployment) {
      requirements.push({
        text: CRITERIA.verifiedEmployment.text,
        tooltip: CRITERIA.verifiedEmployment.tooltip,
      });
    }

    return requirements;
  }

  // eslint-disable-next-line class-methods-use-this
  get requirementsAlmostMet(): OpportunityRequirement[] {
    return [];
  }
}

/**
 * Returns an `LSUOpportunity` if the provided data indicates the client is eligible
 */
export function createLSUOpportunity(
  eligible: boolean | undefined,
  client: Client
): LSUOpportunity | undefined {
  if (!eligible) return undefined;
  try {
    return new LSUOpportunity(client);
  } catch (e) {
    // constructor performs further validation that may fail
    if (e instanceof OpportunityValidationError) {
      return undefined;
    }
    // don't handle anything unexpected, it's probably a bug!
    throw e;
  }
}
