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

import { Pill } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled from "styled-components";

import { palette } from "~design-system";

export const BadgePillStyled = styled(Pill)<{
  $borderColor: string;
}>`
  border-radius: ${rem(4)};
  border: 1px solid ${(props) => props.$borderColor};
  font-size: ${rem(12)};
  font-weight: 600;
  height: ${rem(20)};
  padding: 0 ${rem(6)};
  vertical-align: text-top;
`;

const statusStyles = {
  SLATE: {
    backgroundColor: palette.slate05,
    borderColor: palette.slate20,
    color: palette.slate80,
  },
  PURPLE: {
    backgroundColor: "rgb(242,240,245)",
    borderColor: "rgb(137,115,165)",
    color: "rgb(98,68,136)",
  },
  BLUE: {
    backgroundColor: "rgb(239,243,255)",
    borderColor: "rgb(162,179,239)",
    color: "rgb(0,56,124)",
  },
  YELLOW: {
    color: "rgb(168,44,0)",
    backgroundColor: "rgb(255,248,222)",
    borderColor: "rgb(252,213,121)",
  },
  GREEN: {
    backgroundColor: "rgb(239,255,229)",
    borderColor: "rgb(166,235,132)",
    color: "rgb(0,105,8)",
  },
  RED: {
    backgroundColor: "rgb(255,244,249)",
    borderColor: "rgb(255,204,223)",
    color: "rgb(179,9,60)",
  },
} as const;

export const WorkflowsBadgePill = observer(function WorkflowsBadgePill({
  text,
  palette,
}: {
  text: string;
  palette: keyof typeof statusStyles;
}) {
  const { color, borderColor, backgroundColor } = statusStyles[palette];
  return (
    <BadgePillStyled
      filled={true}
      color={backgroundColor}
      textColor={color}
      $borderColor={borderColor}
    >
      {text}
    </BadgePillStyled>
  );
});
