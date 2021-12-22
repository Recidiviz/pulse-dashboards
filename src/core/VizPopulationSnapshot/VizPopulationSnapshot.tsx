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
import "./VizPopulationSnapshot.scss";

import cn from "classnames";
import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import { ResponsiveOrdinalFrame } from "semiotic";

import { formatDate, getTicks } from "../../utils";
import * as styles from "../CoreConstants.scss";
import { useCoreStore } from "../CoreStoreProvider";
import PrisonPopulationSnapshotMetric from "../models/PrisonPopulationSnapshotMetric";
import SupervisionPopulationSnapshotMetric from "../models/SupervisionPopulationSnapshotMetric";
import PathwaysTooltip from "../PathwaysTooltip/PathwaysTooltip";
import { PopulationFilterLabels } from "../types/filters";
import { METRIC_MODES } from "../utils/constants";
import withMetricHydrator from "../withMetricHydrator";

type VizPopulationOverTimeProps = {
  metric: PrisonPopulationSnapshotMetric | SupervisionPopulationSnapshotMetric;
};

const VizPopulationSnapshot: React.FC<VizPopulationOverTimeProps> = ({
  metric,
}) => {
  const { filtersStore } = useCoreStore();
  const { filters, getFilterLabel, currentMetricMode } = filtersStore;
  const {
    dataSeries,
    chartTitle,
    accessor,
    chartXAxisTitle,
    enableMetricModeToggle,
  } = metric;

  // @ts-ignore
  const accessorFilter = filters[accessor];
  const isGeographic = ["district", "facility", "officer"].includes(accessor);
  const isRate =
    currentMetricMode === METRIC_MODES.RATES && enableMetricModeToggle;

  const [hoveredId, setHoveredId] = useState(null);
  const [pickedId, setPickedId] = useState([] as string[]);

  useEffect(() => {
    setPickedId(accessorFilter);
  }, [accessorFilter]);

  const data = dataSeries.map((d: any, index: number) => ({
    index,
    accessorValue: d[accessor],
    accessorLabel: getFilterLabel(
      accessor as keyof PopulationFilterLabels,
      d[accessor].toString()
    ),
    value: isRate ? ((d.count * 100) / d.totalPopulation).toFixed() : d.count,
  }));

  const latestUpdate = formatDate(dataSeries[0]?.lastUpdated, "MMMM dd, yyyy");

  const { maxTickValue, tickValues } = getTicks(
    Math.max(...data.map((d) => d.value))
  );

  const yRange = [0, maxTickValue];

  const hoverAnnotation = (annotation: any) => {
    const { d } = annotation;
    const { data: pieceData } = d.pieces[0];
    setHoveredId(pieceData.index);
  };

  return (
    <div>
      <div
        className={cn("VizPopulationSnapshot", {
          "VizPopulationSnapshot__labels--not-rotated": data.length < 10,
        })}
      >
        <div className="VizPathways__header">
          <div className="VizPathways__title">
            {chartTitle} <span>as of {latestUpdate}</span>
          </div>
        </div>
        <ResponsiveOrdinalFrame
          // The key is necessary here to force the viz to remount
          // when there is a new metric to ensure there is not a awkward transition
          key={metric.id}
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
                value={isRate ? `${pieceData.value}%` : pieceData.value}
              />
            );
          }}
          type="bar"
          data={data}
          size={[558, 558]}
          margin={{ left: 79, bottom: 75, right: 50, top: 56 }}
          oAccessor="accessorLabel"
          oPadding={data.length > 25 ? 2 : 15}
          style={(d: any) => {
            if (!isGeographic) {
              if (d.index === hoveredId) {
                return { fill: styles.dataGoldDark };
              }
              if (pickedId.includes(d.accessorValue)) {
                return { fill: styles.dataGoldDark };
              }
              return { fill: styles.dataGold };
            }
            if (d.index === hoveredId) {
              return { fill: styles.dataForestDark };
            }
            if (pickedId.includes(d.accessorValue)) {
              return { fill: styles.dataTeal };
            }
            return { fill: styles.dataForest };
          }}
          rAccessor="value"
          rExtent={yRange}
          // @ts-ignore
          oLabel={(accessorLabel: string, _: any) => {
            return <text textAnchor="middle">{accessorLabel}</text>;
          }}
          axes={[
            {
              orient: "left",
              tickFormat: (n: number) =>
                isRate ? `${n}%` : n.toLocaleString(),
              tickValues,
            },
          ]}
        />
        {chartXAxisTitle && (
          <div className="VizPopulationSnapshot__chartXAxisTitle">
            {chartXAxisTitle}
          </div>
        )}
      </div>
    </div>
  );
};

export default withMetricHydrator(observer(VizPopulationSnapshot));
