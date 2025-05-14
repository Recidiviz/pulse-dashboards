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

import { formatDuration, intervalToDuration } from "date-fns";
import dedent from "dedent";

import { OpportunityFormComponentName } from "../../../core/WorkflowsLayouts";
import {
  UsNeSupervisionDowngradeDraftData,
  UsNeSupervisionDowngradeOpportunity,
} from "../UsNe";
import { FormBase } from "./FormBase";

export class UsNeSupervisionDowngradeForm extends FormBase<
  UsNeSupervisionDowngradeDraftData,
  UsNeSupervisionDowngradeOpportunity
> {
  navigateToFormText = "Generate Email";

  get formContents(): OpportunityFormComponentName {
    return "WorkflowsUsNeSupervisionDowngradeForm";
  }

  get formType(): string {
    return "UsNeSupervisionDowngradeForm";
  }

  prefilledDataTransformer(): Partial<UsNeSupervisionDowngradeDraftData> {
    if (!this.opportunity.record || !this.person) return {};

    const clientName = this.person.displayName;
    const clientId = this.person.displayId;
    const officerName =
      this.rootStore.userStore.userFullName ??
      this.person.assignedStaffFullName;
    const riskLevel =
      this.opportunity.record.metadata.recentOrasScores[0].assessmentLevel?.toLowerCase() ??
      "unknown";
    const supervisionTimeString =
      this.person.supervisionStartDate &&
      formatDuration(
        intervalToDuration({
          start: this.person.supervisionStartDate,
          end: new Date(),
        }),
        { format: ["years", "months", "days"], delimiter: ", " },
      );
    const oppName = this.opportunity.config.label;

    const emailText = dedent`${clientName} is recommended by Officer ${officerName} for ${oppName}.  
    
    This client has been on supervision for ${supervisionTimeString} and is more than 1 month away from their EDD. They are currently on a ${riskLevel} risk level per ORAS. They’ve had no Level 3, 4, or 5 violations in the past 6 months. 
    
    The officer has also confirmed the client has no relevant pending charges or warrants in NCJIS, and has been compliant with their case plan. 
    
    The officer has confirmed stability factors including residence.
    
    The client’s ID number is ${clientId}.`;

    return { emailText };
  }
}
