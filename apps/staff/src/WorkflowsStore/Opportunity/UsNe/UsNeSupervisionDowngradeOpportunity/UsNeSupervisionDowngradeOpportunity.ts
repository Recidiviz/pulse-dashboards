// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { DocumentData } from "@google-cloud/firestore";
import { differenceInDays, startOfToday } from "date-fns";

import { OpportunityType } from "~datatypes";

import { OpportunityUpdateWithForm } from "../../../../FirestoreStore";
import { Client } from "../../../Client";
import { UsNeSupervisionDowngradeForm } from "../../Forms/UsNeSupervisionDowngradeForm";
import { OpportunityBase } from "../../OpportunityBase";
import {
  UsNeSupervisionDowngradeDraftData,
  usNeSupervisionDowngradeSchema,
  UsNeSupervisionDowngradeSchemaReferralRecord,
} from "./UsNeSupervisionDowngradeOpportunityReferralRecord";

export class UsNeSupervisionDowngradeOpportunity extends OpportunityBase<
  Client,
  UsNeSupervisionDowngradeSchemaReferralRecord,
  OpportunityUpdateWithForm<UsNeSupervisionDowngradeDraftData>
> {
  form: UsNeSupervisionDowngradeForm;

  constructor(
    client: Client,
    record: DocumentData,
    opportunityType: OpportunityType,
  ) {
    super(
      client,
      opportunityType,
      client.rootStore,
      usNeSupervisionDowngradeSchema.parse(record),
    );

    this.form = new UsNeSupervisionDowngradeForm(this, this.rootStore);
  }

  // Helper for dependently switching a criteria to almost eligible
  get onParoleAtLeastOneYear(): boolean {
    if (!this.person.supervisionStartDate) return false;
    return (
      differenceInDays(startOfToday(), this.person.supervisionStartDate) > 365
    );
  }

  get requirementsMet() {
    if (this.onParoleAtLeastOneYear) return super.requirementsMet;
    return super.requirementsMet.filter(
      ({ key }) => key !== "onParoleAtLeast6Months",
    );
  }

  get requirementsAlmostMet() {
    const paroleReq = super.requirementsMet.find(
      ({ key }) => key === "onParoleAtLeast6Months",
    );
    if (this.onParoleAtLeastOneYear || !paroleReq)
      return super.requirementsAlmostMet;
    return [...super.requirementsAlmostMet, paroleReq];
  }
}
