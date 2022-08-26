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

import { deleteField } from "firebase/firestore";
import { sortBy } from "lodash";
import { action, keys, makeAutoObservable, remove, set, toJS } from "mobx";

import { transform } from "../../core/Paperwork/US_ND/EarlyTermination/Transformer";
import { updateEarlyTerminationDraftFieldData } from "../../core/Paperwork/US_ND/EarlyTermination/utils";
import { subscribeToEarlyTerminationReferral } from "../../firestore";
import { formatWorkflowsDate } from "../../utils";
import { Client } from "../Client";
import {
  fieldToDate,
  observableSubscription,
  OpportunityValidationError,
  SubscriptionValue,
} from "../utils";
import { OTHER_KEY } from "../WorkflowsStore";
import {
  EarlyTerminationDraftData,
  EarlyTerminationReferralRecord,
  TransformedEarlyTerminationReferral,
} from "./EarlyTerminationReferralRecord";
import {
  DenialReasonsMap,
  EarlyTerminationFormInterface,
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
  [OTHER_KEY]: "Other, please specify a reason",
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

const ADDITIONAL_DEPOSITION_LINES_PREFIX = "additionalDepositionLines";

class EarlyTerminationOpportunity
  implements Opportunity, EarlyTerminationFormInterface {
  client: Client;

  readonly type: OpportunityType = "earlyTermination";

  readonly denialReasonsMap: DenialReasonsMap;

  draftData: Partial<EarlyTerminationDraftData>;

  private fetchedEarlyTerminationReferral: SubscriptionValue<EarlyTerminationReferralRecord>;

  constructor(client: Client) {
    makeAutoObservable<
      EarlyTerminationOpportunity,
      "record" | "transformedRecord"
    >(this, {
      record: true,
      client: false,
      transformedRecord: true,
      draftData: true,
      setDataField: action,
    });

    this.client = client;
    this.denialReasonsMap = DENIAL_REASONS_MAP;
    this.draftData = {};
    this.fetchedEarlyTerminationReferral = observableSubscription((handler) =>
      subscribeToEarlyTerminationReferral(this.client.recordId, (result) => {
        if (result) handler(result);
      })
    );
  }

  get record(): EarlyTerminationReferralRecord | undefined {
    return this.fetchedEarlyTerminationReferral.current();
  }

  private get transformedRecord() {
    if (!this.record) return;
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

  // TODO(#2263): This is currently not being called. we need to consider a different interface for validating and hydrating,
  // possibly using the `hydrate` pattern for workflows models.
  /**
   * Throws OpportunityValidationError if it detects any condition in external configuration
   * or the object's input or output that indicates this Opportunity should be excluded.
   * This may be due to feature gating rather than any actual problem with the input data.
   * Don't call this in the constructor because it causes MobX to explode!
   */
  validate(): void {
    if (!this.transformedRecord) return;
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

  get printText(): string {
    if (this.client.formIsPrinting) {
      return "Downloading .DOCX...";
    }

    if (this.client.opportunityUpdates?.earlyTermination?.completed) {
      return "Re-download .DOCX";
    }

    return "Download .DOCX";
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
    if (!this.transformedRecord) return [];
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

  get metadata(): TransformedEarlyTerminationReferral["metadata"] | undefined {
    return this.transformedRecord?.metadata;
  }

  get prefilledData(): Partial<EarlyTerminationDraftData> {
    if (this.record) {
      return transform(this.client, this.record);
    }

    return {};
  }

  get additionalDepositionLines(): string[] {
    if (!this.draftData) return [];
    const additionalDepositionLines = keys(this.draftData)
      .map((key: PropertyKey) => String(key))
      .filter((key: string) =>
        key.startsWith(ADDITIONAL_DEPOSITION_LINES_PREFIX)
      );

    return sortBy(additionalDepositionLines, (key) =>
      Number(key.split(ADDITIONAL_DEPOSITION_LINES_PREFIX)[1])
    );
  }

  addDepositionLine(): void {
    const key = `${ADDITIONAL_DEPOSITION_LINES_PREFIX}${+new Date()}`;
    updateEarlyTerminationDraftFieldData(this.client, key, "");
  }

  removeDepositionLine(key: string): void {
    if (!this.draftData) return;
    remove(this.draftData, key);

    updateEarlyTerminationDraftFieldData(this.client, key, deleteField());
  }

  get formData(): Partial<EarlyTerminationDraftData> {
    return { ...toJS(this.prefilledData), ...toJS(this.draftData) };
  }

  async setDataField(
    key: keyof EarlyTerminationDraftData | string,
    value: boolean | string | string[]
  ): Promise<void> {
    set(this.draftData, key, value);
  }
}

/**
 * Returns an `Opportunity` if the provided data indicates the client is eligible
 */
export function createEarlyTerminationOpportunity(
  eligible: boolean | undefined,
  client: Client
): EarlyTerminationOpportunity | undefined {
  if (!eligible) return undefined;
  try {
    return new EarlyTerminationOpportunity(client);
  } catch (e) {
    // constructor performs further validation that may fail
    if (e instanceof OpportunityValidationError) {
      return undefined;
    }
    // don't handle anything unexpected, it's probably a bug!
    throw e;
  }
}
