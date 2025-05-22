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

import { htmlStringToString } from "../../../utils/formatStrings";
import { UsArInstitutionalWorkerStatusOpportunity } from "../UsAr";
import { UsArInstitutionalWorkerStatusDraftData } from "../UsAr/UsArInstitutionalWorkerStatusOpportunity/UsArInstitutionalWorkerStatusReferralRecord";
import { FormBase, PrefilledDataTransformer } from "./FormBase";

export class UsArInstitutionalWorkerStatusOpportunityForm extends FormBase<
  UsArInstitutionalWorkerStatusDraftData,
  UsArInstitutionalWorkerStatusOpportunity
> {
  get formType(): string {
    return "UsArInstitutionalWorkerStatus";
  }

  prefilledDataTransformer: PrefilledDataTransformer<UsArInstitutionalWorkerStatusDraftData> =
    () => {
      if (!this.opportunity.record) return {};
      if (
        !this.opportunity.record?.approvedVisitors?.length ||
        this.opportunity.record.approvedVisitors.length === 0
      )
        return {};

      const visitors = this.opportunity.record.approvedVisitors.map(
        (visitor) => {
          return {
            firstName: visitor.firstName,
            lastName: visitor.lastName,
            middleName: visitor.middleName,
            suffix: visitor.suffix,
            partyId: visitor.partyId,
            seqNum: visitor.seqNum,
            dateOfBirth: visitor.dateOfBirth,
            dateOfBirthIsApproximate: visitor.dateOfBirthIsApproximate,
            physicalAddress: visitor.physicalAddress,
            mailingAddress: visitor.mailingAddress,
            relationshipType: visitor.relationshipType,
            race: visitor.race,
            sex: visitor.sex,
            checklist: {
              ...visitor.checklist,
            },
            relationshipStatus: visitor.relationshipStatus,
            relationshipStatusDate: visitor.relationshipStatusDate,
            relationshipComments: htmlStringToString(
              visitor.relationshipComments,
            ),
            visitationReviewDate: visitor.visitationReviewDate,
            visitationDurDays: visitor.visitationDurDays,
            visitationSpecialCondition1: visitor.visitationSpecialCondition1,
            visitationSpecialCondition2: visitor.visitationSpecialCondition2,
            visitationStatusReason: visitor.visitationStatusReason,
          };
        },
      );
      return { visitors };
    };
}
