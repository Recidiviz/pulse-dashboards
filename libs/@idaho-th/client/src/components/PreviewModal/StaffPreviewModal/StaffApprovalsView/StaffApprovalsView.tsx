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

import { observer } from "mobx-react-lite";
import React, { useState } from "react";
import toast from "react-hot-toast";

import { AttentionFrame } from "~@idaho-th/client/components/common/AttentionFrame/AttentionFrame";
import {
  useHousingApplicationsStore,
  usePreviewModalStore,
} from "~@idaho-th/client/datastores/IdahoTHStoreContext";
import {
  useSetParoleCommissionDecision,
  useStaffHomePlan,
} from "~@idaho-th/client/hooks/housingApplication";
import { useStaffApplicationById } from "~@idaho-th/client/hooks/useApplicationDetail";
import { APPLICATION_STAGE, ParoleCommissionDecision } from "~@idaho-th/shared";

import { StatusBadge } from "../../../StatusBadge/StatusBadge";
import {
  APPROVALS_ACTION,
  type ApprovalsAction,
  TAB_IDS,
} from "../../constants";
import * as PanelStyled from "../../PreviewModal.styles";
import {
  ApprovalsConfirmationModal,
  DecisionGroup,
  type DecisionOption,
  resolveApprovalsAction,
} from "../approvals";
import * as ApprovalsStyled from "../approvals/Approvals.styles";
import { StaffClosedBanner } from "../StaffClosedBanner";
import * as Styled from "./StaffApprovalsView.styles";

const PAROLE_COMMISSION_DECISION_OPTIONS: DecisionOption<ParoleCommissionDecision>[] =
  [
    { value: ParoleCommissionDecision.PAROLE_GRANTED, label: "Parole granted" },
    { value: ParoleCommissionDecision.PAROLE_DENIED, label: "Parole denied" },
    {
      value: ParoleCommissionDecision.NOT_APPLICABLE,
      label: "Not applicable (sentence fully served)",
    },
  ];

// The Commission can rule before a home plan exists; the decision freezes once
// the case reaches Release.
const EDITABLE_STAGES: ReadonlySet<string> = new Set([
  APPLICATION_STAGE.APPLICATION,
  APPLICATION_STAGE.APPROVALS,
]);

/** Termer / Parole Violator cases only: the Parole Commission Decision. */
export const StaffApprovalsView = observer(function StaffApprovalsView() {
  const { currentApplicationId } = useHousingApplicationsStore();
  const { data: currentApplication } = useStaffApplicationById(
    currentApplicationId,
    !!currentApplicationId,
  );
  const { data: homePlanData } = useStaffHomePlan(currentApplicationId);
  const { mutate: setDecision, isPending } = useSetParoleCommissionDecision();

  // A decision that closes or advances the case waits here for confirmation.
  const [pendingSave, setPendingSave] = useState<{
    decision: ParoleCommissionDecision;
    action: ApprovalsAction;
  } | null>(null);
  const previewModalStore = usePreviewModalStore();

  const persisted = currentApplication?.paroleCommissionDecision ?? null;
  const isClosed = currentApplication?.stage === APPLICATION_STAGE.CLOSED;
  const editable =
    currentApplication != null && EDITABLE_STAGES.has(currentApplication.stage);

  const save = (
    decision: ParoleCommissionDecision,
    action: ApprovalsAction | null,
  ) => {
    if (!currentApplicationId) {
      toast.error("No active application found.");
      return;
    }

    setDecision(
      { applicationId: currentApplicationId, decision },
      {
        onSuccess: () => {
          setPendingSave(null);
          toast("Parole Commission Decision saved.");
          if (action === APPROVALS_ACTION.ADVANCE_TO_RELEASE) {
            previewModalStore.setActiveTab(TAB_IDS.HOME_PLAN);
            previewModalStore.setHomePlanModal({ type: "updateReleaseDate" });
          }
        },
        onError: () =>
          toast.error("Failed to save the Parole Commission Decision."),
      },
    );
  };

  const handleSave = (decision: ParoleCommissionDecision) => {
    const action = resolveApprovalsAction(
      {
        paroleCommissionDecision: decision,
        releaseDecision: null,
        homePlanInvestigation:
          homePlanData?.approvals?.homePlanInvestigation ?? null,
      },
      { isRider: false, hasHomePlan: homePlanData?.homePlan != null },
    );

    if (action == null) {
      save(decision, action);
      return;
    }

    setPendingSave({ decision, action });
  };

  return (
    <>
      <Styled.PanelRoot>
        <PanelStyled.PanelHeader>
          <PanelStyled.PanelTitle>Approvals</PanelStyled.PanelTitle>
        </PanelStyled.PanelHeader>

        <Styled.PanelBody>
          {isClosed && <StaffClosedBanner />}

          {editable ? (
            <AttentionFrame
              active
              hideFrame={
                currentApplication.stage !== APPLICATION_STAGE.APPROVALS
              }
            >
              <ApprovalsStyled.ApprovalsSection>
                <DecisionGroup
                  title="Parole Commission Decision"
                  name="paroleCommissionDecision"
                  options={PAROLE_COMMISSION_DECISION_OPTIONS}
                  persisted={persisted}
                  editable
                  isSaving={isPending}
                  isSavingThisGroup={isPending}
                  onSave={handleSave}
                />
              </ApprovalsStyled.ApprovalsSection>
            </AttentionFrame>
          ) : (
            // Locked: same summary row as the Home Plan Investigation.
            <ApprovalsStyled.ApprovalsSummary>
              <ApprovalsStyled.ApprovalsSummaryRow>
                <ApprovalsStyled.SectionTitle>
                  Parole Commission Decision
                </ApprovalsStyled.SectionTitle>
                {persisted ? <StatusBadge status={persisted} /> : "--"}
              </ApprovalsStyled.ApprovalsSummaryRow>
            </ApprovalsStyled.ApprovalsSummary>
          )}
        </Styled.PanelBody>
      </Styled.PanelRoot>

      <ApprovalsConfirmationModal
        isOpen={pendingSave != null}
        action={pendingSave?.action ?? null}
        onClose={() => setPendingSave(null)}
        onConfirm={() =>
          pendingSave != null && save(pendingSave.decision, pendingSave.action)
        }
        isLoading={isPending}
      />
    </>
  );
});
