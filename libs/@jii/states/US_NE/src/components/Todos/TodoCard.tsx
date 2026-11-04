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

import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { MouseEventHandler } from "react";
import styled from "styled-components";

import { Card, GoLink, SlateCopy } from "~@jii/common-ui";
import { CardValue } from "~@jii/common-ui";
import { spacing } from "~design-system";

export const Headline = styled(CardValue)`
  margin-bottom: ${rem(spacing.lg)};
`;

export type TodoCardProps = {
  title: string;
  body: string;
  linkText: string;
  linkTarget: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

export const TodoCard = observer(function TodoCard({
  title,
  body,
  linkText,
  linkTarget,
  onClick,
}: TodoCardProps) {
  return (
    <Card>
      <Headline>{title}</Headline>
      <SlateCopy options={{ forceBlock: true }}>{body}</SlateCopy>
      <GoLink to={linkTarget} onClick={onClick}>
        {linkText}
      </GoLink>
    </Card>
  );
});
