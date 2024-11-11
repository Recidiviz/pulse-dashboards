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

import { formatWorkflowsDate } from "../../../../utils";
import { Resident } from "../../../Resident";
import { OpportunityBase } from "../../OpportunityBase";
import { OpportunityTab } from "../../types";
import {
  UsAzOverdueForAcisTprReferralRecord,
  usAzOverdueForAcisTprSchema,
} from "./UsAzOverdueForAcisTprReferralRecord";

export class UsAzOverdueForAcisTprOpportunity extends OpportunityBase<
  Resident,
  UsAzOverdueForAcisTprReferralRecord
> {
  // TODO(#6707) move to configuration
  readonly caseNotesTitle = "Additional Information from ACIS";

  constructor(resident: Resident, record: DocumentData) {
    super(
      resident,
      "usAzOverdueForACISTPR",
      resident.rootStore,
      usAzOverdueForAcisTprSchema.parse(record),
    );
  }

  get highlightCalloutText(): string {
    return `${this.person.displayName} is past their TPR date on ${formatWorkflowsDate(this.eligibilityDate)}`;
  }

  get eligibilityDate(): Date {
    return new Date(
      this.record.eligibleCriteria.usAzIncarcerationPastAcisTprDate.acisTprDate,
    );
  }

  tabTitle(): OpportunityTab {
    return "Overdue";
  }
}
