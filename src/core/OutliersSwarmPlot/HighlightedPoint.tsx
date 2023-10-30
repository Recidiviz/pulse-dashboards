// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  useFloating,
} from "@floating-ui/react";

import { RateDatapoint } from "../../OutliersStore/models/SupervisionOfficerMetricOutlier";
import { HIGHLIGHT_DOT_RADIUS } from "../../OutliersStore/presenters/SwarmPresenter/constants";
import { GOAL_COLORS } from "./constants";
import { HighlightLabel, RateHighlightMark } from "./styles";
import { formatTargetAndHighlight } from "./utils";

export function HighlightedPoint({
  currentMetricData,
}: {
  currentMetricData: RateDatapoint;
}) {
  const highlightLabelProps = useFloating({
    placement: "right",
    middleware: [flip(), offset(5)],
    open: true,
    whileElementsMounted: autoUpdate,
  });

  return (
    <>
      <RateHighlightMark
        r={HIGHLIGHT_DOT_RADIUS}
        fill={GOAL_COLORS[currentMetricData.status]}
        ref={highlightLabelProps.refs.setReference}
      />
      <FloatingPortal>
        <HighlightLabel
          ref={highlightLabelProps.refs.setFloating}
          style={highlightLabelProps.floatingStyles}
        >
          {formatTargetAndHighlight(currentMetricData.metricRate)}
        </HighlightLabel>
      </FloatingPortal>
    </>
  );
}
