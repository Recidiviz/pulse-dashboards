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

import { computed, makeObservable, override } from "mobx";

import { DocstarsDenialModal } from "../../../../core/OpportunityDenial/UsNd/DocstarsDenialModal";
import { OpportunityUpdateWithForm } from "../../../../FirestoreStore";
import { formatWorkflowsDate } from "../../../../utils";
import { Client } from "../../../Client";
import { EarlyTerminationForm } from "../../Forms/EarlyTerminationForm";
import { OpportunityBase } from "../../OpportunityBase";
import { FormVariant, OpportunityRequirement } from "../../types";
import {
  UsNdEarlyTerminationDraftData,
  UsNdEarlyTerminationReferralRecord,
  usNdEarlyTerminationSchema,
} from "./UsNdEarlyTerminationReferralRecord";

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

  readonly DenialConfirmationModal = DocstarsDenialModal;

  constructor(client: Client) {
    super(
      client,
      "earlyTermination",
      client.rootStore,
      usNdEarlyTerminationSchema.parse,
    );

    makeObservable(this, {
      almostEligible: computed,
      requirementsMet: override,
      requirementsAlmostMet: override,
      almostEligibleStatusMessage: computed,
    });

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
          supervisionPastEarlyDischargeDate.eligibleDate,
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
