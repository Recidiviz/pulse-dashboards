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

import { makeObservable } from "mobx";

import { OpportunityUpdateWithForm } from "../../firestore";
import { formatWorkflowsDate } from "../../utils";
import { Client } from "../Client";
import { OTHER_KEY } from "../utils";
import { UsTnExpirationForm } from "./Forms/UsTnExpirationForm";
import { OpportunityBase } from "./OpportunityBase";
import { OpportunityRequirement } from "./types";
import {
  getValidator,
  transformReferral,
  UsTnExpirationDraftData,
  UsTnExpirationReferralRecord,
} from "./UsTnExpirationReferralRecord";

const DENIAL_REASONS_MAP = {
  DATE: "DATE: Expiration date is incorrect or missing",
  [OTHER_KEY]: "Other: please specify a reason",
};

const CRITERIA: Record<
  keyof Required<UsTnExpirationReferralRecord>["criteria"],
  OpportunityRequirement
> = {
  supervisionPastFullTermCompletionDateOrUpcoming60Day: {
    text: "Expiration date is $EXPIRATION_DATE",
  },
  usTnNoZeroToleranceCodesSpans: {
    text: "No zero tolerance codes since most recent sentence effective date",
  },
  usTnNotOnLifeSentenceOrLifetimeSupervision: {
    text: "Not on lifetime supervision or lifetime sentence",
  },
};

export class UsTnExpirationOpportunity extends OpportunityBase<
  Client,
  UsTnExpirationReferralRecord,
  OpportunityUpdateWithForm<UsTnExpirationDraftData>
> {
  form: UsTnExpirationForm;

  readonly policyOrMethodologyUrl =
    "https://drive.google.com/file/d/1IpetvPM49g_c-D-HzGdf7v6QAe_z5IHn/view?usp=sharing";

  constructor(client: Client) {
    super(
      client,
      "usTnExpiration",
      client.rootStore,
      transformReferral,
      getValidator(client)
    );

    makeObservable(this, { requirementsMet: true });
    this.denialReasonsMap = DENIAL_REASONS_MAP;
    this.form = new UsTnExpirationForm(this.type, this, client.rootStore);
  }

  get requirementsMet(): OpportunityRequirement[] {
    if (!this.record) return [];

    const { criteria } = this.record;
    const requirements: OpportunityRequirement[] = [];

    if (criteria?.supervisionPastFullTermCompletionDateOrUpcoming60Day) {
      requirements.push({
        text: CRITERIA.supervisionPastFullTermCompletionDateOrUpcoming60Day.text.replace(
          "$EXPIRATION_DATE",
          formatWorkflowsDate(
            criteria.supervisionPastFullTermCompletionDateOrUpcoming60Day
              .eligibleDate
          )
        ),
        tooltip:
          CRITERIA.supervisionPastFullTermCompletionDateOrUpcoming60Day.tooltip,
      });
    }
    if (criteria?.usTnNoZeroToleranceCodesSpans) {
      requirements.push(CRITERIA.usTnNoZeroToleranceCodesSpans);
    }
    if (criteria?.usTnNotOnLifeSentenceOrLifetimeSupervision) {
      requirements.push(CRITERIA.usTnNotOnLifeSentenceOrLifetimeSupervision);
    }

    return requirements;
  }

  get eligibilityDate(): Date | undefined {
    return this.record?.criteria
      ?.supervisionPastFullTermCompletionDateOrUpcoming60Day?.eligibleDate;
  }
}
