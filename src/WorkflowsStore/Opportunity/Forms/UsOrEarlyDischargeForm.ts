// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import { OpportunityFormComponentName } from "../../../core/WorkflowsLayouts";
import { formatWorkflowsDate } from "../../../utils";
import {
  UsOrEarlyDischargeDraftData,
  UsOrEarlyDischargeOpportunity,
} from "../UsOr";
import { FormBase, PrefilledDataTransformer } from "./FormBase";

export class UsOrEarlyDischargeForm extends FormBase<
  UsOrEarlyDischargeDraftData,
  UsOrEarlyDischargeOpportunity
> {
  navigateToFormText = "Generate paperwork";

  // eslint-disable-next-line class-methods-use-this
  get formContents(): OpportunityFormComponentName {
    return "FormUsOrEarlyDischarge";
  }

  prefilledDataTransformer: PrefilledDataTransformer<UsOrEarlyDischargeDraftData> =
    () => {
      if (!this.opportunity.record) return {};

      const { givenNames, middleNames, surname } = this.person.fullName;

      const clientId = this.person.externalId;

      const officerName = `Caseload ${this.person.assignedStaff?.surname}`;

      const todaysDate = formatWorkflowsDate(new Date());

      // TODO(#4437): Add sentence information once populated in record

      return {
        givenNames,
        middleNames,
        surname,
        clientId,
        officerName,
        todaysDate,
      };
    };
}
