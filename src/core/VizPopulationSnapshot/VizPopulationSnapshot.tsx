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
import { sortByLabel } from "../../utils/datasets";
import * as styles from "../CoreConstants.scss";
import { useCoreStore } from "../CoreStoreProvider";
import LibertyPopulationSnapshotMetric from "../models/LibertyPopulationSnapshotMetric";
import PrisonPopulationSnapshotMetric from "../models/PrisonPopulationSnapshotMetric";
import SupervisionPopulationSnapshotMetric from "../models/SupervisionPopulationSnapshotMetric";
import PathwaysTooltip from "../PathwaysTooltip/PathwaysTooltip";
import { PopulationFilterLabels } from "../types/filters";
import { METRIC_MODES } from "../utils/constants";
import withMetricHydrator from "../withMetricHydrator";

type VizPopulationOverTimeProps = {
  metric:
    | PrisonPopulationSnapshotMetric
    | SupervisionPopulationSnapshotMetric
    | LibertyPopulationSnapshotMetric;
};

const VizPopulationSnapshot: React.FC<VizPopulationOverTimeProps> = ({
  metric,
}) => {
  const { filtersStore } = useCoreStore();
  const {
    filters,
    getFilterLabel,
    getFilterLongLabel,
    currentMetricMode,
  } = filtersStore;
  const {
    dataSeries,
    chartTitle,
    accessor,
    chartXAxisTitle,
    enableMetricModeToggle,
  } = metric;

  const isNotFilters = ["priorLengthOfIncarceration", "lengthOfStay"].includes(
    accessor
  );
  const isRotateLabels = [
    "district",
    "race",
    "facility",
    "judicialDistrict",
    "supervisionLevel",
  ].includes(accessor);
  const isGeographic = [
    "district",
    "facility",
    "officer",
    "judicialDistrict",
  ].includes(accessor);
  const isRate =
    currentMetricMode === METRIC_MODES.RATES && enableMetricModeToggle;

  const accessorFilter = filters[accessor as keyof PopulationFilterLabels];

  const [hoveredId, setHoveredId] = useState(null);
  const [pickedId, setPickedId] = useState<string[]>([]);

  useEffect(() => {
    if (!isNotFilters) {
      setPickedId(accessorFilter);
    } else {
      setPickedId([]);
    }
  }, [accessorFilter, isNotFilters]);

  const data = dataSeries.map((d: any, index: number) => {
    const filterLabel = isNotFilters
      ? d[accessor]
      : getFilterLabel(
          accessor as keyof PopulationFilterLabels,
          d[accessor].toString()
        );
    const filterLongLabel =
      !isNotFilters &&
      getFilterLongLabel(
        accessor as keyof PopulationFilterLabels,
        d[accessor].toString()
      );
    return {
      index,
      accessorValue: d[accessor],
      accessorLabel: filterLabel,
      tooltipLabel: filterLongLabel || filterLabel,
      value: isRate ? d.populationProportion : d.count,
    };
  });

  sortByLabel(data, "accessorLabel");

  const latestUpdate = formatDate(dataSeries[0]?.lastUpdated, "MMMM dd, yyyy");

  const { maxTickValue, tickValues, ticksMargin } = getTicks(
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
        className={cn("VizPopulationSnapshot VizPathways", {
          "VizPopulationSnapshot__labels--not-rotated": !isRotateLabels,
        })}
      >
        <div className="VizPathways__header">
          <div className="VizPathways__title">
            {chartTitle} <span>as of {latestUpdate}</span>
          </div>
        </div>
        <ResponsiveOrdinalFrame
          // The key is necessary here to force the viz to remount
          // when there is a new metric to ensure there is not an awkward transition
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
                label={pieceData.tooltipLabel}
                value={isRate ? `${pieceData.value}%` : pieceData.value}
              />
            );
          }}
          type="bar"
          data={data}
          size={[558, 558]}
          margin={{
            left: ticksMargin,
            bottom: isRotateLabels ? 116 : 75,
            right: 50,
            top: 56,
          }}
          oAccessor="accessorLabel"
          oPadding={data.length > 25 ? 2 : 15}
          style={(d: any) => {
            if (!isGeographic) {
              if (d.index === hoveredId) {
                return { fill: styles.dataGoldDark };
              }
              if (pickedId && pickedId.includes(d.accessorValue)) {
                return { fill: styles.dataGoldDark };
              }
              return { fill: styles.dataGold };
            }
            if (d.index === hoveredId) {
              return { fill: styles.dataForestDark };
            }
            if (pickedId && pickedId.includes(d.accessorValue)) {
              return { fill: styles.dataTeal };
            }
            return { fill: styles.dataForest };
          }}
          rAccessor="value"
          rExtent={yRange}
          // @ts-ignore
          oLabel={(accessorLabel: string, _: any) => {
            return (
              <text textAnchor="middle">
                {isRotateLabels
                  ? accessorLabel.split(/(.*?\/)/g).map((wrapPart) => (
                      <tspan dy="1.5em" x="0">
                        {wrapPart}
                      </tspan>
                    ))
                  : accessorLabel}
              </text>
            );
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
