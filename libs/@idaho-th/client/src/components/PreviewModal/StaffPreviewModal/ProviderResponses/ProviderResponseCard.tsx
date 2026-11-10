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

import type { ProviderHousingApplication } from "~@idaho-th/client/interfaces/common";
import { APPLICATION_SUB_STAGE } from "~@idaho-th/shared";

import { useHousingApplicationsStore } from "../../../../datastores/IdahoTHStoreContext";
import { useStaffApplicationById } from "../../../../hooks/useApplicationDetail";
import {
  ApprovalRevokedCard,
  ConditionallyApprovedCard,
  DefaultCard,
  InfoNeededCard,
  SimpleProviderCard,
} from "./cards";
import { useSubmitStaffInfoReply } from "./hooks/useSubmitStaffInfoReply";

interface ProviderResponseCardProps {
  providerApplication: ProviderHousingApplication;
  onSelect?: () => void;
}

export const ProviderResponseCard: React.FC<ProviderResponseCardProps> =
  observer(function ProviderResponseCard({ providerApplication, onSelect }) {
    const { currentApplicationId } = useHousingApplicationsStore();
    const { data: currentApplication } = useStaffApplicationById(
      currentApplicationId,
      !!currentApplicationId,
    );
    const isHomePlanSet = currentApplication?.homePlan != null;
    const isHomePlan =
      providerApplication.providerId ===
      currentApplication?.homePlan?.selectedProviderId;

    const {
      subStage,
      providerName,
      providerId,
      labels,
      infoRequests,
      approvalRevoked,
      isPreferred,
      createdAt,
    } = providerApplication;

    const handleSubmitInfo = useSubmitStaffInfoReply(
      providerApplication.providerApplicationId,
    );

    if (isHomePlanSet) {
      return (
        <SimpleProviderCard
          providerName={providerName}
          labels={labels}
          isHomePlan={isHomePlan}
          isRevoked={
            subStage === APPLICATION_SUB_STAGE.CONDITIONAL_APPROVAL_REVOKED
          }
          sentAt={createdAt}
        />
      );
    }

    switch (subStage) {
      case APPLICATION_SUB_STAGE.CONDITIONALLY_APPROVED:
        return (
          <ConditionallyApprovedCard
            providerName={providerName}
            providerId={providerId}
            labels={labels}
            isPreferred={isPreferred}
            sentAt={createdAt}
            onClick={onSelect}
          />
        );

      case APPLICATION_SUB_STAGE.INFO_NEEDED:
        return (
          <InfoNeededCard
            providerName={providerName}
            labels={labels}
            isPreferred={isPreferred}
            infoRequests={infoRequests ?? null}
            sentAt={createdAt}
            onClick={onSelect}
            onSubmitInfo={handleSubmitInfo}
          />
        );

      case APPLICATION_SUB_STAGE.CONDITIONAL_APPROVAL_REVOKED:
        return (
          <ApprovalRevokedCard
            providerName={providerName}
            labels={labels}
            isPreferred={isPreferred}
            approvalRevoked={approvalRevoked ?? null}
            sentAt={createdAt}
            onClick={onSelect}
          />
        );

      default:
        return (
          <DefaultCard
            providerName={providerName}
            labels={labels}
            subStage={subStage}
            isPreferred={isPreferred}
            sentAt={createdAt}
            onClick={onSelect}
          />
        );
    }
  });
