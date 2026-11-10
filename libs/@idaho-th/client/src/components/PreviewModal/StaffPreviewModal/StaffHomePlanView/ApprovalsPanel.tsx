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

import { AttentionFrame } from "~@idaho-th/client/components/common/AttentionFrame/AttentionFrame";
import type {
  ApprovalsDecisionInput,
  StaffHomePlan,
} from "~@idaho-th/client/interfaces/common";

import { StatusBadge } from "../../../StatusBadge/StatusBadge";
import { DecisionGroup } from "../approvals";
import * as ApprovalsStyled from "../approvals/Approvals.styles";
import {
  HOME_PLAN_INVESTIGATION_RADIO_NAME,
  RELEASE_DECISION_OPTIONS,
  RELEASE_DECISION_RADIO_NAME,
  RIDER_HOME_PLAN_INVESTIGATION_OPTIONS,
  TERMER_HOME_PLAN_INVESTIGATION_OPTIONS,
} from "./ApprovalsPanel.constants";
import type { ApprovalsDecisionField } from "./ApprovalsPanel.utils";
import * as Styled from "./StaffHomePlanView.styles";

interface ApprovalsPanelProps {
  homePlanData: StaffHomePlan | undefined;
  /** Riders also record the court's Release Decision here. */
  isRider: boolean;
  onSave: (decisions: ApprovalsDecisionInput) => void;
  savingDecision?: ApprovalsDecisionField | null;
}

export const ApprovalsPanel: React.FC<ApprovalsPanelProps> = ({
  homePlanData,
  isRider,
  onSave,
  savingDecision = null,
}) => {
  const isSaving = savingDecision != null;

  const approvals = homePlanData?.approvals ?? null;
  const canSetApprovals = homePlanData?.permissions.canSetApprovals ?? false;

  // Once the case leaves Approvals the decisions are frozen and the panel
  // collapses to a single labelled row.
  if (approvals != null && !canSetApprovals) {
    return (
      <ApprovalsStyled.ApprovalsSummary>
        <ApprovalsStyled.ApprovalsSummaryRow>
          <ApprovalsStyled.SectionTitle>
            Home Plan Investigation
          </ApprovalsStyled.SectionTitle>
          {approvals.badge ? <StatusBadge status={approvals.badge} /> : null}
        </ApprovalsStyled.ApprovalsSummaryRow>
      </ApprovalsStyled.ApprovalsSummary>
    );
  }

  // The investigation comes first: for a Rider it happens before the court
  // hearing. Either can be saved first; the order is visual only.
  return (
    <AttentionFrame active={canSetApprovals}>
      <ApprovalsStyled.ApprovalsSection>
        <DecisionGroup
          title="Home Plan Investigation"
          name={HOME_PLAN_INVESTIGATION_RADIO_NAME}
          options={
            isRider
              ? RIDER_HOME_PLAN_INVESTIGATION_OPTIONS
              : TERMER_HOME_PLAN_INVESTIGATION_OPTIONS
          }
          persisted={approvals?.homePlanInvestigation ?? null}
          editable={canSetApprovals}
          isSaving={isSaving}
          isSavingThisGroup={savingDecision === "homePlanInvestigation"}
          onSave={(homePlanInvestigation) => onSave({ homePlanInvestigation })}
        />

        {isRider && (
          <>
            <Styled.Divider />

            <DecisionGroup
              title="Release Decision"
              name={RELEASE_DECISION_RADIO_NAME}
              options={RELEASE_DECISION_OPTIONS}
              persisted={approvals?.releaseDecision ?? null}
              editable={canSetApprovals}
              isSaving={isSaving}
              isSavingThisGroup={savingDecision === "releaseDecision"}
              onSave={(releaseDecision) => onSave({ releaseDecision })}
            />
          </>
        )}
      </ApprovalsStyled.ApprovalsSection>
    </AttentionFrame>
  );
};
