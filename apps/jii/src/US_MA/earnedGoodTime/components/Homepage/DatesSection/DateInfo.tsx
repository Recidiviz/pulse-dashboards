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

import { spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import { FC } from "react";
import styled from "styled-components/macro";

import { Chip } from "../../../../../common/components/Chip";
import { hydrateTemplate } from "../../../../../configs/hydrateTemplate";
import { useEGTDataContext } from "../../EGTDataContext/context";
import { CardHeading } from "../../styles";
import { CardValue } from "../styles";

const Wrapper = styled.div`
  &:not(:last-child) {
    margin-bottom: ${rem(spacing.lg)};
  }
`;

export const DateInfo: FC<{
  tag: string;
  label: string;
  value?: string;
  muted?: boolean;
}> = ({ tag, label, value, muted }) => {
  const { data } = useEGTDataContext();
  return (
    <Wrapper>
      <CardHeading>
        {label}
        <Chip color={muted ? "gray" : "green"}>
          <abbr>{tag}</abbr>
        </Chip>
      </CardHeading>
      {value && <CardValue>{hydrateTemplate(value, data)}</CardValue>}
    </Wrapper>
  );
};
