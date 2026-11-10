// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import React from "react";

import type {
  ApprovalsDecisionInput,
  StaffHomePlan,
} from "~@idaho-th/client/interfaces/common";
import { HomePlanApprovalsBadge } from "~@idaho-th/shared";

import { ApprovalsPanel } from "./ApprovalsPanel";
import type { ApprovalsDecisionField } from "./ApprovalsPanel.utils";
import { ReleaseTasks } from "./ReleaseTasks";
import * as Styled from "./StaffHomePlanView.styles";

interface TaskSectionsProps {
  homePlanData: StaffHomePlan | undefined;
  isRider: boolean;
  onSaveApprovals: (decisions: ApprovalsDecisionInput) => void;
  savingApprovalsDecision?: ApprovalsDecisionField | null;
}

export const TaskSections: React.FC<TaskSectionsProps> = ({
  homePlanData,
  isRider,
  onSaveApprovals,
  savingApprovalsDecision,
}) => {
  // A denied release or a rejected home plan closes the case, so there are no
  // release tasks left to work.
  const approvalsBadge = homePlanData?.approvals?.badge;
  const isApprovalsDenied =
    approvalsBadge === HomePlanApprovalsBadge.HOUSING_PLAN_REJECTED ||
    approvalsBadge === HomePlanApprovalsBadge.RELEASE_DENIED;

  return (
    <>
      <Styled.Divider />

      <ApprovalsPanel
        homePlanData={homePlanData}
        isRider={isRider}
        onSave={onSaveApprovals}
        savingDecision={savingApprovalsDecision}
      />

      {!isApprovalsDenied && (
        <>
          <Styled.Divider />

          <ReleaseTasks homePlanData={homePlanData} />
        </>
      )}
    </>
  );
};
