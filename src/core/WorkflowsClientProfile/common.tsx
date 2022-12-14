// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import { Icon, palette, TooltipTrigger } from "@recidiviz/design-system";
import React from "react";
import styled from "styled-components/macro";

export const InfoTooltipWrapper = styled(TooltipTrigger)`
  vertical-align: text-bottom;
`;

export const Separator = styled.span`
  color: ${palette.slate30};
`;

const InfoLink = styled.a`
  color: ${palette.slate30};

  &:hover,
  &:focus {
    color: ${palette.slate60};
  }
`;

export const InfoButton = ({
  infoUrl,
}: {
  infoUrl: string | undefined;
}): React.ReactElement => (
  <InfoLink href={infoUrl} target="_blank" rel="noreferrer">
    <Icon kind="Info" size={12} />
  </InfoLink>
);
