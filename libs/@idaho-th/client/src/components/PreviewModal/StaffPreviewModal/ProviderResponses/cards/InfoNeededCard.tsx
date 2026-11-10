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

import { APPLICATION_SUB_STAGE } from "~@idaho-th/client/components/HousingApplicationForm/constants/fieldOptions";
import type { ProviderLabel } from "~@idaho-th/client/interfaces/common";

import { StatusBadge } from "../../../../StatusBadge/StatusBadge";
import {
  InfoRequest,
  MessageSender,
  type ProviderInfoRequest,
} from "../../../common/InfoRequest";
import {
  ApplicationSubmittedDate,
  PreferredBadge,
  ProviderLabels,
} from "../../common";
import {
  CardLeftSection,
  CardRightSection,
  NameRow,
  ProviderName,
} from "../../common/styledComponents";
import * as Styled from "../ProviderResponses.styles";

interface InfoNeededCardProps {
  providerName: string;
  labels?: ProviderLabel[];
  isPreferred?: boolean;
  infoRequests: ProviderInfoRequest[] | null;
  sentAt?: Date | string | null;
  onClick?: () => void;
  onSubmitInfo: (response: string) => void | Promise<void>;
}

export const InfoNeededCard: React.FC<InfoNeededCardProps> = ({
  providerName,
  labels,
  isPreferred,
  infoRequests,
  sentAt,
  onClick,
  onSubmitInfo,
}) => {
  const latestInfoRequest = infoRequests?.[0];
  const latestProviderMessage = latestInfoRequest?.messages.find(
    (m) => m.senderType === MessageSender.PROVIDER,
  );
  const status = latestInfoRequest?.status;

  const handleProvideInfo = async (responseText: string) => {
    try {
      await onSubmitInfo(responseText);
      onClick?.();
    } catch {
      toast.error("Failed to submit info. Please try again.");
    }
  };

  return (
    <Styled.ColumnCardWrapper>
      <Styled.CardTop
        onClick={onClick}
        style={{ cursor: onClick ? "pointer" : undefined }}
      >
        <CardLeftSection>
          <NameRow>
            <ProviderName>{providerName}</ProviderName>
            {isPreferred && <PreferredBadge />}
          </NameRow>
          <ApplicationSubmittedDate sentAt={sentAt} />
          {labels && <ProviderLabels labels={labels} />}
        </CardLeftSection>
        <CardRightSection>
          <StatusBadge status={APPLICATION_SUB_STAGE.INFO_NEEDED} />
        </CardRightSection>
      </Styled.CardTop>
      <Styled.Divider />
      {latestProviderMessage && (
        <InfoRequest
          requesterName={providerName}
          message={latestProviderMessage.body}
          buttonVariant="secondary"
          onProvideInfo={handleProvideInfo}
          status={status}
        />
      )}
    </Styled.ColumnCardWrapper>
  );
};
