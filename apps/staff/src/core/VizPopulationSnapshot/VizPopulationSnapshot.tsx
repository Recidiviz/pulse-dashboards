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

import "./VizPopulationSnapshot.scss";

import cn from "classnames";
import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import { ResponsiveOrdinalFrame } from "semiotic";
import { ResponsiveFrameProps } from "semiotic/lib/ResponsiveFrame";

import {
  formatDate,
  formatName,
  getDimensionLabel,
  getTicks,
  pluralize,
  pluralizeWord,
} from "../../utils";
import { sortByLabel } from "../../utils/datasets";
import styles from "../CoreConstants.module.scss";
import { useCoreStore } from "../CoreStoreProvider";
import SnapshotMetric from "../models/SnapshotMetric";
import SupervisionPopulationSnapshotMetric from "../models/SupervisionPopulationSnapshotMetric";
import { SupervisionPopulationSnapshotRecord } from "../models/types";
import withPathwaysMetricHelpers from "../PathwaysMetricHelpers/withPathwaysMetricHelpers";
import PathwaysTooltip from "../PathwaysTooltip/PathwaysTooltip";
import { Dimension } from "../types/dimensions";
import { PopulationFilterLabels } from "../types/filters";
import { METRIC_MODES } from "../utils/constants";
import VizPathways from "../VizPathways";

type VizPopulationOverTimeProps = {
  metric: SupervisionPopulationSnapshotMetric | SnapshotMetric;
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
    filtersDescription,
  } = filtersStore;
  const {
    dataSeries,
    chartTitle,
    accessor,
    chartXAxisTitle,
    enableMetricModeToggle,
    supervisionLevelOrder,
    accessorIsNotFilterType: isNotFilter,
  } = metric;

  const isRate =
    currentMetricMode === METRIC_MODES.RATES && enableMetricModeToggle;
  const isSupervisionLevel = accessor === "supervisionLevel";

  const accessorFilter = filters[accessor as keyof PopulationFilterLabels];

  const [hoveredId, setHoveredId] = useState(null);
  const [pickedId, setPickedId] = useState<string[]>([]);

  useEffect(() => {
    if (!isNotFilter) {
      setPickedId(accessorFilter);
    } else {
      setPickedId([]);
    }
  }, [accessorFilter, isNotFilter]);

  const data = dataSeries.map((d: any, index: number) => {
    const filterLabel = isNotFilter
      ? d[accessor]
      : getFilterLabel(
          accessor as keyof PopulationFilterLabels,
          d[accessor].toString(),
        );
    const filterLongLabel = isNotFilter
      ? getDimensionLabel(accessor as Dimension, d[accessor].toString())
      : getFilterLongLabel(
          accessor as keyof PopulationFilterLabels,
          d[accessor].toString(),
        );
    const currentValue = isRate ? d.populationProportion : d.count;
    return {
      index,
      accessorValue: d[accessor],
      accessorLabel: filterLabel,
      tooltipLabel: filterLongLabel || filterLabel,
      value: currentValue.toString(),
    };
  });

  sortByLabel(
    data,
    metric.isHorizontal ? "value" : "accessorLabel",
    metric.isHorizontal,
    "accessorValue",
    isSupervisionLevel && supervisionLevelOrder,
  );
  const latestUpdate = formatDate(
    metric instanceof SnapshotMetric
      ? metric.lastUpdated
      : dataSeries[0]?.lastUpdated,
    "MMMM dd, yyyy",
  );

  const { maxTickValue, tickValues, ticksMargin } = getTicks(
    Math.max(...data.map((d) => d.value)),
  );

  const yRange = [0, maxTickValue];

  const hoverAnnotation = (annotation: any) => {
    const { d } = annotation;
    const { data: pieceData } = d.pieces[0];
    setHoveredId(pieceData.index);
  };

  const chartProps = {
    // The key is necessary here to force the viz to remount
    // when there is a new metric to ensure there is not an awkward transition
    key: metric.id,
    responsiveWidth: true,
    hoverAnnotation: true,
    type: "bar",
    data,
    oAccessor: "accessorLabel",
    projection: "vertical",
    customHoverBehavior: (piece: any) => {
      if (piece) {
        setHoveredId(piece.index);
      } else {
        setHoveredId(null);
      }
    },
    baseMarkProps: { transitionDuration: { default: 500 } },
    size: [558, 558],
    margin: {
      left: ticksMargin,
      bottom: 75,
      right: 50,
      top: 56,
    },
    oPadding: data.length > 25 ? 2 : 15,
    style: (d: any) => {
      const isPicked = pickedId.includes(d.accessorValue);
      const isHovered = d.index === hoveredId;
      const color = metric.isGeographic
        ? styles.dataGoldDark
        : styles.dataForestDark;
      const opacity =
        (hoveredId === null && pickedId[0] === "ALL") ||
        (hoveredId === null && pickedId.length === 0) ||
        isHovered ||
        isPicked
          ? 1
          : 0.75;

      const style = { fill: color, fillOpacity: opacity };
      return style;
    },
    rAccessor: "value",
    rExtent: yRange,
    axes: [
      {
        orient: "left",
        tickFormat: (n: number) => (isRate ? `${n}%` : n.toLocaleString()),
        tickValues,
      },
    ],
    // eslint-disable-next-line react/no-unstable-nested-components
    oLabel: (accessorLabel: string, _: any) => {
      return <text textAnchor="middle">{accessorLabel}</text>;
    },
    svgAnnotationRules: (annotation: any) => {
      const {
        d: { type },
      } = annotation;
      if (type === "column-hover") {
        return hoverAnnotation(annotation);
      }
      setHoveredId(null);
      return null;
    },
    // eslint-disable-next-line react/no-unstable-nested-components
    tooltipContent: (d: any) => {
      const { pieces } = d;
      const pieceData = pieces[0];
      return (
        <PathwaysTooltip
          label={pieceData.tooltipLabel}
          value={isRate ? `${pieceData.value}%` : pieceData.value}
        />
      );
    },
    ...(metric.isHorizontal && {
      projection: "horizontal",
      size: [558, data.length * 25 + 150],
      margin: {
        left: 120,
        bottom: 75,
        right: 50,
        top: 56,
      },
      axes: [
        {
          orient: "top",
          tickFormat: (n: number) => (isRate ? `${n}%` : n.toLocaleString()),
          tickValues,
        },
      ],
      // eslint-disable-next-line react/no-unstable-nested-components
      oLabel: (accessorLabel: string, _: any) => {
        return (
          <text textAnchor="end">
            <tspan key={accessorLabel} dy="1.5em" x="0">
              {formatName(accessorLabel)}
            </tspan>
          </text>
        );
      },
      // eslint-disable-next-line react/no-unstable-nested-components
      tooltipContent: (d: any) => {
        const { pieces } = d;
        const pieceData = pieces[0];

        const caseloadData = dataSeries[
          pieceData.index
        ] as SupervisionPopulationSnapshotRecord;

        return (
          <PathwaysTooltip
            label={pieceData.tooltipLabel}
            value={isRate ? `${pieceData.value}%` : pieceData.value}
            average={
              isRate
                ? `(${pluralize(caseloadData.count, "admission")} / ${
                    caseloadData.caseload
                  } unique ${pluralizeWord(
                    "person",
                    caseloadData.caseload,
                  )} on caseload)`
                : undefined
            }
          />
        );
      },
    }),
    ...(metric.rotateLabels && {
      margin: {
        left: ticksMargin,
        bottom: 116,
        right: 50,
        top: 56,
      },
      axes: [
        {
          orient: "left",
          tickFormat: (n: number) => (isRate ? `${n}%` : n.toLocaleString()),
          tickValues,
        },
      ],
      // eslint-disable-next-line react/no-unstable-nested-components
      oLabel: (accessorLabel: string, _: any) => {
        return (
          <text textAnchor="middle">
            {
              // eslint-disable-next-line react/destructuring-assignment
              accessorLabel.split(/(.*?\/)/g).map((wrapPart) => (
                <tspan key={accessorLabel} dy="1.5em" x="0">
                  {wrapPart}
                </tspan>
              ))
            }
          </text>
        );
      },
    }),
  } as ResponsiveFrameProps;

  return (
    <VizPathways
      className={cn("VizPopulationSnapshot", {
        "VizPopulationSnapshot__labels--not-rotated": !metric.rotateLabels,
        "VizPopulationSnapshot__horizontal-bar": metric.isHorizontal,
      })}
      title={chartTitle}
      latestUpdate={latestUpdate}
      subtitle={filtersDescription}
    >
      <ResponsiveOrdinalFrame {...chartProps} />
      {chartXAxisTitle && (
        <div className="VizPopulationSnapshot__chartXAxisTitle">
          {chartXAxisTitle}
        </div>
      )}
    </VizPathways>
  );
};

export default withPathwaysMetricHelpers(observer(VizPopulationSnapshot));
