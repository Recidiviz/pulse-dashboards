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

import { throttle } from "lodash";
import { observer } from "mobx-react-lite";
import { FC, useLayoutEffect, useRef } from "react";
import { AspectRatio } from "react-aspect-ratio";
import useMeasure from "react-use-measure";

import { SwarmPresenterV2 } from "../../InsightsStore/presenters/SwarmPresenter";
import { CHART_ASPECT_RATIO } from "../../InsightsStore/presenters/SwarmPresenter/constants";
import {
  MetricConfigWithBenchmark,
  OfficerOutcomesData,
  PresenterWithHoverManager,
} from "../../InsightsStore/presenters/types";
import { InsightsSwarmPlotV2 } from "./InsightsSwarmPlotV2";
import { InsightsSwarmPlotWrappedPropsV2 } from "./types";

type InsightsSwarmPlotProps = {
  metric: MetricConfigWithBenchmark;
  officersForMetric: OfficerOutcomesData[];
  presenterWithHoverManager?: PresenterWithHoverManager;
  isMinimized?: boolean;
};

export function getThrottledUpdater() {
  return throttle(
    (measuredWidth: number, lastWidth: number, presenter: SwarmPresenterV2) => {
      if (measuredWidth !== lastWidth) {
        presenter.prepareChartData(measuredWidth);
      }
    },
    400,
  );
}

export const PlotMeasurer: FC<InsightsSwarmPlotWrappedPropsV2> = observer(
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

const InsightsSwarmPlotContainerV2 = observer(
  function InsightsSwarmPlotContainerV2({
    metric,
    officersForMetric,
    presenterWithHoverManager,
    isMinimized,
  }: InsightsSwarmPlotProps) {
    const presenter = new SwarmPresenterV2(metric, officersForMetric);
    return (
      <PlotMeasurer presenter={presenter}>
        <AspectRatio ratio={1 / CHART_ASPECT_RATIO}>
          {/* because aspectRatio sets styles on its direct children,
          don't pass it another component directly to avoid unexpected results */}
          <div>
            <InsightsSwarmPlotV2
              presenter={presenter}
              presenterWithHoverManager={presenterWithHoverManager}
              isMinimized={isMinimized}
            />
          </div>
        </AspectRatio>
      </PlotMeasurer>
    );
  },
);

export { InsightsSwarmPlotContainerV2 };
