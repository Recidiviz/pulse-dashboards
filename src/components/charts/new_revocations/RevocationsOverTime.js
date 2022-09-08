// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2019 Recidiviz, Inc.
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

import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import ExportMenu from '../ExportMenu';

import { COLORS } from '../../../assets/scripts/constants/colors';
import {
  getMonthCountFromMetricPeriodMonthsToggle, getTrailingLabelFromMetricPeriodMonthsToggle,
  centerSingleMonthDatasetIfNecessary,
} from '../../../utils/charts/toggles';
import { sortFilterAndSupplementMostRecentMonths } from '../../../utils/transforms/datasets';
import { toInt } from '../../../utils/transforms/labels';
import { monthNamesWithYearsFromNumbers } from '../../../utils/transforms/months';

const RevocationsOverTime = (props) => {
  const [chartLabels, setChartLabels] = useState([]);
  const [chartDataPoints, setChartDataPoints] = useState([]);

  const chartId = 'revocationsOverTime';

  const processResponse = () => {
    if (!props.data) {
      return;
    }

    const { data: countsByMonth } = props;

    const yearAndMonthToCount = countsByMonth.reduce(
      (result, { year, month, total_revocations: totalRevocations }) => {
        return { ...result, [`${year}:${month}`]: (result[`${year}:${month}`] || 0) + (toInt(totalRevocations) || 0) };
      }, {},
    );
    const chartData = Object.entries(yearAndMonthToCount).map(([yearAndMonth, count]) => {
      const [year, month] = yearAndMonth.split(':');
      return { year, month, count };
    });

    const months = getMonthCountFromMetricPeriodMonthsToggle(props.metricPeriodMonths);
    const sortedChartData = sortFilterAndSupplementMostRecentMonths(chartData, months, 'count', 0);
    const labels = monthNamesWithYearsFromNumbers(sortedChartData.map((element) => element.month), false)
    const dataPoints = (sortedChartData.map((element) => element.count));

    centerSingleMonthDatasetIfNecessary(dataPoints, labels);
    setChartLabels(labels);
    setChartDataPoints(dataPoints);
  };

  useEffect(() => {
    processResponse();
  }, [
    props.data,
    props.metricPeriodMonths,
  ]);

  const datasets = [{
    label: 'Revocations',
    borderColor: COLORS['light-blue-500'],
    pointBackgroundColor: COLORS['light-blue-500'],
    fill: false,
    lineTension: 0,
    borderWidth: 2,
    data: chartDataPoints,
  }];

  const chart = (
    <Line
      id={chartId}
      data={{
        labels: chartLabels,
        datasets,
      }}
      options={{
        maintainAspectRatio: false,
        responsive: true,
        legend: {
          display: false,
        },
        scales: {
          xAxes: [{
            ticks: {
              autoSkip: false,
            },
          }],
          yAxes: [{
            scaleLabel: {
              display: true,
              labelString: 'People revoked',
            },
            ticks: {
              min: 0,
            },
          }],
        },
        tooltips: {
          backgroundColor: COLORS['grey-800-light'],
          mode: 'x',
        },
      }}
    />
  );

  return (
    <div>
      <h4>
        Number of people revoked to prison per month
        <ExportMenu
          chartId={chartId}
          chart={chart}
          metricTitle="Number of people revoked to prison per month"
        />
      </h4>
      <h6 className="pB-20">
        {getTrailingLabelFromMetricPeriodMonthsToggle(props.metricPeriodMonths)}
      </h6>

      <div className="chart-container fs-block" style={{ position: 'relative', height: '180px' }}>
        {chart}
      </div>
    </div>
  );
};

export default RevocationsOverTime;
