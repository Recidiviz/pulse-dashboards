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

import { transform } from "../../../core/Paperwork/US_TN/CompliantReporting/Transformer";
import { OpportunityFormComponentName } from "../../../core/WorkflowsLayouts";
import {
  CompliantReportingDraftData,
  CompliantReportingOpportunity,
} from "../UsTn";
import { FormBase } from "./FormBase";

export class CompliantReportingForm extends FormBase<
  CompliantReportingDraftData,
  CompliantReportingOpportunity
> {
  navigateToFormText = "Auto-fill referral";

  // eslint-disable-next-line class-methods-use-this
  get formContents(): OpportunityFormComponentName {
    return "WorkflowsCompliantReportingForm";
  }

  get downloadText(): string {
    if (this.formIsDownloading) {
      return "Downloading PDF...";
    }

    if (this.opportunity.updates?.completed) {
      return "Re-download PDF";
    }

    return "Download PDF";
  }

  get formType(): string {
    return "CompliantReportingForm";
  }

  prefilledDataTransformer(): Partial<CompliantReportingDraftData> {
    if (!this.opportunity.record) return {};
    return transform(this.person, this.opportunity.record);
  }
}
