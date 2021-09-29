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

import * as styles from "../CoreConstants.scss";
import SupervisionCountOverTimeMetric from "../models/SupervisionCountOverTimeMetric";
import PathwaysTooltip from "../PathwaysTooltip/PathwaysTooltip";
import { formatMonthAndYear } from "../PopulationTimeSeriesChart/helpers";
import PopulationTimeSeriesLegend from "../PopulationTimeSeriesChart/PopulationTimeSeriesLegend";
import withMetricHydrator from "../withMetricHydrator";

type VizCountOverTimeWithAvgProps = {
  metric: SupervisionCountOverTimeMetric;
};

const VizCountOverTimeWithAvg: React.FC<VizCountOverTimeWithAvgProps> = ({
  metric,
}) => {
  const [hoveredId, setHoveredId] = useState(null);

  const { dataSeries, chartTitle } = metric;

  if (!dataSeries) return <div className="ChartCountOverTimeWithAvg" />;

  const data = dataSeries.map((d, index) => ({
    index,
    date: new Date(d.year, d.month - 1),
    value: d.count,
    average: d.avg90day,
  }));

  const averageData = dataSeries.map((d, index) => ({
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
    return <circle cx={cx} cy={cy} r={4} fill={styles.indigo} />;
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

  const yRange = [0, Math.max(...data.map((d) => d.value))];

  return (
    <div className="VizCountOverTimeWithAvg">
      <div className="PopulationTimeSeriesChart__Header">
        <div className="PopulationTimeSeriesChart__Title">{chartTitle}</div>
        <PopulationTimeSeriesLegend
          items={["Monthly count", "90-day average"]}
        />
      </div>
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
        tooltipContent={(d: any) => {
          const pieceData = d.pieces[0];
          return <ChartCountOverTimeWithAvgTooltip data={pieceData} />;
        }}
        type="bar"
        data={data}
        size={[558, 558]}
        margin={{ left: 79, bottom: 96, right: 50, top: 56 }}
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
            ticks: 3,
            tickFormat: (n: number) => n.toLocaleString(),
          },
        ]}
      />
    </div>
  );
};

type ChartCountOverTimeWithAvgTooltipProps = {
  data: {
    date: Date;
    value: number;
    average: number;
  };
};

const ChartCountOverTimeWithAvgTooltip: React.FC<ChartCountOverTimeWithAvgTooltipProps> = ({
  data,
}) => {
  const { date, value, average } = data;
  return (
    <PathwaysTooltip
      date={date.toLocaleString("en-US", { month: "long", year: "numeric" })}
      value={value.toString()}
      average={`90-day avg: ${average}`}
    />
  );
};

export default withMetricHydrator(observer(VizCountOverTimeWithAvg));
