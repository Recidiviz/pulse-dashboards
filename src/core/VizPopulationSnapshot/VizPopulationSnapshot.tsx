// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2021 Recidiviz, Inc.
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
// ===================== ========================================================

import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import { ResponsiveOrdinalFrame } from "semiotic";

import { formatDate } from "../../utils";
import * as styles from "../CoreConstants.scss";
import { useCoreStore } from "../CoreStoreProvider";
import PrisonPopulationSnapshotMetric from "../models/PrisonPopulationSnapshotMetric";
import SupervisionPopulationSnapshotMetric from "../models/SupervisionPopulationSnapshotMetric";
import PathwaysTooltip from "../PathwaysTooltip/PathwaysTooltip";
import { getFilterLabel } from "../utils/filterOptions";
import withMetricHydrator from "../withMetricHydrator";

type VizPopulationOverTimeProps = {
  metric: PrisonPopulationSnapshotMetric | SupervisionPopulationSnapshotMetric;
};

const VizPopulationSnapshot: React.FC<VizPopulationOverTimeProps> = ({
  metric,
}) => {
  const { filtersStore } = useCoreStore();
  const { filters } = filtersStore;
  const { dataSeries, chartTitle, accessor } = metric;

  // @ts-ignore
  const accessorFilter = filters[accessor];

  const [hoveredId, setHoveredId] = useState(null);
  const [pickedId, setPickedId] = useState([] as string[]);

  useEffect(() => {
    setPickedId(accessorFilter);
  }, [accessorFilter]);

  const data = dataSeries.map((d: any, index: number) => ({
    index,
    accessorValue: d[accessor],
    accessorLabel: getFilterLabel(accessor, d[accessor]),
    count: d.count,
  }));

  const latestUpdate = formatDate(dataSeries[0]?.lastUpdated, "MMMM dd, yyyy");

  const yRange = [0, Math.max(...data.map((d) => d.count))];

  const hoverAnnotation = (annotation: any) => {
    const { d } = annotation;
    const { data: pieceData } = d.pieces[0];
    setHoveredId(pieceData.index);
  };

  return (
    <div>
      <div className="VizCountOverTimeWithAvg">
        <div className="PopulationTimeSeriesChart__header">
          <div className="PopulationTimeSeriesChart__title">
            {chartTitle} <span>as of {latestUpdate}</span>
          </div>
        </div>
        <ResponsiveOrdinalFrame
          responsiveWidth
          hoverAnnotation
          customHoverBehavior={(piece: any) => {
            if (piece) {
              setHoveredId(piece.index);
            } else {
              setHoveredId(null);
            }
          }}
          svgAnnotationRules={(annotation: any) => {
            if (annotation.d.type === "column-hover") {
              return hoverAnnotation(annotation);
            }
            setHoveredId(null);
            return null;
          }}
          baseMarkProps={{ transitionDuration: { default: 500 } }}
          tooltipContent={(d: any) => {
            const pieceData = d.pieces[0];
            return (
              <PathwaysTooltip
                date={pieceData.accessorLabel}
                value={pieceData.count}
              />
            );
          }}
          type="bar"
          data={data}
          size={[558, 558]}
          margin={{ left: 79, bottom: 96, right: 50, top: 56 }}
          oAccessor="accessorLabel"
          oPadding={data.length > 25 ? 2 : 15}
          style={(d: any) => {
            if (d.index === hoveredId) {
              return { fill: styles.dataForestDark };
            }
            if (pickedId.includes(d.accessorValue)) {
              return { fill: styles.dataTeal };
            }
            return { fill: styles.dataForest };
          }}
          rAccessor="count"
          rExtent={yRange}
          // @ts-ignore
          oLabel={(accessorLabel: string, _: any) => {
            return <text textAnchor="middle">{accessorLabel}</text>;
          }}
          axes={[
            {
              orient: "left",
              ticks: 3,
              tickFormat: (n: number) => n.toLocaleString(),
            },
          ]}
        />
      </div>
    </div>
  );
};

export default withMetricHydrator(observer(VizPopulationSnapshot));
