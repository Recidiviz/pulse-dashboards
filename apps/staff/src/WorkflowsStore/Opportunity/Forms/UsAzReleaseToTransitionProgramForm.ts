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

import { OpportunityFormComponentName } from "../../../core/WorkflowsLayouts";
import { formatDate, formatNameLastFirst } from "../../../utils/formatStrings";
import { UsAzOverdueForAcisDtpOpportunity } from "../UsAz/UsAzOverdueForAcisDtpOpportunity/UsAzOverdueForAcisDtpOpportunity";
import { UsAzOverdueForAcisTprOpportunity } from "../UsAz/UsAzOverdueForAcisTprOpportunity/UsAzOverdueForAcisTprOpportunity";
import { UsAzReleaseToDTPOpportunity } from "../UsAz/UsAzReleaseToDTPOpportunity/UsAzReleaseToDTPOpportunity";
import { UsAzReleaseToTPROpportunity } from "../UsAz/UsAzReleaseToTPROpportunity/UsAzReleaseToTPROpportunity";
import { UsAzReleaseToTransitionProgramDraftData } from "../UsAz/UsAzReleaseToTransitionProgramBaseSchema";
import { FormBase, PrefilledDataTransformer } from "./FormBase";

export class UsAzReleaseToTransitionProgramForm extends FormBase<
  UsAzReleaseToTransitionProgramDraftData,
  | UsAzReleaseToTPROpportunity
  | UsAzReleaseToDTPOpportunity
  | UsAzOverdueForAcisTprOpportunity
  | UsAzOverdueForAcisDtpOpportunity
> {
  navigateToFormText = "Download Agreement Form";
  allowRevert = false;

  get formContents(): OpportunityFormComponentName {
    return "WorkflowsUsAzReleaseToTransitionProgramForm";
  }

  get formType(): string {
    return "UsAzReleaseToTransitionProgramForm";
  }

  prefilledDataTransformer: PrefilledDataTransformer<UsAzReleaseToTransitionProgramDraftData> =
    () => {
      if (!this.opportunity) return {};
      const { person } = this.opportunity;

      return {
        isDTPRelease:
          this.opportunity instanceof UsAzReleaseToDTPOpportunity ||
          this.opportunity instanceof UsAzOverdueForAcisDtpOpportunity,
        residentNameLastFirst: formatNameLastFirst(person.fullName),
        adcNumber: person.displayId,
        residentNameAndAdcNumber: `${person.displayName} (${person.displayId})`,
        date: formatDate(new Date()),
        staffNameLastFirst: person.assignedStaff
          ? formatNameLastFirst(person.assignedStaff)
          : "",
      };
    };
}
