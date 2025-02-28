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

import { palette, spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import { FC, memo } from "react";
import styled from "styled-components/macro";

import { GoButton } from "../ButtonLink/GoButton";
import { LinkProps } from "../ResidentNavMenu/ResidentNavMenuPresenter";

const Wrapper = styled.article`
  border: 1px solid ${palette.slate20};
  border-radius: ${rem(spacing.sm)};
  display: flex;
  flex-wrap: wrap;
  gap: ${rem(spacing.lg)};
  margin: ${rem(spacing.xl)} 0;
  padding: ${rem(spacing.xl)};

  & > img {
    flex: 0 0 40px;
  }

  & > div {
    flex: 1 1 80%;
  }

  p {
    margin-top: 0;
  }
`;

export const TeaserLink: FC<{
  teaserText: string;
  linkProps: LinkProps;
  imageUrl: string;
}> = memo(function ComparisonLink({ teaserText, linkProps, imageUrl }) {
  return (
    <Wrapper>
      <img src={imageUrl} width={40} height={40} alt="" />
      <div>
        <p>{teaserText}</p>
        <GoButton {...linkProps} />
      </div>
    </Wrapper>
  );
});
