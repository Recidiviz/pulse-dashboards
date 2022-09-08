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

import GeoViewTimeChart from '../GeoViewTimeChart';
import { COLORS } from '../../../assets/scripts/constants/colors';
import { configureDownloadButtons } from '../../../assets/scripts/utils/downloads';
import {
  getGoalForChart, getMaxForGoalAndDataIfGoalDisplayable, chartAnnotationForGoal,
} from '../../../utils/charts/metricGoal';
import {
  toggleLabel, getMonthCountFromMetricPeriodMonthsToggle, updateTooltipForMetricType,
  filterDatasetBySupervisionType, filterDatasetByDistrict, canDisplayGoal,
  toggleYAxisTicksFor, centerSingleMonthDatasetIfNecessary,
} from '../../../utils/charts/toggles';
import { sortFilterAndSupplementMostRecentMonths } from '../../../utils/transforms/datasets';
import { monthNamesWithYearsFromNumbers } from '../../../utils/transforms/months';

const centerNDLong = -100.5;
const centerNDLat = 47.3;

const RevocationCountOverTime = (props) => {
  const [chartLabels, setChartLabels] = useState([]);
  const [chartDataPoints, setChartDataPoints] = useState([]);
  const [chartMinValue, setChartMinValue] = useState();
  const [chartMaxValue, setChartMaxValue] = useState();

  const chartId = 'revocationCountsByMonth';
  const GOAL = getGoalForChart('US_ND', chartId);
  const stepSize = 10;

  const processResponse = () => {
    const { revocationCountsByMonth: countsByMonth } = props;

    let filteredCountsByMonth = filterDatasetBySupervisionType(
      countsByMonth, props.supervisionType,
    );

    filteredCountsByMonth = filterDatasetByDistrict(
      filteredCountsByMonth, props.district,
    );

    const dataPoints = [];
    if (filteredCountsByMonth) {
      filteredCountsByMonth.forEach((data) => {
        const {
          year, month, revocation_count: revocationCount, total_supervision_count: supervisionCount,
        } = data;

        if (props.metricType === 'counts') {
          const value = revocationCount;
          dataPoints.push({ year, month, value });
        } else if (props.metricType === 'rates') {
          const value = (100 * (revocationCount / supervisionCount)).toFixed(2);
          dataPoints.push({ year, month, value });
        }
      });
    }

    const months = getMonthCountFromMetricPeriodMonthsToggle(props.metricPeriodMonths);
    const sorted = sortFilterAndSupplementMostRecentMonths(dataPoints, months, 'value', 0);
    const chartDataValues = (sorted.map((element) => element.value));
    const max = getMaxForGoalAndDataIfGoalDisplayable(GOAL, chartDataValues, stepSize, props);
    const monthNames = monthNamesWithYearsFromNumbers(
      sorted.map((element) => element.month), false,
    );

    centerSingleMonthDatasetIfNecessary(chartDataValues, monthNames);
    setChartLabels(monthNames);
    setChartDataPoints(chartDataValues);
    setChartMinValue(0);
    setChartMaxValue(max);
  };

  function goalLineIfApplicable() {
    if (canDisplayGoal(GOAL, props)) {
      return chartAnnotationForGoal(GOAL, 'revocationCountsByMonthGoalLine', {});
    }
    return null;
  }

  useEffect(() => {
    processResponse();
  }, [
    props.revocationCountsByMonth,
    props.metricType,
    props.metricPeriodMonths,
    props.supervisionType,
    props.district,
  ]);

  const chart = (
    <Line
      id={chartId}
      data={{
        labels: chartLabels,
        datasets: [{
          label: toggleLabel(
            { counts: 'Revocation count', rates: 'Revocation rate' },
            props.metricType,
          ),
          backgroundColor: COLORS['grey-500'],
          borderColor: COLORS['grey-500'],
          pointBackgroundColor: COLORS['grey-500'],
          pointHoverBackgroundColor: COLORS['grey-500'],
          pointHoverBorderColor: COLORS['grey-500'],
          fill: false,
          borderWidth: 2,
          data: chartDataPoints,
        }],
      }}
      options={{
        legend: {
          display: false,
          position: 'bottom',
          labels: {
            usePointStyle: true,
            boxWidth: 10,
          },
        },
        scales: {
          yAxes: [{
            ticks: toggleYAxisTicksFor(
              'counts', props.metricType, chartMinValue, chartMaxValue, stepSize,
            ),
            scaleLabel: {
              display: true,
              labelString: toggleLabel(
                { counts: 'Revocation count', rates: 'Percentage' },
                props.metricType,
              ),
            },
            stacked: true,
          }],
        },
        tooltips: {
          backgroundColor: COLORS['grey-800-light'],
          mode: 'x',
          callbacks: {
            label: (tooltipItem, data) => updateTooltipForMetricType(
              props.metricType, tooltipItem, data,
            ),
          },
        },
        annotation: goalLineIfApplicable(),
      }}
    />
  );

  const exportedStructureCallback = () => (
    {
      metric: 'Revocation counts by month',
      series: [],
    });

  configureDownloadButtons(chartId, 'REVOCATIONS BY MONTH',
    chart.props.data.datasets, chart.props.data.labels,
    document.getElementById(chartId), exportedStructureCallback, props, true, true);

  const chartData = chart.props.data.datasets[0].data;
  const mostRecentValue = chartData[chartData.length - 1];

  const header = document.getElementById(props.header);

  if (header && mostRecentValue !== null && canDisplayGoal(GOAL, props)) {
    const title = `There have been <b style='color:#809AE5'>${mostRecentValue} revocations</b> that led to incarceration in a DOCR facility this month so far.`;
    header.innerHTML = title;
  } else if (header) {
    header.innerHTML = '';
  }

  return chart;
};

export default RevocationCountOverTime;
