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
import { DocumentData } from "firebase/firestore";

import { Client } from "../../../Client";
import { UsCaSupervisionLevelDowngradeForm } from "../../Forms/UsCaSupervisionLevelDowngradeForm";
import { UsCaSupervisionLevelDowngradeForm3043 } from "../../Forms/UsCaSupervisionLevelDowngradeForm3043";
import { OpportunityBase } from "../../OpportunityBase";
import {
  UsCaSupervisionLevelDowngradeReferralRecord,
  usCaSupervisionLevelDowngradeSchema,
} from "./UsCaSupervisionLevelDowngradeReferralRecord";

export class UsCaSupervisionLevelDowngradeOpportunity extends OpportunityBase<
  Client,
  UsCaSupervisionLevelDowngradeReferralRecord
> {
  form:
    | UsCaSupervisionLevelDowngradeForm3043
    | UsCaSupervisionLevelDowngradeForm;

  constructor(client: Client, record: DocumentData) {
    super(
      client,
      "usCaSupervisionLevelDowngrade",
      client.rootStore,
      usCaSupervisionLevelDowngradeSchema.parse(record),
    );

    this.form =
      this.record.caseType && this.record.caseType === "SEX_OFFENSE"
        ? new UsCaSupervisionLevelDowngradeForm3043(this, client.rootStore)
        : new UsCaSupervisionLevelDowngradeForm(this, client.rootStore);
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
