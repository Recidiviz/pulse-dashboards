// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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
import { FC } from "react";
import styled from "styled-components";

import { palette } from "~design-system";

import { InsightsTooltip } from "../InsightsPageLayout/InsightsPageLayout";

const PillWrapper = styled(Pill)`
  ${typography.Sans12}
  height: ${rem(22)};
  margin-right: 0;
  vertical-align: middle;
`;

type InsightsPillProps = {
  label: string;
  tooltipCopy?: string;
  color?: string;
  textColor?: string;
};

/**
 * A small pill with an optional tooltip used to flag certain officers and
 * opportunities from the insights supervisor homepage views. Defaults to pink;
 * callers can override via `color` / `textColor` (e.g. green for the
 * Consistent Login pill).
 */
const InsightsPill: FC<InsightsPillProps> = ({
  tooltipCopy,
  label,
  color = palette.pink,
  textColor = palette.pinkDark,
}) => {
  return (
    <InsightsTooltip contents={tooltipCopy}>
      <PillWrapper color={color} textColor={textColor} filled={true}>
        {label}
      </PillWrapper>
    </InsightsTooltip>
  );
};

export default InsightsPill;
