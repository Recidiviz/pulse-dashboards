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

import { Pill, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import styled from "styled-components";

import { palette } from "~design-system";

// TODO(#11717) Unify this with other pills
const RNAPill = styled(Pill)<{ $borderColor: string }>`
  ${typography.Sans12}
  font-weight: 600;

  border-radius: ${rem(4)};
  border: 1px solid ${(props) => props.$borderColor};

  height: ${rem(20)};
  padding: 0 ${rem(6)};
  vertical-align: text-top;
`;

const badgeSettings = {
  UPCOMING: {
    backgroundColor: palette.slate05,
    borderColor: palette.slate20,
    textColor: palette.slate80,
    text: "Upcoming",
  },
  NOT_STARTED: {
    backgroundColor: "rgb(242,240,245)",
    borderColor: "rgb(137,115,165)",
    textColor: "rgb(98,68,136)",
    text: "Not Started",
  },
  IN_PROGRESS: {
    backgroundColor: "rgb(239,243,255)",
    borderColor: "rgb(162,179,239)",
    textColor: "rgb(0,56,124)",
    text: "In Progress",
  },
  COMPLETE: {
    backgroundColor: "rgb(255,248,222)",
    borderColor: "rgb(252,213,121)",
    textColor: "rgb(168,44,0)",
    text: "Complete – Review",
  },
  staffSubmitted: {
    backgroundColor: "rgb(239,255,229)",
    borderColor: "rgb(166,235,132)",
    textColor: "rgb(0,105,8)",
    text: "Submitted",
  },
} as const;

export const RNABadge = function ({
  kind,
}: {
  kind: keyof typeof badgeSettings;
}) {
  const { backgroundColor, borderColor, textColor, text } = badgeSettings[kind];

  return (
    <RNAPill
      filled={true}
      color={backgroundColor}
      textColor={textColor}
      $borderColor={borderColor}
    >
      {text}
    </RNAPill>
  );
};
