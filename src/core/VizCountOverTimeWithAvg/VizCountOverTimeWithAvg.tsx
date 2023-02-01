/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2021 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 *
 */

import "./VizCountOverTimeWithAvg.scss";

import { curveCatmullRom } from "d3-shape";
import { observer } from "mobx-react-lite";
import React, { useState } from "react";
import { ResponsiveOrdinalFrame } from "semiotic";

import { getTicks } from "../../utils";
import styles from "../CoreConstants.module.scss";
import { useCoreStore } from "../CoreStoreProvider";
import OverTimeMetric from "../models/OverTimeMetric";
import PathwaysTooltip from "../PathwaysTooltip/PathwaysTooltip";
import { formatMonthAndYear } from "../PopulationTimeSeriesChart/helpers";
import PopulationTimeSeriesLegend from "../PopulationTimeSeriesChart/PopulationTimeSeriesLegend";
import VizPathways from "../VizPathways";
import withMetricHydrator from "../withMetricHydrator";

type VizCountOverTimeWithAvgProps = {
  metric: OverTimeMetric;
};

const VizCountOverTimeWithAvg: React.FC<VizCountOverTimeWithAvgProps> = ({
  metric,
}) => {
  const { filtersStore } = useCoreStore();
  const { filtersDescription } = filtersStore;
  const [hoveredId, setHoveredId] = useState(null);

  const { dataSeries, chartTitle } = metric;

  const data = dataSeries.map((d: any, index: number) => ({
    index,
    date: new Date(d.year, d.month - 1),
    value: d.count,
    average: d.avg90day,
  }));

  const averageData = dataSeries.map((d: any, index: number) => ({
    index,
    date: new Date(d.year, d.month - 1),
    value: d.avg90day,
  }));

  const latestDataPoint = data[data.length - 1];

  const trendlinePointAnnotation = (annotation: any) => {
    const { d, adjustedSize, rScale } = annotation;
    const { pieces, column } = d;
    const { data: pieceData } = pieces[0];
    const cx = column.middle;
    const cy = adjustedSize[1] - rScale(pieceData.average);
    setHoveredId(pieceData.index);
    return (
      <circle
        key={pieceData.index}
        cx={cx}
        cy={cy}
        r={4}
        fill={styles.indigo}
      />
    );
  };

  const averageAnnotations = [
    {
      type: "ordinal-line",
      coordinates: averageData,
      lineStyle: {
        stroke: styles.indigo,
        strokeWidth: 2,
      },
      curve: curveCatmullRom,
    },
    {
      type: "or",
      ...latestDataPoint,
    },
  ];

  const { maxTickValue, tickValues, ticksMargin } = getTicks(
    Math.max(
      ...data.map((d) => d.value),
      ...data.map((d) => d.average),
      1 /* ensure at least one tick */
    )
  );

  const yRange = [0, maxTickValue];

  return (
    <VizPathways
      className="VizCountOverTimeWithAvg"
      title={chartTitle}
      legend={
        <PopulationTimeSeriesLegend
          items={["Monthly count", "3-month rolling average"]}
        />
      }
      subtitle={filtersDescription}
    >
      <ResponsiveOrdinalFrame
        responsiveWidth
        hoverAnnotation
        annotations={averageAnnotations}
        customHoverBehavior={(piece: any) => {
          if (piece) {
            setHoveredId(piece.index);
          } else {
            setHoveredId(null);
          }
        }}
        baseMarkProps={{ transitionDuration: { default: 500 } }}
        svgAnnotationRules={(annotation: any) => {
          if (annotation.d.type === "column-hover") {
            return trendlinePointAnnotation(annotation);
          }
          setHoveredId(null);
          return null;
        }}
        // eslint-disable-next-line react/no-unstable-nested-components
        tooltipContent={(d: any) => {
          const pieceData = d.pieces[0];
          return <ChartCountOverTimeWithAvgTooltip data={pieceData} />;
        }}
        type="bar"
        data={data}
        size={[558, 558]}
        margin={{
          left: ticksMargin,
          bottom: 96,
          right: 50,
          top: 56,
        }}
        oAccessor="date"
        oPadding={data.length > 25 ? 2 : 15}
        style={(d: any) => {
          if (d.index === hoveredId) {
            return { fill: styles.slate30Opaque };
          }
          return { fill: styles.marble4 };
        }}
        rAccessor="value"
        rExtent={yRange}
        // @ts-ignore
        // eslint-disable-next-line react/no-unstable-nested-components
        oLabel={(date: string, _: any, index: number) => {
          if (data.length < 25 || index % 2 === 0) {
            return (
              <text textAnchor="middle">
                {formatMonthAndYear(new Date(date))}
              </text>
            );
          }
          return null;
        }}
        axes={[
          {
            orient: "left",
            ticks: 5,
            tickFormat: (n: number) => n.toLocaleString(),
            tickValues,
          },
        ]}
      />
    </VizPathways>
  );
};

type ChartCountOverTimeWithAvgTooltipProps = {
  data: {
    date: Date;
    value: number;
    average: number;
  };
};

const ChartCountOverTimeWithAvgTooltip: React.FC<
  ChartCountOverTimeWithAvgTooltipProps
> = ({ data }) => {
  const { date, value, average } = data;
  return (
    <PathwaysTooltip
      label={date.toLocaleString("en-US", { month: "long", year: "numeric" })}
      value={value.toString()}
      average={`3-month rolling average: ${average}`}
    />
  );
};

export default withMetricHydrator(observer(VizCountOverTimeWithAvg));
