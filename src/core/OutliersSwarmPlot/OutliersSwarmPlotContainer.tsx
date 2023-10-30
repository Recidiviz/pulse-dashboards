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
import useMeasure from "react-use-measure";

import { SwarmPresenter } from "../../OutliersStore/presenters/SwarmPresenter";
import { MetricWithConfig } from "../../OutliersStore/presenters/types";
import { OutliersSwarmPlotWrapped } from "./OutliersSwarmPlot";
import { OutliersSwarmPlotWrappedProps } from "./types";

type OutliersSwarmPlotProps = { metric: MetricWithConfig };

const OutliersSwarmPlotContainer = observer(
  function OutliersSwarmPlotContainer({ metric }: OutliersSwarmPlotProps) {
    const presenter = new SwarmPresenter(metric);

    return (
      <PlotMeasurer presenter={presenter}>
        <OutliersSwarmPlotWrapped presenter={presenter} />
      </PlotMeasurer>
    );
  }
);

function getThrottledUpdater() {
  return throttle(
    (measuredWidth: number, lastWidth: number, presenter: SwarmPresenter) => {
      if (measuredWidth !== lastWidth) {
        presenter.prepareChartData(measuredWidth);
      }
    },
    200
  );
}

const PlotMeasurer: FC<OutliersSwarmPlotWrappedProps> = observer(
  function PlotMeasurer({ children, presenter }) {
    const [ref, bounds] = useMeasure();
    const throttledUpdate = useRef(getThrottledUpdater());

    const measuredWidth = bounds.width;
    const lastWidth = presenter.width;

    useLayoutEffect(() => {
      throttledUpdate.current(measuredWidth, lastWidth, presenter);
    }, [lastWidth, measuredWidth, presenter]);

    return <div ref={ref}>{children}</div>;
  }
);

export { OutliersSwarmPlotContainer };
