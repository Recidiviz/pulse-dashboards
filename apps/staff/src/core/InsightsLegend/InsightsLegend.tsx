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

import {
  Icon,
  palette,
  spacing,
  TooltipTrigger,
} from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import { toTitleCase } from "../../utils/formatStrings";
import { GOAL_COLORS } from "../InsightsSwarmPlot/constants";

const LegendWrapper = styled.div<{ direction: "row" | "column" }>`
  display: flex;
  flex-direction: ${({ direction }) => direction};
  column-gap: ${rem(spacing.md)};
  row-gap: ${rem(spacing.sm)};
  flex-wrap: wrap;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
`;

const LegendText = styled.div`
  margin: 0 ${rem(spacing.xs)};
  color: ${palette.slate85};
`;

const TooltipIcon = styled(Icon)`
  &:hover {
    cursor: default;
  }
`;

export const circleLegendIcon = (color: string) => {
  return (
    <svg height="16" width="16" fill={color}>
      <circle cx="8" cy="8" r="5" />
    </svg>
  );
};

export const lineLegendIcon = (color: string) => {
  return (
    <svg height="2" width="16">
      <line x2="16" stroke={color} strokeDasharray="3" strokeWidth="4" />
    </svg>
  );
};

export const defaultLegendItems = (
  atOrBelowLabel: string,
  slightlyWorseLabel: string,
  farWorseLabel: string,
  supervisionOfficerLabel: string,
) => [
  {
    label: "Statewide rate",
    icon: lineLegendIcon(palette.slate60),
  },
  {
    label: atOrBelowLabel,
    icon: circleLegendIcon(GOAL_COLORS.MET),
  },
  {
    label: slightlyWorseLabel,
    icon: circleLegendIcon(GOAL_COLORS.NEAR),
  },
  {
    label: farWorseLabel,
    icon: circleLegendIcon(GOAL_COLORS.FAR),
    tooltip: `${toTitleCase(supervisionOfficerLabel)} has a rate over 1 Interquartile Range above the statewide rate.`,
  },
];

type InsightsLegendType = {
  items?: { label: string; icon: JSX.Element; tooltip?: string }[];
  direction?: "row" | "column";
  outcomeType?: "FAVORABLE" | "ADVERSE";
};

const InsightsLegend: React.FC<InsightsLegendType> = ({
  direction = "column",
  outcomeType = "ADVERSE",
}) => {
  const {
    insightsStore: { supervisionStore },
  } = useRootStore();

  if (!supervisionStore) return null;

  const {
    atOrBelowRateLabel,
    atOrAboveRateLabel,
    slightlyWorseThanRateLabel,
    worseThanRateLabel,
    supervisionOfficerLabel,
  } = supervisionStore.labels;

  const goalMetLabel =
    outcomeType === "ADVERSE"
      ? atOrBelowRateLabel
      : atOrAboveRateLabel ?? atOrBelowRateLabel;
  const items = defaultLegendItems(
    goalMetLabel,
    slightlyWorseThanRateLabel,
    worseThanRateLabel,
    supervisionOfficerLabel,
  );

  return (
    <LegendWrapper direction={direction}>
      {items.map((item) => {
        const hasTooltip = Boolean(item.tooltip);

        return (
          <LegendItem key={item.label}>
            {item.icon}
            <LegendText>
              {item.label}&ensp;
              {hasTooltip && (
                <TooltipTrigger
                  key={item.label}
                  contents={item.tooltip}
                  maxWidth={300}
                >
                  <TooltipIcon kind="Info" size={12} color={palette.slate60} />
                </TooltipTrigger>
              )}
            </LegendText>
          </LegendItem>
        );
      })}
    </LegendWrapper>
  );
};

export default observer(InsightsLegend);
