// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { Icon, spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import { FC } from "react";
import styled from "styled-components/macro";

import { ButtonLink } from "../../../../components/ButtonLink/ButtonLink";
import { SimpleLinkProps } from "../../../../components/types";

const Wrapper = styled.div`
  margin-bottom: ${rem(spacing.xxl)};
`;

/**
 * Wrapper around a ReactRouter Link element that styles it like a button
 * and prepends a left-pointing arrow icon
 */
export const BackLink: FC<SimpleLinkProps> = ({ children, to }) => {
  return (
    <Wrapper>
      <ButtonLink to={to}>
        <Icon kind="Arrow" size={16} rotate={180} />
        <span>{children}</span>
      </ButtonLink>
    </Wrapper>
  );
};
