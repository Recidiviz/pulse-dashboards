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

import { observer } from "mobx-react-lite";
import { AspectRatio } from "react-aspect-ratio";

import { SupervisionOfficer } from "~datatypes";

import { SwarmPresenterV2 } from "../../InsightsStore/presenters/SwarmPresenter";
import { CHART_ASPECT_RATIO } from "../../InsightsStore/presenters/SwarmPresenter/constants";
import {
  MetricConfigWithBenchmark,
  OfficerOutcomesData,
  PresenterWithHoverManager,
} from "../../InsightsStore/presenters/types";
import { PlotMeasurer } from "./InsightsSwarmPlotContainer";
import { InsightsSwarmPlotV2 } from "./InsightsSwarmPlotV2";

type InsightsSwarmPlotProps = {
  metric: MetricConfigWithBenchmark;
  officersForMetric: OfficerOutcomesData<SupervisionOfficer>[];
  presenterWithHoverManager?: PresenterWithHoverManager;
  isMinimized?: boolean;
};

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
