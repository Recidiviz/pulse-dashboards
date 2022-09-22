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
import { computed, makeObservable } from "mobx";

import { transform } from "../../core/Paperwork/US_ND/EarlyTermination/Transformer";
import { updateEarlyTerminationDraftFieldData } from "../../core/Paperwork/US_ND/EarlyTermination/utils";
import { formatWorkflowsDate } from "../../utils";
import { Client } from "../Client";
import { fieldToDate, OpportunityValidationError } from "../utils";
import { OTHER_KEY } from "../WorkflowsStore";
import {
  EarlyTerminationDraftData,
  EarlyTerminationReferralRecord,
  TransformedEarlyTerminationReferral,
} from "./EarlyTerminationReferralRecord";
import { OpportunityWithFormBase } from "./OpportunityWithFormBase";
import { EarlyTerminationFormInterface, OpportunityRequirement } from "./types";
import { earlyTerminationOpportunityStatuses } from "./utils";

const DENIAL_REASONS_MAP = {
  "INT MEASURE":
    "Under active intermediate measure as a result of 1+ violations",
  "CASE PLAN NC": "Has not completed case plan goals",
  SO: "Being supervised for sex offense",
  DOP: "Being supervised for an offense resulting in the death of a person",
  "FINES/FEES": "Willfull nonpayment of fines/fees despite ability to pay",
  INC: "Incarcerated on another offense",
  "SA DECLINE": "State's Attorney permanently declined consideration",
  [OTHER_KEY]: "Other, please specify a reason",
};

// This could be configured externally once it's fleshed out
// to include all copy and other static data
const CRITERIA: Record<string, Partial<OpportunityRequirement>> = {
  eligibleDate: {
    tooltip:
      "Policy requirement: Early termination date (as calculated by DOCSTARS) has passed or is within 30 days.",
  },
  supervisionLevel: {
    tooltip: `Policy requirement: Currently on diversion, minimum, medium, maximum, IC-in, or IC-out supervision level.`,
  },
  supervisionType: {
    tooltip: `Policy requirement: Serving a suspended, deferred, or IC-probation sentence.`,
  },
  revocationStatus: {
    tooltip: `Policy requirement: Not on active revocation status.`,
  },
};

const ADDITIONAL_DEPOSITION_LINES_PREFIX = "additionalDepositionLines";

class EarlyTerminationOpportunity
  extends OpportunityWithFormBase<
    EarlyTerminationReferralRecord,
    EarlyTerminationDraftData
  >
  implements EarlyTerminationFormInterface {
  constructor(client: Client) {
    super(client, "earlyTermination");

    makeObservable<EarlyTerminationOpportunity, "transformedRecord">(this, {
      transformedRecord: true,
      printText: computed,
      statusMessageShort: computed,
      statusMessageLong: computed,
      requirementsMet: computed,
      requirementsAlmostMet: computed,
    });

    this.denialReasonsMap = DENIAL_REASONS_MAP;
    this.descriptionCTA =
      "Review clients eligible for early termination and download the paperwork to file with the Court.";
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

    const transformedCriteria: TransformedEarlyTerminationReferral["criteria"] = {};

    reasons.forEach(({ criteriaName, reason }) => {
      switch (criteriaName) {
        case "SUPERVISION_EARLY_DISCHARGE_DATE_WITHIN_30_DAYS":
          transformedCriteria.pastEarlyDischarge = {
            eligibleDate: reason.eligibleDate
              ? fieldToDate(reason.eligibleDate)
              : undefined,
          };
          break;
        case "US_ND_NOT_IN_ACTIVE_REVOCATION_STATUS":
          transformedCriteria.notActiveRevocationStatus = {
            revocationDate: reason.revocationDate
              ? fieldToDate(reason.revocationDate)
              : undefined,
          };
          break;
        case "US_ND_IMPLIED_VALID_EARLY_TERMINATION_SUPERVISION_LEVEL":
          transformedCriteria.eligibleSupervisionLevel = reason;
          break;
        case "US_ND_IMPLIED_VALID_EARLY_TERMINATION_SENTENCE_TYPE":
          transformedCriteria.eligibleSupervisionType = reason;
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
      criteria: transformedCriteria,
      metadata,
    };

    return transformedRecord;
  }

  // TODO(#2263): Refactor isValid into a pipeline hydrate -> validate -> aggregate
  get isValid(): boolean {
    if (!this.transformedRecord) return false;
    const {
      criteria: {
        pastEarlyDischarge,
        eligibleSupervisionLevel,
        eligibleSupervisionType,
        notActiveRevocationStatus,
      },
    } = this.transformedRecord;

    if (!pastEarlyDischarge?.eligibleDate) {
      return false;
    }

    if (!eligibleSupervisionLevel?.supervisionLevel) {
      return false;
    }

    if (!eligibleSupervisionType?.supervisionType) {
      return false;
    }

    if (
      !notActiveRevocationStatus ||
      (notActiveRevocationStatus && notActiveRevocationStatus.revocationDate)
    ) {
      return false;
    }
    return true;
  }

  formDataTransformer = transform;

  get printText(): string {
    if (this.client.formIsPrinting) {
      return "Downloading .DOCX...";
    }

    if (this.updates?.completed) {
      return "Re-download .DOCX";
    }

    return "Download .DOCX";
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
      criteria: {
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

  get metadata(): TransformedEarlyTerminationReferral["metadata"] | undefined {
    return this.transformedRecord?.metadata;
  }

  get additionalDepositionLines(): string[] {
    const additionalDepositionLines = Object.keys(
      this.draftData
    ).filter((key: string) =>
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

    updateEarlyTerminationDraftFieldData(this.client, key, deleteField());
  }
}

/**
 * Returns an `EarlyTerminationOpportunity` if the provided data indicates the client is eligible
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
