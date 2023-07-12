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

import { formatNameLastFirst } from "../../../utils";
import { UsCaSupervisionLevelDowngradeOpportunity } from "../UsCaSupervisionLevelDowngradeOpportunity";
import { UsCaSupervisionLevelDowngradeDraftData } from "../UsCaSupervisionLevelDowngradeReferralRecord";
import { FormBase, PrefilledDataTransformer } from "./FormBase";

export class UsCaSupervisionLevelDowngradeForm extends FormBase<
  UsCaSupervisionLevelDowngradeDraftData,
  UsCaSupervisionLevelDowngradeOpportunity
> {
  navigateToFormText = "Generate paperwork";

  prefilledDataTransformer: PrefilledDataTransformer<UsCaSupervisionLevelDowngradeDraftData> =
    () => {
      if (!this.opportunity.record) return {};
      const { client } = this.opportunity;

      const cdcNumber = client.externalId;

      return {
        cdcNumber,
        fullName: formatNameLastFirst(client.fullName),
      };
    };
}
