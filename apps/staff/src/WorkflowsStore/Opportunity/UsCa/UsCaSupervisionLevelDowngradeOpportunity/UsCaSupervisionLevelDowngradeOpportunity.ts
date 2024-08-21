// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import * as Sentry from "@sentry/react";

import { Client } from "../../../Client";
import { UsCaSupervisionLevelDowngradeForm } from "../../Forms/UsCaSupervisionLevelDowngradeForm";
import { OpportunityBase } from "../../OpportunityBase";
import { SupervisionOpportunityType } from "../../OpportunityConfigs";
import {
  UsCaSupervisionLevelDowngradeReferralRecord,
  usCaSupervisionLevelDowngradeSchema,
} from "./UsCaSupervisionLevelDowngradeReferralRecord";

const OPPORTUNITY_TYPE: SupervisionOpportunityType =
  "usCaSupervisionLevelDowngrade";

export class UsCaSupervisionLevelDowngradeOpportunity extends OpportunityBase<
  Client,
  UsCaSupervisionLevelDowngradeReferralRecord
> {
  form: UsCaSupervisionLevelDowngradeForm;

  constructor(client: Client) {
    super(
      client,
      OPPORTUNITY_TYPE,
      client.rootStore,
      usCaSupervisionLevelDowngradeSchema.parse,
    );

    this.form = new UsCaSupervisionLevelDowngradeForm(this, client.rootStore);
  }

  get eligibilityDate(): Date | undefined {
    if (!this.record) return;
    return this.record.eligibleCriteria.supervisionLevelIsHighFor6Months
      .highStartDate;
  }

  get eligibilityCallToActionText(): string {
    const { tooltipEligibilityText } = this.config;
    if (!tooltipEligibilityText) {
      Sentry.captureException(
        "null tooltipEligibilityText for UsCaSupervisionLevelDowngradeOpportunity",
      );

      return "";
    }

    return `${
      this.person.displayPreferredName
    } is ${tooltipEligibilityText.toLowerCase()}`;
  }
}
