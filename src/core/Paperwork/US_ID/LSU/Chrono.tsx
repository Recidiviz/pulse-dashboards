// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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
import dedent from "dedent";

import { LSUDraftData } from "../../../../WorkflowsStore/Opportunity/LSUReferralRecord";

const template = (form?: Partial<LSUDraftData>): string => {
  return dedent`
    Crime(s): ${form?.chargeDescriptions ?? ""}

    Home Address/Phone/E-mail Address:
    ${form?.contactInformation ?? ""}

    Assessment Score and Date: ${form?.assessmentInformation ?? ""}

    Employment:  ${form?.employmentInformation ?? ""}

    Last Substance Test Result & Date: ${form?.substanceTest ?? ""}

    Court fines and Restitution: ${form?.courtFinesAndRestitution ?? ""}

    Cost of Supervision: ${form?.costOfSupervision ?? ""}

    ILETS Review Date [note any protection orders or NCOs]: ${
      form?.iletsReviewDate ?? ""
    }

    Date Court Order/Parole Contract last reviewed with client: ${
      form?.courtOrderDate ?? ""
    }

    Treatment Completion Date: ${form?.treatmentCompletionDate ?? ""}

    Special Conditions Completed Date(s): ${
      form?.specialConditionsCompletedDates ?? ""
    }

    Pending Special Conditions: ${form?.pendingSpecialConditions ?? ""}

    Current Client Goal(s): ${form?.currentClientGoals ?? ""}

    Client Summary/Other Information: ${form?.clientSummary ?? ""}`;
};

export default template;
