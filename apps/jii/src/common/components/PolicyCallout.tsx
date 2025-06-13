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

import { CopyWrapper } from "../../components/CopyWrapper/CopyWrapper";
import { Card } from "./Card";

const Wrapper = styled(Card)`
  display: flex;
  flex-wrap: wrap;
  gap: ${rem(spacing.lg)};
  /* styled-components specificity hack -_- */
  && {
    margin: ${rem(spacing.xl)} 0;
    padding: ${rem(spacing.xl)};
  }

  & > svg {
    flex: 0 0 40px;
    // offsets the line-height for better alignment with top of text
    margin-top: 0.25em;
  }

  & > div {
    flex: 1 1 80%;
  }
`;

export const PolicyCallout: FC<{ text: string }> = ({ text }) => {
  return (
    <Wrapper>
      <Icon kind="Paper" size={40} />
      <div>
        <CopyWrapper>{text}</CopyWrapper>
      </div>
    </Wrapper>
  );
};
