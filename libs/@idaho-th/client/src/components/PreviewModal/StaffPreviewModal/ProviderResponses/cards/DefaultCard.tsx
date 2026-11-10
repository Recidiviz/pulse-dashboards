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
import { type ApplicationSubStage } from "~@idaho-th/shared";

import { StatusBadge } from "../../../../StatusBadge/StatusBadge";
import {
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

interface DefaultCardProps {
  providerName: string;
  labels?: ProviderLabel[];
  subStage?: ApplicationSubStage;
  isPreferred?: boolean;
  sentAt?: Date | string | null;
  onClick?: () => void;
}

export const DefaultCard: React.FC<DefaultCardProps> = ({
  providerName,
  labels,
  subStage,
  isPreferred,
  sentAt,
  onClick,
}) => {
  return (
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
      </CardLeftSection>
      <CardRightSection>
        {subStage && <StatusBadge status={subStage} />}
      </CardRightSection>
    </ProviderCardWrapper>
  );
};
