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

import { differenceInDays } from "date-fns";
import { makeObservable } from "mobx";
import simplur from "simplur";

import { OpportunityProfileModuleName } from "../../../../core/WorkflowsClientProfile/OpportunityProfile";
import {
  ExternalRequestUpdate,
  ExternalSystemRequestStatus,
  UsTnContactNote,
  UsTnExpirationOpportunityUpdate,
} from "../../../../FirestoreStore";
import { formatWorkflowsDate } from "../../../../utils";
import { Client } from "../../../Client";
import { OTHER_KEY } from "../../../utils";
import { UsTnExpirationForm } from "../../Forms/UsTnExpirationForm";
import { OpportunityBase } from "../../OpportunityBase";
import { OpportunityRequirement } from "../../types";
import {
  getUsTnExpirationValidator,
  UsTnExpirationReferralRecord,
  usTnExpirationSchema,
} from "./UsTnExpirationReferralRecord";

const DENIAL_REASONS_MAP = {
  DATE: "DATE: Expiration date is incorrect or missing",
  [OTHER_KEY]: "Other: please specify a reason",
};

const CRITERIA: Record<
  keyof Required<UsTnExpirationReferralRecord>["eligibleCriteria"],
  OpportunityRequirement
> = {
  supervisionPastFullTermCompletionDateOrUpcoming1Day: {
    text: "Expiration date is $EXPIRATION_DATE",
  },
  usTnNoZeroToleranceCodesSpans: {
    text: "No zero tolerance codes since most recent sentence imposed date",
  },
  usTnNotOnLifeSentenceOrLifetimeSupervision: {
    text: "Not on lifetime supervision or lifetime sentence",
  },
};

export function hydrateExpirationDateRequirementText(
  criterion: Required<UsTnExpirationReferralRecord>["eligibleCriteria"]["supervisionPastFullTermCompletionDateOrUpcoming1Day"]
) {
  const eligibleDate = criterion?.eligibleDate;
  const today = new Date();

  // .toDateString() returns only the date part of the Date() as a string
  if (eligibleDate.toDateString() === today.toDateString()) {
    return `Expiration date is today (${formatWorkflowsDate(eligibleDate)})`;
  }
  const daysPast = differenceInDays(today, eligibleDate);
  return simplur`${daysPast} day[|s] past expiration date (${formatWorkflowsDate(
    eligibleDate
  )})`;
}

export class UsTnExpirationOpportunity extends OpportunityBase<
  Client,
  UsTnExpirationReferralRecord,
  UsTnExpirationOpportunityUpdate
> {
  readonly supportsExternalRequest = true;

  readonly externalRequestStatusMessage = "TEPE note submitted on";

  form: UsTnExpirationForm;

  readonly policyOrMethodologyUrl =
    "https://drive.google.com/file/d/1IpetvPM49g_c-D-HzGdf7v6QAe_z5IHn/view?usp=sharing";

  readonly opportunityProfileModules: OpportunityProfileModuleName[] = [
    "ClientProfileDetails",
    "CaseNotes",
  ];

  constructor(client: Client) {
    super(
      client,
      "usTnExpiration",
      client.rootStore,
      usTnExpirationSchema.parse,
      getUsTnExpirationValidator(client)
    );

    makeObservable(this, { requirementsMet: true });
    this.denialReasonsMap = DENIAL_REASONS_MAP;
    this.form = new UsTnExpirationForm(this, client.rootStore);
  }

  get requirementsMet(): OpportunityRequirement[] {
    if (!this.record) return [];

    const { eligibleCriteria } = this.record;
    const requirements: OpportunityRequirement[] = [];

    if (eligibleCriteria?.supervisionPastFullTermCompletionDateOrUpcoming1Day) {
      requirements.push({
        text: hydrateExpirationDateRequirementText(
          eligibleCriteria.supervisionPastFullTermCompletionDateOrUpcoming1Day
        ),
        tooltip:
          CRITERIA.supervisionPastFullTermCompletionDateOrUpcoming1Day.tooltip,
      });
    }
    if (eligibleCriteria?.usTnNoZeroToleranceCodesSpans) {
      requirements.push(CRITERIA.usTnNoZeroToleranceCodesSpans);
    }
    if (eligibleCriteria?.usTnNotOnLifeSentenceOrLifetimeSupervision) {
      requirements.push(CRITERIA.usTnNotOnLifeSentenceOrLifetimeSupervision);
    }

    return requirements;
  }

  get eligibilityDate(): Date | undefined {
    return this.record?.eligibleCriteria
      ?.supervisionPastFullTermCompletionDateOrUpcoming1Day?.eligibleDate;
  }

  get externalRequestData():
    | ExternalRequestUpdate<UsTnContactNote>
    | undefined {
    return this.updates?.contactNote;
  }

  get externalRequestStatus(): ExternalSystemRequestStatus | undefined {
    return this.externalRequestData?.status;
  }

  get isNoteLoading(): boolean {
    return (
      this.externalRequestStatus === "PENDING" ||
      this.externalRequestStatus === "IN_PROGRESS"
    );
  }
}
