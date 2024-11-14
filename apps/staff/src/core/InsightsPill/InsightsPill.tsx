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
import { rem, rgba } from "polished";
import { FC } from "react";
import styled from "styled-components/macro";

import { InsightsTooltip } from "../InsightsPageLayout/InsightsPageLayout";

const PillWrapper = styled(Pill)`
  ${typography.Sans12}
  height: ${rem(22)};
  margin-right: 0;
`;

interface InsightsPillProps {
  label: string;
  tooltipCopy?: string;
}

/**
 * A small pink pill with a optional tooltip used to flag certain
 * officers and opportunities pofrom the insights supervisor homepage views.
 */
const InsightsPill: FC<InsightsPillProps> = ({ tooltipCopy, label }) => {
  return (
    <InsightsTooltip contents={tooltipCopy}>
      <PillWrapper
        color={rgba(255, 220, 229, 1)}
        textColor={rgba(76, 12, 28, 1)}
        filled={true}
      >
        {label}
      </PillWrapper>
    </InsightsTooltip>
  );
};

export default InsightsPill;
