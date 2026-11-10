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
import React from "react";
import toast from "react-hot-toast";

import { AttentionFrame } from "~@idaho-th/client/components/common/AttentionFrame";
import {
  APPLICATION_STAGE,
  APPLICATION_SUB_STAGE,
  HomePlanApprovalsBadge,
  ReleaseTaskOwnerRole,
} from "~@idaho-th/shared";

import { useHousingApplicationsStore } from "../../../../datastores/IdahoTHStoreContext";
import {
  useProviderHomePlan,
  useToggleProviderHomePlanReleaseTask,
  useUpdateProviderHomePlanReleaseTaskDetail,
} from "../../../../hooks/housingApplication";
import { useProviderApplicationById } from "../../../../hooks/useApplicationDetail";
import HomeIcon from "../../../assets/home.svg?react";
import { Spinner } from "../../../common/LoadingSpinner/Spinner";
import {
  buildReleaseTaskDetails,
  type ReleaseTaskDetailsOptions,
  ReleaseTaskList,
} from "../../common/ReleaseTaskList";
import * as PanelStyled from "../../PreviewModal.styles";
import type { ApprovalsBadgeVariant } from "./ProviderHomePlanView.styles";
import * as Styled from "./ProviderHomePlanView.styles";
import { RejectedHomePlanEmptyState } from "./RejectedHomePlan";

// Providers see the outcome only, never the CM's individual decisions.
const APPROVALS_BADGES: Record<
  HomePlanApprovalsBadge,
  { variant: ApprovalsBadgeVariant; label: string }
> = {
  [HomePlanApprovalsBadge.PENDING]: { variant: "warning", label: "Pending" },
  [HomePlanApprovalsBadge.HOUSING_PLAN_APPROVED]: {
    variant: "success",
    label: "Housing Plan Approved",
  },
  [HomePlanApprovalsBadge.HOUSING_PLAN_REJECTED]: {
    variant: "attention",
    label: "Housing Plan Rejected",
  },
  // Never sent to providers (the server folds it into HOUSING_PLAN_REJECTED);
  // present only to keep the map exhaustive.
  [HomePlanApprovalsBadge.RELEASE_DENIED]: {
    variant: "attention",
    label: "Housing Plan Rejected",
  },
};

export const ProviderHomePlanView = observer(function ProviderHomePlanView() {
  const { currentApplicationId } = useHousingApplicationsStore();
  const { data: currentApplication } = useProviderApplicationById(
    currentApplicationId,
    !!currentApplicationId,
  );
  const isSelectedAsHomePlan =
    currentApplication?.subStage === APPLICATION_SUB_STAGE.SELECTED;

  const isClosed = currentApplication?.stage === APPLICATION_STAGE.CLOSED;
  const { data, isLoading, isError } = useProviderHomePlan(
    currentApplicationId,
    !!currentApplicationId && isSelectedAsHomePlan,
  );
  const toggleTask = useToggleProviderHomePlanReleaseTask();
  const { mutate: updateReleaseTaskDetail } =
    useUpdateProviderHomePlanReleaseTaskDetail();

  const isSelected = data?.permissions.isSelectedProvider ?? false;
  const emptyMessage =
    data?.emptyTabMessage ??
    "This tab becomes active once you\u2019re selected as the Home Plan";

  const approvalsBadge = data?.approvals?.badge ?? null;
  const isRejected =
    isSelected &&
    approvalsBadge === HomePlanApprovalsBadge.HOUSING_PLAN_REJECTED;
  const releaseTasks = data?.releaseTasks ?? null;
  const canToggle = data?.permissions.canToggleReleaseTasks ?? false;

  const releaseTaskRows = releaseTasks?.tasks ?? null;

  const handleDetailChange: NonNullable<
    ReleaseTaskDetailsOptions["onChange"]
  > = (taskType, detail) => {
    if (!currentApplicationId) return;
    updateReleaseTaskDetail({
      applicationId: currentApplicationId,
      taskType,
      ...detail,
    });
  };

  const details = buildReleaseTaskDetails(releaseTaskRows, {
    viewerRole: ReleaseTaskOwnerRole.PROVIDER,
    canToggle,
    onChange: handleDetailChange,
  });

  let panelBody: React.ReactNode;

  if (isLoading) {
    panelBody = (
      <Styled.EmptyStateContainer>
        <Spinner size="1.25rem" />
      </Styled.EmptyStateContainer>
    );
  } else if (isError) {
    panelBody = (
      <Styled.EmptyStateContainer>
        <Styled.EmptyStateText>Failed to load home plan</Styled.EmptyStateText>
      </Styled.EmptyStateContainer>
    );
  } else if (!isSelected) {
    panelBody = (
      <Styled.EmptyStateContainer>
        <Styled.EmptyStateIconWrapper>
          <HomeIcon />
        </Styled.EmptyStateIconWrapper>
        <Styled.EmptyStateText>{emptyMessage}</Styled.EmptyStateText>
      </Styled.EmptyStateContainer>
    );
  } else if (isRejected) {
    panelBody = (
      <>
        <Styled.ApprovalsRow>
          <Styled.ApprovalsLabel>Approvals</Styled.ApprovalsLabel>
          <Styled.ApprovalsBadge
            $variant={
              APPROVALS_BADGES[HomePlanApprovalsBadge.HOUSING_PLAN_REJECTED]
                .variant
            }
          >
            <Styled.ApprovalsBadgeText
              $variant={
                APPROVALS_BADGES[HomePlanApprovalsBadge.HOUSING_PLAN_REJECTED]
                  .variant
              }
            >
              {
                APPROVALS_BADGES[HomePlanApprovalsBadge.HOUSING_PLAN_REJECTED]
                  .label
              }
            </Styled.ApprovalsBadgeText>
          </Styled.ApprovalsBadge>
        </Styled.ApprovalsRow>

        <RejectedHomePlanEmptyState />
      </>
    );
  } else {
    panelBody = (
      <>
        {approvalsBadge && (
          <>
            <Styled.ApprovalsRow>
              <Styled.ApprovalsLabel>Approvals</Styled.ApprovalsLabel>
              <Styled.ApprovalsBadge
                $variant={APPROVALS_BADGES[approvalsBadge].variant}
              >
                <Styled.ApprovalsBadgeText
                  $variant={APPROVALS_BADGES[approvalsBadge].variant}
                >
                  {APPROVALS_BADGES[approvalsBadge].label}
                </Styled.ApprovalsBadgeText>
              </Styled.ApprovalsBadge>
            </Styled.ApprovalsRow>

            <Styled.Divider />
          </>
        )}

        {(() => {
          const releaseTaskList = (
            <AttentionFrame active={canToggle} hideFrame={isClosed}>
              <ReleaseTaskList
                tasks={releaseTaskRows}
                viewerRole={ReleaseTaskOwnerRole.PROVIDER}
                disabled={!canToggle}
                isToggling={toggleTask.isPending}
                onToggle={(taskType) =>
                  currentApplicationId &&
                  toggleTask.mutate(
                    {
                      applicationId: currentApplicationId,
                      taskType: taskType as never,
                      completed: !releaseTaskRows?.find(
                        (t) => t.taskType === taskType,
                      )?.completed,
                    },
                    {
                      onError: () =>
                        toast.error("Failed to update release task."),
                    },
                  )
                }
                details={details}
              />
            </AttentionFrame>
          );

          return releaseTaskList;
        })()}
      </>
    );
  }

  return (
    <Styled.PanelRoot>
      <PanelStyled.PanelHeader>
        <PanelStyled.PanelTitle>Home Plan</PanelStyled.PanelTitle>
      </PanelStyled.PanelHeader>

      <Styled.PanelBody>{panelBody}</Styled.PanelBody>
    </Styled.PanelRoot>
  );
});
