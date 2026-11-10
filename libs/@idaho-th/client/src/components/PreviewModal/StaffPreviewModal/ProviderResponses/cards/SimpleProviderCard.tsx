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
import { ApplicationSubmittedDate, ProviderLabels } from "../../common";
import {
  CardLeftSection,
  CardRightSection,
  NameRow,
  ProviderCardWrapper,
  ProviderName,
} from "../../common/styledComponents";

interface SimpleProviderCardProps {
  providerName: string;
  labels?: ProviderLabel[];
  isHomePlan: boolean;
  /** A revoke replaces the home-plan marker: that plan no longer exists. */
  isRevoked?: boolean;
  sentAt?: Date | string | null;
}

function resolveBadge(isHomePlan: boolean, isRevoked: boolean) {
  if (isRevoked) {
    return { status: APPLICATION_SUB_STAGE.CONDITIONAL_APPROVAL_REVOKED };
  }
  if (isHomePlan) {
    return { status: "HOME_PLAN" as const };
  }
  return {
    status: APPLICATION_SUB_STAGE.CANCELED,
    label: "Application Canceled",
  };
}

export const SimpleProviderCard: React.FC<SimpleProviderCardProps> = ({
  providerName,
  labels,
  isHomePlan,
  isRevoked = false,
  sentAt,
}) => {
  const { status, label } = resolveBadge(isHomePlan, isRevoked);

  return (
    <ProviderCardWrapper>
      <CardLeftSection>
        <NameRow>
          <ProviderName>{providerName}</ProviderName>
        </NameRow>
        <ApplicationSubmittedDate sentAt={sentAt} />
        {labels && <ProviderLabels labels={labels} />}
      </CardLeftSection>
      <CardRightSection>
        <StatusBadge status={status} label={label} />
      </CardRightSection>
    </ProviderCardWrapper>
  );
};
