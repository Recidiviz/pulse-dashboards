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

import { computed, makeObservable } from "mobx";

import { WORKFLOWS_METHODOLOGY_URL } from "../../../../core/utils/constants";
import { OpportunityProfileModuleName } from "../../../../core/WorkflowsJusticeInvolvedPersonProfile/OpportunityProfile";
import { OpportunityUpdateWithForm } from "../../../../FirestoreStore";
import { formatWorkflowsDate } from "../../../../utils";
import { Client } from "../../../Client";
import { OTHER_KEY } from "../../../utils";
import { EarlyTerminationForm } from "../../Forms/EarlyTerminationForm";
import { OpportunityBase } from "../../OpportunityBase";
import { FormVariant, OpportunityRequirement } from "../../types";
import {
  UsNdEarlyTerminationDraftData,
  UsNdEarlyTerminationReferralRecord,
  usNdEarlyTerminationSchema,
} from "./UsNdEarlyTerminationReferralRecord";

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
  keyof UsNdEarlyTerminationReferralRecord["eligibleCriteria"],
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

export class UsNdEarlyTerminationOpportunity extends OpportunityBase<
  Client,
  UsNdEarlyTerminationReferralRecord,
  OpportunityUpdateWithForm<UsNdEarlyTerminationDraftData>
> {
  form: EarlyTerminationForm;

  readonly policyOrMethodologyUrl = WORKFLOWS_METHODOLOGY_URL.US_ND;

  opportunityProfileModules: OpportunityProfileModuleName[] = [
    "ClientProfileDetails",
  ];

  constructor(client: Client) {
    super(
      client,
      "earlyTermination",
      client.rootStore,
      usNdEarlyTerminationSchema.parse
    );

    makeObservable(this, {
      almostEligible: computed,
      requirementsMet: computed,
      requirementsAlmostMet: computed,
      almostEligibleStatusMessage: computed,
    });

    this.denialReasonsMap = DENIAL_REASONS_MAP;
    this.form = new EarlyTerminationForm(this, client.rootStore);
  }

  get almostEligible(): boolean {
    return Object.keys(this.record?.ineligibleCriteria ?? {}).length > 0;
  }

  get almostEligibleStatusMessage(): string | undefined {
    if (!this.almostEligible || !this.record) return;
    const { ineligibleCriteria } = this.record;

    if (ineligibleCriteria.supervisionPastEarlyDischargeDate?.eligibleDate) {
      return `Early termination date (as calculated by DOCSTARS) is within 60 days`;
    }
  }

  get requirementsAlmostMet(): OpportunityRequirement[] {
    if (!this.record) return [];
    const requirementsAlmostMet: OpportunityRequirement[] = [];

    const { ineligibleCriteria } = this.record;

    if (ineligibleCriteria.supervisionPastEarlyDischargeDate?.eligibleDate) {
      requirementsAlmostMet.push({
        text: `Early termination date (as calculated by DOCSTARS) is within 60 days`,
        tooltip: CRITERIA.supervisionPastEarlyDischargeDate.tooltip,
      });
    }
    return requirementsAlmostMet;
  }

  get requirementsMet(): OpportunityRequirement[] {
    if (!this.record) return [];
    const {
      eligibleCriteria: {
        supervisionPastEarlyDischargeDate,
        usNdImpliedValidEarlyTerminationSupervisionLevel,
        usNdImpliedValidEarlyTerminationSentenceType,
      },
    } = this.record;
    const requirements = [];
    if (supervisionPastEarlyDischargeDate?.eligibleDate) {
      requirements.push({
        text: `Early termination date is ${formatWorkflowsDate(
          supervisionPastEarlyDischargeDate.eligibleDate
        )}`,
        tooltip: CRITERIA.supervisionPastEarlyDischargeDate.tooltip,
      });
    }
    return [
      ...requirements,
      {
        text: `Currently on ${usNdImpliedValidEarlyTerminationSupervisionLevel.supervisionLevel.toLowerCase()} supervision`,
        tooltip:
          CRITERIA.usNdImpliedValidEarlyTerminationSupervisionLevel.tooltip,
      },
      {
        text: `Serving ${usNdImpliedValidEarlyTerminationSentenceType.supervisionType.toLowerCase()} sentence`,
        tooltip: CRITERIA.usNdImpliedValidEarlyTerminationSentenceType.tooltip,
      },

      {
        text: `Not on active revocation status`,
        tooltip: CRITERIA.usNdNotInActiveRevocationStatus.tooltip,
      },
    ];
  }

  get formVariant(): FormVariant | undefined {
    if (!this.record) return undefined;

    const {
      eligibleCriteria: { usNdImpliedValidEarlyTerminationSentenceType },
    } = this.record;

    if (
      usNdImpliedValidEarlyTerminationSentenceType?.supervisionType ===
      "DEFERRED"
    ) {
      return "deferred";
    }
  }

  get metadata(): UsNdEarlyTerminationReferralRecord["metadata"] | undefined {
    return this.record?.metadata;
  }
}
