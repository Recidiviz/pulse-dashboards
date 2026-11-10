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
import React, { useMemo, useState } from "react";
import toast from "react-hot-toast";

import { ActionButton } from "~@idaho-th/client/components/common/buttons";
import { HOME_PLAN_TYPE } from "~@idaho-th/client/constants/common";
import {
  useHousingApplicationsStore,
  usePreviewModalStore,
} from "~@idaho-th/client/datastores/IdahoTHStoreContext";
import {
  useAcceptProviderAsHomePlan,
  useSetHomePlanApprovals,
  useSetManualAddressHomePlan,
  useStaffHomePlan,
} from "~@idaho-th/client/hooks/housingApplication";
import {
  useCurrentApplicationDetail,
  useStaffApplicationById,
  useStaffApplicationProviders,
} from "~@idaho-th/client/hooks/useApplicationDetail";
import type {
  ApprovalsDecisionInput,
  HousingProvider,
} from "~@idaho-th/client/interfaces/common";
import { extractEligibilityParams } from "~@idaho-th/client/utils/eligibility";
import { generateLabels } from "~@idaho-th/client/utils/labelGenerator";
import {
  APPLICATION_STAGE,
  APPLICATION_SUB_STAGE,
  isRider,
} from "~@idaho-th/shared";

import { APPROVALS_ACTION, type ApprovalsAction } from "../../constants";
import * as PanelStyled from "../../PreviewModal.styles";
import { useCloseApplication } from "../../Sidebar/common";
import type { HomePlanModalState } from "../../types";
import { UpdateReleaseDateModal } from "../../UpdateReleaseDateModal";
import {
  ApprovalsConfirmationModal,
  resolveApprovalsAction,
} from "../approvals";
import { AcceptAsHomePlanModal } from "../common/AcceptAsHomePlan";
import { StaffClosedBanner } from "../StaffClosedBanner";
import { normalizeParams } from "../utils/prepareEligibleProviders";
import { AddressInputModal } from "./AddressInputModal";
import { ApplicationStageEmptyState } from "./ApplicationStageEmptyState";
import { APPROVALS_SAVED_TOAST } from "./ApprovalsPanel.constants";
import {
  type ApprovalsDecisionField,
  getDecisionField,
} from "./ApprovalsPanel.utils";
import { HomePlanRow } from "./HomePlanRow";
import { SelectProviderModal } from "./SelectProviderModal";
import * as Styled from "./StaffHomePlanView.styles";
import { TaskSections } from "./TaskSections";

const ELIGIBLE_PROVIDER_FILTERS = {
  subStage: [APPLICATION_SUB_STAGE.CONDITIONALLY_APPROVED],
};

export const StaffHomePlanView = observer(function StaffHomePlanView() {
  const store = useHousingApplicationsStore();
  const { currentApplicationId } = store;
  const { formData: form } = useCurrentApplicationDetail() ?? {};

  const { data: currentApplication } = useStaffApplicationById(
    currentApplicationId,
    !!currentApplicationId,
  );
  const isClosed = currentApplication?.stage === APPLICATION_STAGE.CLOSED;
  const isApplicationStage =
    currentApplication?.stage === APPLICATION_STAGE.APPLICATION;
  const isRiderCase = isRider(form?.legalCurrentStatus);
  const { openCloseApplicationConfirm, modals: closeApplicationModals } =
    useCloseApplication(currentApplicationId);

  const {
    data: homePlanData,
    isLoading: isHomePlanLoading,
    isError: isHomePlanError,
  } = useStaffHomePlan(currentApplicationId);

  const {
    data: providersData,
    isLoading: isProvidersLoading,
    isError: isProvidersError,
  } = useStaffApplicationProviders(
    currentApplicationId,
    !!currentApplicationId,
    ELIGIBLE_PROVIDER_FILTERS,
  );

  const { mutate: setManualAddress, isPending: isSavingAddress } =
    useSetManualAddressHomePlan();

  const { mutate: acceptProviderAsHomePlan, isPending: isAccepting } =
    useAcceptProviderAsHomePlan();

  const { mutate: setHomePlanApprovals, isPending: isSavingApprovals } =
    useSetHomePlanApprovals();
  // Which of the two Approvals groups the in-flight save came from, so only
  // that group's Save button shows a spinner.
  const [savingApprovalsField, setSavingApprovalsField] =
    useState<ApprovalsDecisionField | null>(null);

  const homePlan = homePlanData?.homePlan ?? null;

  // A street-address home plan closes the case outright, so there are no
  // approvals to record and no release tasks to track.
  const isManualAddressPlan = homePlan?.type === HOME_PLAN_TYPE.MANUAL_ADDRESS;

  const eligibilityParams = useMemo(
    () => (form ? extractEligibilityParams(form) : null),
    [form],
  );

  const normalizedParams = useMemo(
    () => (eligibilityParams ? normalizeParams(eligibilityParams) : null),
    [eligibilityParams],
  );

  const eligibleProviders = useMemo<HousingProvider[]>(
    () =>
      (providersData?.providers ?? []).map((p) => {
        const labels =
          normalizedParams != null
            ? generateLabels(p.providerLocation, normalizedParams)
            : [];

        return {
          id: p.providerId,
          name: p.providerName,
          providerLocation: p.providerLocation,
          labels,
          isPreferred:
            eligibilityParams?.preferredProviders.includes(p.providerId) ??
            false,
        };
      }),
    [
      eligibilityParams?.preferredProviders,
      normalizedParams,
      providersData?.providers,
    ],
  );

  const isSelectProviderDisabled =
    isProvidersLoading || isProvidersError || eligibleProviders.length === 0;

  // In the store so other tabs (e.g. Approvals) can open these modals.
  const previewModalStore = usePreviewModalStore();
  const modalState = previewModalStore.homePlanModal;
  const setModalState = (modalState: HomePlanModalState) =>
    previewModalStore.setHomePlanModal(modalState);

  const handleSaveAddress = (address: string) => {
    if (!currentApplicationId) {
      toast.error("No active application found.");
      return;
    }
    setManualAddress(
      { applicationId: currentApplicationId, address },
      {
        onSuccess: () => {
          setModalState(null);
          toast("Case closed");
        },
        onError: () => toast.error("Failed to save address."),
      },
    );
  };

  const handleSelectProvider = (provider: HousingProvider) => {
    setModalState({ type: "confirmProvider", provider });
  };

  const handleConfirmProvider = () => {
    if (modalState?.type !== "confirmProvider") return;
    if (!currentApplicationId) {
      toast.error("No active application found.");
      return;
    }
    acceptProviderAsHomePlan(
      {
        applicationId: currentApplicationId,
        providerId: modalState.provider.id,
      },
      {
        onSuccess: () => {
          setModalState(null);
          toast.success("Provider accepted as home plan.");
        },
        onError: () => toast.error("Failed to accept provider as home plan."),
      },
    );
  };

  const closeModal = () => setModalState(null);

  const saveApprovals = (
    decisions: ApprovalsDecisionInput,
    action: ApprovalsAction | null,
  ) => {
    if (!currentApplicationId) {
      toast.error("No active application found.");
      return;
    }

    const decisionField = getDecisionField(decisions);
    setSavingApprovalsField(decisionField);

    setHomePlanApprovals(
      { applicationId: currentApplicationId, ...decisions },
      {
        onSettled: () => setSavingApprovalsField(null),
        onSuccess: () => {
          toast(APPROVALS_SAVED_TOAST[decisionField]);
          // The release-date prompt only follows an advance to Release, so the
          // CM completes the whole step in one pass.
          setModalState(
            action === APPROVALS_ACTION.ADVANCE_TO_RELEASE
              ? { type: "updateReleaseDate" }
              : null,
          );
        },
        onError: () => toast.error("Failed to save approvals."),
      },
    );
  };

  // Merged over the persisted values of the other decisions (the Parole
  // Commission Decision lives on the staff row): a positive decision only
  // advances the case once the others already cleared.
  const handleSaveApprovals = (decisions: ApprovalsDecisionInput) => {
    const persisted = homePlanData?.approvals;
    const action = resolveApprovalsAction(
      {
        paroleCommissionDecision:
          currentApplication?.paroleCommissionDecision ?? null,
        releaseDecision:
          decisions.releaseDecision ?? persisted?.releaseDecision ?? null,
        homePlanInvestigation:
          decisions.homePlanInvestigation ??
          persisted?.homePlanInvestigation ??
          null,
      },
      { isRider: isRiderCase, hasHomePlan: homePlan != null },
    );

    if (action == null) {
      saveApprovals(decisions, action);
      return;
    }

    setModalState({ type: "confirmApprovals", action, decisions });
  };

  const handleConfirmApprovals = () => {
    if (modalState?.type !== "confirmApprovals") return;
    saveApprovals(modalState.decisions, modalState.action);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      toast.error("Failed to copy to clipboard.");
      return false;
    }
  };

  return (
    <>
      <Styled.PanelRoot>
        <PanelStyled.PanelHeader>
          <PanelStyled.PanelTitle>Home Plan</PanelStyled.PanelTitle>
        </PanelStyled.PanelHeader>

        <Styled.PanelBody>
          {isClosed && <StaffClosedBanner />}

          {isHomePlanError ? (
            <Styled.AddressRow>
              <Styled.AddressRowLeft>
                <Styled.AddressLabel>
                  Failed to load home plan
                </Styled.AddressLabel>
              </Styled.AddressRowLeft>
            </Styled.AddressRow>
          ) : (
            <HomePlanRow
              homePlan={homePlan}
              isLoading={isHomePlanLoading}
              isClosed={isClosed}
              isSelectProviderDisabled={isSelectProviderDisabled}
              onAddAddress={() => setModalState({ type: "addAddress" })}
              onSelectProvider={() => setModalState({ type: "selectProvider" })}
              onCopy={copyToClipboard}
            />
          )}

          {isApplicationStage && <ApplicationStageEmptyState />}

          {!isApplicationStage && !isManualAddressPlan && (
            <TaskSections
              homePlanData={homePlanData}
              isRider={isRiderCase}
              onSaveApprovals={handleSaveApprovals}
              savingApprovalsDecision={
                isSavingApprovals ? savingApprovalsField : null
              }
            />
          )}
        </Styled.PanelBody>

        {!isClosed && (
          <PanelStyled.PanelFooter>
            <ActionButton
              variant="primary"
              width="11.25rem"
              onClick={openCloseApplicationConfirm}
            >
              Close Application
            </ActionButton>
          </PanelStyled.PanelFooter>
        )}
      </Styled.PanelRoot>

      {closeApplicationModals}

      <AddressInputModal
        isOpen={modalState?.type === "addAddress"}
        onClose={closeModal}
        onSave={handleSaveAddress}
        isSaving={isSavingAddress}
      />

      <SelectProviderModal
        isOpen={modalState?.type === "selectProvider"}
        onClose={closeModal}
        onSelectProvider={handleSelectProvider}
        providers={eligibleProviders}
        isLoading={isProvidersLoading}
        isError={isProvidersError}
      />

      <AcceptAsHomePlanModal
        isOpen={modalState?.type === "confirmProvider"}
        onClose={() => setModalState({ type: "selectProvider" })}
        onConfirm={handleConfirmProvider}
        isLoading={isAccepting}
        secondaryBtnText="Go back"
      />

      <ApprovalsConfirmationModal
        isOpen={modalState?.type === "confirmApprovals"}
        action={
          modalState?.type === "confirmApprovals" ? modalState.action : null
        }
        onClose={closeModal}
        onConfirm={handleConfirmApprovals}
        isLoading={isSavingApprovals}
      />

      <UpdateReleaseDateModal
        isOpen={modalState?.type === "updateReleaseDate"}
        onClose={closeModal}
        applicationId={currentApplicationId}
        currentDate={currentApplication?.expectedReleaseDate ?? null}
      />
    </>
  );
});
