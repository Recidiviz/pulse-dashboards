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

import { DocumentData } from "firebase/firestore";

import { Client } from "../../../Client";
import { CompliantReportingForm } from "../../Forms/CompliantReportingForm";
import { OpportunityBase } from "../../OpportunityBase";
import {
  UsTnCompliantReporting2025PolicyReferralRecord,
  usTnCompliantReporting2025PolicySchema,
} from "./UsTnCompliantReporting2025PolicyReferralRecord";

export class UsTnCompliantReporting2025PolicyOpportunity extends OpportunityBase<
  Client,
  UsTnCompliantReporting2025PolicyReferralRecord
> {
  form: CompliantReportingForm;

  readonly hideUnknownCaseNoteDates = true;

  readonly caseNotesTitle = "Other Relevant Information";

  constructor(client: Client, record: DocumentData) {
    super(
      client,
      "usTnCompliantReporting2025Policy",
      client.rootStore,
      usTnCompliantReporting2025PolicySchema.parse(record),
    );

    this.form = new CompliantReportingForm(this, client.rootStore);
  }

  // This is needed for a field in the shared form. The original CR Opportunity and this 2025 Opportunity use different
  // fields for the drugScreenDate so we override it here to pass to the form
  get drugScreenDate() {
    return this.record.eligibleCriteria.latestDrugTestIsNegativeOrMissing
      ?.latestDrugScreenDate;
  }

  get subcategory() {
    if (this.isSubmitted || this.denied) return;

    if (this.almostEligible) return this.record.metadata.tabName;
  }

  get eligibilityDate(): Date | undefined {
    return super.eligibilityDate ?? this.record?.metadata.eligibleDate;
  }

  get denialReasons() {
    let keys: string[];
    if (this.record?.metadata.taskName === "MINIMUM (LOW)") {
      keys = [
        "FELONY",
        "REPORTING",
        "CONDITIONS",
        "NEEDS",
        "CASE",
        "FEE",
        "JUDGE",
        "EXPIRE",
        "Other",
      ];
    } else if (this.record?.metadata.taskName === "INTAKE") {
      keys = [
        "CONTACT",
        "FELONY",
        "REPORTING",
        "CONDITIONS",
        "CASE",
        "FEE",
        "JUDGE",
        "EXPIRE",
        "Other",
      ];
    } else {
      return this.config.denialReasons;
    }

    return Object.fromEntries(
      Object.entries(this.config.denialReasons).filter(([key]) =>
        keys.includes(key),
      ),
    );
  }
}
