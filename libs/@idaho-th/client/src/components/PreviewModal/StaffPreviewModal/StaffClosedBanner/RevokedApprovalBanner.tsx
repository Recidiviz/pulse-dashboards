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
import toast from "react-hot-toast";

import type { StaffApplicationDetail } from "~@idaho-th/client/interfaces/common";
import { APPLICATION_STATUS } from "~@idaho-th/shared";

import { useAcknowledgeApprovalRevoked } from "../../../../hooks/housingApplication";
import { useStaffApplicationProviders } from "../../../../hooks/useApplicationDetail";
import { Button2 } from "../../../../styles";
import ExclamationCircleIcon from "../../../assets/exclamation-circle-outline.svg?react";
import * as ClosedStyled from "../../ApplicationDetailsView/ApplicationDetailsView.styles";
import * as Styled from "./RevokedApprovalBanner.styles";

interface RevokedApprovalBannerProps {
  application: StaffApplicationDetail;
}

export const RevokedApprovalBanner: React.FC<RevokedApprovalBannerProps> = ({
  application,
}) => {
  const { data } = useStaffApplicationProviders(application.id, true);
  const acknowledgeMutation = useAcknowledgeApprovalRevoked();

  // The case only closes this way when its home plan provider revokes.
  const revokingProvider = data?.providers.find(
    (provider) =>
      provider.providerId === application.homePlan?.selectedProviderId,
  );
  const providerName = revokingProvider?.providerName ?? "the provider";
  const reason = revokingProvider?.approvalRevoked?.message;

  const isDone = application.status === APPLICATION_STATUS.DONE;

  const handleMarkAsDone = () =>
    acknowledgeMutation.mutate(
      { applicationId: application.id },
      { onSuccess: () => toast.success("Application marked as done.") },
    );

  return (
    <ClosedStyled.ClosedBanner>
      <ClosedStyled.ClosedBannerIcon>
        <ExclamationCircleIcon aria-hidden />
      </ClosedStyled.ClosedBannerIcon>
      <Styled.BannerContent>
        <ClosedStyled.ClosedBannerText>
          This application is closed because {providerName} revoked their
          conditional approval
          {reason && (
            <>
              : <em>&apos;{reason}&apos;</em>
            </>
          )}
          . To send it out to more providers, please start a new application or
          duplicate this one.
        </ClosedStyled.ClosedBannerText>
        <Styled.BannerActions>
          {!isDone && (
            <Styled.TextButton
              type="button"
              onClick={handleMarkAsDone}
              disabled={acknowledgeMutation.isPending}
            >
              <Button2>Mark as done</Button2>
            </Styled.TextButton>
          )}
        </Styled.BannerActions>
      </Styled.BannerContent>
    </ClosedStyled.ClosedBanner>
  );
};
