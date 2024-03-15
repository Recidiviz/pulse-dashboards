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

import { OpportunityUpdateWithForm } from "../../../../FirestoreStore";
import { Resident } from "../../../Resident";
import { UsTnAnnualReclassificationReviewForm } from "../../Forms/UsTnAnnualReclassificationReviewForm";
import { UsTnCustodyLevelDowngradeForm } from "../../Forms/usTnCustodyLevelDowngradeForm";
import { OpportunityBase } from "../../OpportunityBase";
import { UsTnSharedReclassificationDraftData } from "../UsTnSharedCriteria";
import {
  UsTnCustodyLevelDowngradeReferralRecord,
  usTnCustodyLevelDowngradeSchema,
} from "./UsTnCustodyLevelDowngradeReferralRecord";

export class UsTnCustodyLevelDowngradeOpportunity extends OpportunityBase<
  Resident,
  UsTnCustodyLevelDowngradeReferralRecord,
  OpportunityUpdateWithForm<UsTnSharedReclassificationDraftData>
> {
  form: UsTnCustodyLevelDowngradeForm;

  readonly caseNotesTitle = "Disciplinaries";

  constructor(resident: Resident) {
    super(
      resident,
      "usTnCustodyLevelDowngrade",
      resident.rootStore,
      usTnCustodyLevelDowngradeSchema.parse,
    );

    if (
      resident.rootStore.workflowsStore.featureVariants
        .usTnAnnualReclassification
    ) {
      this.form = new UsTnAnnualReclassificationReviewForm(
        this,
        resident.rootStore,
      );
    } else {
      this.form = new UsTnCustodyLevelDowngradeForm(this, resident.rootStore);
    }
  }
}
