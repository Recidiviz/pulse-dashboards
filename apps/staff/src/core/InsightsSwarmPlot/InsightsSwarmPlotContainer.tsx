// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import { throttle } from "lodash";
import { observer } from "mobx-react-lite";
import { FC, useLayoutEffect, useRef } from "react";
import { AspectRatio } from "react-aspect-ratio";
import useMeasure from "react-use-measure";

import { SwarmPresenter } from "../../InsightsStore/presenters/SwarmPresenter";
import { CHART_ASPECT_RATIO } from "../../InsightsStore/presenters/SwarmPresenter/constants";
import { MetricWithConfig } from "../../InsightsStore/presenters/types";
import { InsightsSwarmPlot } from "./InsightsSwarmPlot";
import { InsightsSwarmPlotWrappedProps } from "./types";

type InsightsSwarmPlotProps = { metric: MetricWithConfig };

const InsightsSwarmPlotContainer = observer(
  function InsightsSwarmPlotContainer({ metric }: InsightsSwarmPlotProps) {
    const presenter = new SwarmPresenter(metric);

    return (
      <PlotMeasurer presenter={presenter}>
        <AspectRatio ratio={1 / CHART_ASPECT_RATIO}>
          {/* because aspectRatio sets styles on its direct children,
          don't pass it another component directly to avoid unexpected results */}
          <div>
            <InsightsSwarmPlot presenter={presenter} />
          </div>
        </AspectRatio>
      </PlotMeasurer>
    );
  },
);

function getThrottledUpdater() {
  return throttle(
    (measuredWidth: number, lastWidth: number, presenter: SwarmPresenter) => {
      if (measuredWidth !== lastWidth) {
        presenter.prepareChartData(measuredWidth);
      }
    },
    400,
  );
}

const PlotMeasurer: FC<InsightsSwarmPlotWrappedProps> = observer(
  function PlotMeasurer({ children, presenter }) {
    const [ref, bounds] = useMeasure();
    const throttledUpdate = useRef(getThrottledUpdater());

    const measuredWidth = bounds.width;
    const lastWidth = presenter.width;

    useLayoutEffect(() => {
      throttledUpdate.current(measuredWidth, lastWidth, presenter);
    }, [lastWidth, measuredWidth, presenter]);

    return <div ref={ref}>{children}</div>;
  },
);

export { InsightsSwarmPlotContainer };
