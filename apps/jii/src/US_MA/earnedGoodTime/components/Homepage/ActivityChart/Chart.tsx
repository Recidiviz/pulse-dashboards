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

import { ChartWrapper, spacing, typography } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { FC } from "react";
import useMeasure from "react-use-measure";
import OrdinalFrame from "semiotic/lib/OrdinalFrame";
import styled from "styled-components/macro";

import { usMaEarnedCreditTypes } from "~datatypes";
import { withPresenterManager } from "~hydration-utils";

import { hydrateTemplate } from "../../../../../configs/hydrateTemplate";
import { useEGTDataContext } from "../../EGTDataContext/context";
import { ChartDatum, ChartPresenter } from "./ChartPresenter";

// these are intentionally different from what's in the design system.
// kept private to this module pending further direction from the design team
// regarding their broader use beyond this chart
const CHART_COLORS = {
  [usMaEarnedCreditTypes.enum.EARNEDGoodTime]: "#78BA43",
  [usMaEarnedCreditTypes.enum.BOOST]: "#00A49A",
  [usMaEarnedCreditTypes.enum.COMPLETION]: "#123C66",
};

const Wrapper = styled.div``;

const Legend = styled.div`
  ${typography.Sans14}

  display: flex;
  justify-content: center;
  gap: ${rem(spacing.lg)};
`;

const LegendItem = styled.div<{ swatch: string }>`
  &::before {
    background: ${(props) => props.swatch};
    border-radius: 1em;
    content: "";
    display: inline-block;
    height: 0.8em;
    margin-right: 0.5em;
    vertical-align: baseline;
    width: 0.8em;
  }
`;

const CHART_MARGINS = { left: 60, bottom: 40, top: 20 };

const ManagedComponent: FC<{ presenter: ChartPresenter }> = observer(
  function Chart({ presenter }) {
    const {
      copy: {
        home: { creditHistory: copy },
      },
    } = useEGTDataContext();
    const [measureRef, { width }] = useMeasure();

    return (
      <Wrapper ref={measureRef}>
        <ChartWrapper>
          <OrdinalFrame
            size={[width, 300]}
            type="bar"
            data={presenter.chartData}
            oAccessor="creditMonth"
            rAccessor="totalCredits"
            style={(d: ChartDatum) => ({
              fill: CHART_COLORS[d.creditType],
            })}
            oPadding={20}
            oLabel
            axes={[
              {
                orient: "left",
                // this is not really a component (it doesn't accept props)
                // eslint-disable-next-line react/no-unstable-nested-components
                tickFormat: (value: number) => (
                  <text
                    // 10 is the offset automatically applied by Semiotic,
                    // which we have to take into account when positioning at the left edge.
                    // plus a couple extra pixels to guard against clipping
                    dx={-CHART_MARGINS.left + 10 + 2}
                    textAnchor="start"
                    dy={-8}
                  >
                    {hydrateTemplate(copy.creditLabel, { value })}
                  </text>
                ),
                tickValues: presenter.axisTicks,
                baseline: false,
                // @ts-expect-error its ok to return an SVG element here
                // eslint-disable-next-line react/no-unstable-nested-components
                tickLineGenerator: ({ xy }) => {
                  return (
                    <line
                      {...xy}
                      // @ts-expect-error semiotic types are inaccurate here
                      x1={xy.x1 - CHART_MARGINS.left}
                      className="tick-line"
                    />
                  );
                },
              },
            ]}
            margin={CHART_MARGINS}
            rExtent={[0, presenter.rangeExtent]}
          />
        </ChartWrapper>
        <Legend>
          <LegendItem swatch={CHART_COLORS.EARNEDGoodTime}>
            {copy.legend.EARNEDGoodTime}
          </LegendItem>
          <LegendItem swatch={CHART_COLORS.BOOST}>
            {copy.legend.BOOST}
          </LegendItem>
          <LegendItem swatch={CHART_COLORS.COMPLETION}>
            {copy.legend.COMPLETION}
          </LegendItem>
        </Legend>
      </Wrapper>
    );
  },
);

function usePresenter() {
  return new ChartPresenter(useEGTDataContext().monthlyReports);
}

export const Chart = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: true,
});
