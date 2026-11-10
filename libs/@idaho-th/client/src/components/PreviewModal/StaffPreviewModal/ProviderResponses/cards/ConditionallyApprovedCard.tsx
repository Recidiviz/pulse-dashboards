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

import type { ProviderLabel } from "~@idaho-th/client/interfaces/common";
import { APPLICATION_SUB_STAGE } from "~@idaho-th/shared";

import { StatusBadge } from "../../../../StatusBadge/StatusBadge";
import {
  AcceptAsHomePlanButton,
  ApplicationSubmittedDate,
  PreferredBadge,
  ProviderLabels,
} from "../../common";
import {
  CardLeftSection,
  CardRightSection,
  NameRow,
  ProviderCardWrapper,
  ProviderName,
} from "../../common/styledComponents";

interface ConditionallyApprovedCardProps {
  providerName: string;
  providerId: string;
  labels?: ProviderLabel[];
  isPreferred?: boolean;
  sentAt?: Date | string | null;
  onClick?: () => void;
  acceptButton?: React.ReactNode;
}

export const ConditionallyApprovedCard: React.FC<
  ConditionallyApprovedCardProps
> = ({
  providerName,
  providerId,
  labels,
  isPreferred,
  sentAt,
  onClick,
  acceptButton,
}) => (
  <ProviderCardWrapper
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
      {acceptButton ?? <AcceptAsHomePlanButton providerId={providerId} />}
    </CardLeftSection>
    <CardRightSection>
      <StatusBadge status={APPLICATION_SUB_STAGE.CONDITIONALLY_APPROVED} />
    </CardRightSection>
  </ProviderCardWrapper>
);
