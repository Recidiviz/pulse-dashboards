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
import { Bar } from 'react-chartjs-2';
import pattern from 'patternomaly';
import DataSignificanceWarningIcon from '../DataSignificanceWarningIcon';
import ExportMenu from '../ExportMenu';
import Loading from '../../Loading';

import { useAuth0 } from '../../../react-auth0-spa';
import { fetchChartData, awaitingResults } from '../../../utils/metricsClient';

import { COLORS } from '../../../assets/scripts/constants/colors';
import { axisCallbackForPercentage } from '../../../utils/charts/axis';
import {
  isDenominatorStatisticallySignificant,
  isDenominatorsMatrixStatisticallySignificant,
  tooltipForFooterWithCounts,
} from '../../../utils/charts/significantStatistics';
import {
  getTrailingLabelFromMetricPeriodMonthsToggle,
  getPeriodLabelFromMetricPeriodMonthsToggle,
  tooltipForRateMetricWithCounts,
} from '../../../utils/charts/toggles';
import {
  toInt, humanReadableTitleCase, riskLevelValuetoLabel,
} from '../../../utils/transforms/labels';

const chartId = 'revocationsByRiskLevel';

const RevocationsByRiskLevel = (props) => {
  const [chartLabels, setChartLabels] = useState([]);
  const [chartDataPoints, setChartDataPoints] = useState([]);
  const [numeratorCounts, setNumeratorCounts] = useState([]);
  const [denominatorCounts, setDenominatorCounts] = useState([]);

  const { loading, user, getTokenSilently } = useAuth0();
  const [apiData, setApiData] = useState({});
  const [awaitingApi, setAwaitingApi] = useState(true);

  const showWarning = !isDenominatorsMatrixStatisticallySignificant(denominatorCounts);

  const processResponse = () => {
    if (awaitingApi || !apiData) {
      return;
    }
    const filteredData = props.dataFilter(
      apiData, props.skippedFilters, props.treatCategoryAllAsAbsent,
    );

    const revocationsByRiskLevel = filteredData.reduce(
      (result, { risk_level: riskLevel, population_count: populationCount }) => {
        return { ...result, [riskLevel]: (result[riskLevel] || 0) + (toInt(populationCount) || 0) };
      }, {},
    );

    const supervisionCountsByRiskLevel = filteredData.reduce(
      (result, { risk_level: riskLevel, total_supervision_count: totalSupervisionCount }) => {
        return { ...result, [riskLevel]: (result[riskLevel] || 0) + (toInt(totalSupervisionCount) || 0) };
      }, {},
    );

    const getRate = (riskLevel) => {
      const revocations = revocationsByRiskLevel[riskLevel];
      const supervisionCount = supervisionCountsByRiskLevel[riskLevel];

      if (!revocations || !supervisionCount) {
        return '0.00';
      }

      return (100 * (revocations / supervisionCount)).toFixed(2);
    };

    const labels = Object.values(riskLevelValuetoLabel);
    const displayLabels = labels.map((label) => humanReadableTitleCase(label));
    const dataPoints = Object.keys(riskLevelValuetoLabel).map((riskLevel) => getRate(riskLevel));
    setChartLabels(displayLabels);
    setChartDataPoints(dataPoints);

    const numerators = Object.keys(riskLevelValuetoLabel).map(
      (riskLevel) => revocationsByRiskLevel[riskLevel],
    );
    const denominators = Object.keys(riskLevelValuetoLabel).map(
      (riskLevel) => supervisionCountsByRiskLevel[riskLevel],
    );
    setNumeratorCounts(numerators);
    setDenominatorCounts(denominators);
  };

  useEffect(() => {
    fetchChartData(
      props.stateCode, 'newRevocations', 'revocations_matrix_distribution_by_risk_level',
      setApiData, setAwaitingApi, getTokenSilently,
    );
  }, []);

  useEffect(() => {
    processResponse();
  }, [
    apiData,
    awaitingApi,
    props.filterStates,
    props.metricPeriodMonths,
  ]);

  const barBackgroundColor = ({ dataIndex, datasetIndex }) => {
    const color = COLORS['lantern-orange'];
    if (isDenominatorStatisticallySignificant(denominatorCounts[dataIndex])) {
      return color;
    } else {
      return pattern.draw('diagonal-right-left', color, '#ffffff', 5);
    }
  }

  const chart = (
    <Bar
      id={chartId}
      data={{
        labels: chartLabels,
        datasets: [{
          label: 'Percent revoked',
          backgroundColor: barBackgroundColor,
          data: chartDataPoints,
        }],
      }}
      options={{
        legend: {
          display: false,
        },
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          xAxes: [{
            scaleLabel: {
              display: true,
              labelString: 'Risk level',
            },
            stacked: true,
          }],
          yAxes: [{
            ticks: {
              beginAtZero: true,
              callback: axisCallbackForPercentage(),
            },
            scaleLabel: {
              display: true,
              labelString: 'Percent revoked',
            },
            stacked: true,
          }],
        },
        tooltips: {
          backgroundColor: COLORS['grey-800-light'],
          footerFontSize: 9,
          mode: 'index',
          intersect: false,
          callbacks: {
            label: (tooltipItem, data) => tooltipForRateMetricWithCounts(tooltipItem, data, numeratorCounts, denominatorCounts),
            footer: (tooltipItem) => tooltipForFooterWithCounts(tooltipItem, denominatorCounts),
          },
        },
      }}
    />
  );

  if (awaitingResults(loading, user, awaitingApi)) {
    return <Loading />;
  }

  return (
    <div>
      <h4>
        Percent revoked by risk level
        {showWarning === true && <DataSignificanceWarningIcon />}
        <ExportMenu
          chartId={chartId}
          chart={chart}
          metricTitle="Percent revoked by risk level"
          timeWindowDescription={`${getTrailingLabelFromMetricPeriodMonthsToggle(props.metricPeriodMonths)} (${getPeriodLabelFromMetricPeriodMonthsToggle(props.metricPeriodMonths)})`}
          filters={props.filterStates}
        />
      </h4>
      <h6 className="pB-20">
        {`${getTrailingLabelFromMetricPeriodMonthsToggle(props.metricPeriodMonths)} (${getPeriodLabelFromMetricPeriodMonthsToggle(props.metricPeriodMonths)})`}
      </h6>

      <div className="static-chart-container fs-block">
        {chart}
      </div>
    </div>
  );
};

export default RevocationsByRiskLevel;
