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

import { deleteField, DocumentData } from "firebase/firestore";
import { sortBy } from "lodash";
import { computed, makeObservable } from "mobx";
import moment from "moment";

import { updateOpportunityDraftData } from "../../firestore";
import { formatWorkflowsDate, pluralize } from "../../utils";
import { Client } from "../Client";
import { OpportunityValidationError } from "../utils";
import { OTHER_KEY } from "../WorkflowsStore";
import {
  EarlyTerminationDraftData,
  EarlyTerminationReferralRecord,
  transformReferral,
} from "./EarlyTerminationReferralRecord";
import { OpportunityWithFormBase } from "./OpportunityWithFormBase";
import { OpportunityRequirement } from "./types";

const FORM_DATE_FORMAT = "MMMM Do, YYYY";

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
const CRITERIA: Record<
  keyof EarlyTerminationReferralRecord["criteria"],
  Partial<OpportunityRequirement>
> = {
  supervisionPastEarlyDischargeDate: {
    tooltip:
      "Policy requirement: Early termination date (as calculated by DOCSTARS) has passed or is within 30 days.",
  },
  usNdImpliedValidEarlyTerminationSupervisionLevel: {
    tooltip: `Policy requirement: Currently on diversion, minimum, medium, maximum, IC-in, or IC-out supervision level.`,
  },
  usNdImpliedValidEarlyTerminationSentenceType: {
    tooltip: `Policy requirement: Serving a suspended, deferred, or IC-probation sentence.`,
  },
  usNdNotInActiveRevocationStatus: {
    tooltip: `Policy requirement: Not on active revocation status.`,
  },
};

const ADDITIONAL_DEPOSITION_LINES_PREFIX = "additionalDepositionLines";

function validateRecord(
  record: DocumentData | undefined
): DocumentData | undefined {
  if (!record) return;

  const {
    criteria: {
      supervisionPastEarlyDischargeDate: pastEarlyDischarge,
      usNdImpliedValidEarlyTerminationSupervisionLevel: eligibleSupervisionLevel,
      usNdImpliedValidEarlyTerminationSentenceType: eligibleSupervisionType,
      usNdNotInActiveRevocationStatus: notActiveRevocationStatus,
    },
  } = record;

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
  return record;
}

export class EarlyTerminationOpportunity extends OpportunityWithFormBase<
  EarlyTerminationReferralRecord,
  EarlyTerminationDraftData
> {
  navigateToFormText = "Auto-fill paperwork";

  constructor(client: Client) {
    super(client, "earlyTermination", transformReferral, validateRecord);

    makeObservable(this, {
      printText: computed,
      requirementsMet: computed,
      requirementsAlmostMet: computed,
    });

    this.denialReasonsMap = DENIAL_REASONS_MAP;
  }

  prefilledDataTransformer = (): Partial<EarlyTerminationDraftData> => {
    if (!this.record) return {};

    const {
      formInformation: {
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
    } = this.record;

    return {
      clientName: this.client.displayName,
      judgeName,
      convictionCounty: convictionCounty?.replaceAll("_", " ") ?? "",
      judicialDistrictCode: judicialDistrictCode?.replaceAll("_", " ") ?? "",
      priorCourtDate: moment(priorCourtDate).format(FORM_DATE_FORMAT),
      probationExpirationDate: moment(probationExpirationDate).format(
        FORM_DATE_FORMAT
      ),
      sentenceLengthYears: pluralize(sentenceLengthYears, "year"),
      plaintiff: "State of North Dakota",
      crimeNames: crimeNames?.join(", ") ?? "",
      probationOfficerFullName,
      criminalNumber,
    };
  };

  get printText(): string {
    if (this.client.formIsPrinting) {
      return "Downloading .DOCX...";
    }

    if (this.updates?.completed) {
      return "Re-download .DOCX";
    }

    return "Download .DOCX";
  }

  get requirementsMet(): OpportunityRequirement[] {
    if (!this.record) return [];
    const requirements: OpportunityRequirement[] = [];
    const {
      criteria: {
        supervisionPastEarlyDischargeDate,
        usNdImpliedValidEarlyTerminationSupervisionLevel,
        usNdImpliedValidEarlyTerminationSentenceType,
      },
    } = this.record;

    if (supervisionPastEarlyDischargeDate?.eligibleDate) {
      requirements.push({
        text: `Early termination date is ${formatWorkflowsDate(
          supervisionPastEarlyDischargeDate?.eligibleDate
        )}`,
        tooltip: CRITERIA.supervisionPastEarlyDischargeDate.tooltip,
      });
    }

    if (usNdImpliedValidEarlyTerminationSupervisionLevel?.supervisionLevel) {
      requirements.push({
        text: `Currently on ${usNdImpliedValidEarlyTerminationSupervisionLevel?.supervisionLevel.toLowerCase()} supervision`,
        tooltip:
          CRITERIA.usNdImpliedValidEarlyTerminationSupervisionLevel.tooltip,
      });
    }
    if (usNdImpliedValidEarlyTerminationSentenceType?.supervisionType) {
      requirements.push({
        text: `Serving ${usNdImpliedValidEarlyTerminationSentenceType?.supervisionType?.toLowerCase()} sentence`,
        tooltip: CRITERIA.usNdImpliedValidEarlyTerminationSentenceType.tooltip,
      });
    }
    requirements.push({
      text: `Not on active revocation status`,
      tooltip: CRITERIA.usNdNotInActiveRevocationStatus.tooltip,
    });

    return requirements;
  }

  get metadata(): EarlyTerminationReferralRecord["metadata"] | undefined {
    return this.record?.metadata;
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
    updateOpportunityDraftData(this, key, "");
  }

  removeDepositionLine(key: string): void {
    if (!this.draftData) return;
    updateOpportunityDraftData(this, key, deleteField());
  }
}
