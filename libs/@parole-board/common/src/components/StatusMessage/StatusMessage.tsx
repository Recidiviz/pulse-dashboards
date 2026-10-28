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

import { rem } from "polished";
import { ReactNode } from "react";
import styled from "styled-components";

import { semantics } from "../../theme";

const { icon: iconColor, space, text, type } = semantics;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  text-align: center;

  a {
    color: ${text.link};
  }
`;

// Icons drawn in currentColor take the default icon colour.
const IconSlot = styled.div`
  display: flex;
  color: ${iconColor.default};
`;

const Title = styled.div`
  ${type.Sans16}
  margin-top: ${rem(space.lg)};
  margin-bottom: ${rem(space.sm)};
  color: ${text.primary};
`;

const Subtitle = styled.div`
  ${type.Sans14}
  margin-bottom: ${rem(space.lg)};
  color: ${text.secondary};
`;

const Actions = styled.div`
  display: flex;
  flex-direction: row;
  gap: ${rem(space.md)};
`;

type StatusMessageProps = {
  title: string;
  icon?: ReactNode;
  subtitle?: ReactNode;
  /** Actions shown under the subtitle, such as a retry button. */
  children?: ReactNode;
};

/**
 * A centered page-level message, such as an empty or unavailable state.
 * Copied from the staff app's StatusMessage, which these libraries can't
 * import, and styled with the semantic tokens instead of its SCSS.
 */
export function StatusMessage({
  title,
  icon,
  subtitle,
  children,
}: StatusMessageProps) {
  return (
    <Wrapper>
      {icon && <IconSlot>{icon}</IconSlot>}
      <Title>{title}</Title>
      {subtitle && <Subtitle>{subtitle}</Subtitle>}
      {children && <Actions>{children}</Actions>}
    </Wrapper>
  );
}
