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
import { formatNameLastFirst } from "../../../utils";
import {
  UsCaSupervisionLevelDowngradeOpportunity,
  UsCaSupervisionLevelDowngradeSharedDraftData,
} from "../UsCa";
import { FormBase, PrefilledDataTransformer } from "./FormBase";

export class UsCaSupervisionLevelDowngradeForm3043 extends FormBase<
  UsCaSupervisionLevelDowngradeSharedDraftData,
  UsCaSupervisionLevelDowngradeOpportunity
> {
  navigateToFormText = "Reduce level";

  // eslint-disable-next-line class-methods-use-this
  get formContents(): OpportunityFormComponentName {
    return "WorkflowsUsCaSupervisionLevelDowngradeForm3043";
  }

  get formType(): string {
    return "UsCaSupervisionLevelDowngradeForm";
  }

  prefilledDataTransformer: PrefilledDataTransformer<UsCaSupervisionLevelDowngradeSharedDraftData> =
    () => {
      if (!this.opportunity.record) return {};
      const {
        person,
        record: { formInformation },
      } = this.opportunity;

      return {
        cdcNumber: person.displayId,
        fullName: formatNameLastFirst(person.fullName),
        unit: formInformation.paroleUnit,
        supervisionLevel: formInformation.supervisionLevel,
      };
    };
}