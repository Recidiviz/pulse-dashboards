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

/* eslint-disable react/no-array-index-key */

import "./Matrix.scss";

import cx from "classnames";
import filter from "lodash/fp/filter";
import flatten from "lodash/fp/flatten";
import get from "lodash/fp/get";
import getOr from "lodash/fp/getOr";
import groupBy from "lodash/fp/groupBy";
import mapValues from "lodash/fp/mapValues";
import max from "lodash/fp/max";
import pipe from "lodash/fp/pipe";
import sum from "lodash/fp/sum";
import sumBy from "lodash/fp/sumBy";
import toInteger from "lodash/fp/toInteger";
import values from "lodash/fp/values";
import { get as mobxGet } from "mobx";
import { observer } from "mobx-react-lite";
import PropTypes from "prop-types";
import React from "react";

import ErrorMessage from "../../components/ErrorMessage";
import {
  matrixViolationTypeToLabel,
  violationCountLabel,
} from "../../utils/formatStrings";
import { translate } from "../../utils/i18nSettings";
import ExportMenu from "../ExportMenu";
import { useContainerHeight } from "../hooks/useContainerHeight";
import { useLanternStore } from "../LanternStoreProvider";
import LoadingChart from "../LoadingChart";
import { REPORTED_VIOLATIONS, VIOLATION_TYPE } from "../utils/constants";
import MatrixCell from "./MatrixCell";
import MatrixRow from "./MatrixRow";

const VIOLATION_COUNTS = ["1", "2", "3", "4", "5", "6", "7", "8"];

const getInteger = (field) => pipe(get(field), toInteger);
const sumByInteger = (field) => sumBy(getInteger(field));
const sumRow = pipe(values, sum);

function Matrix({ timeDescription }) {
  const { dataStore, filters, filtersStore } = useLanternStore();
  const { filterOptions } = filtersStore;
  const store = dataStore.matrixStore;
  const CHART_TITLE = translate("revocationsMatrixChartTitle");
  const CHART_ID = translate("revocationsMatrixChartId");

  const { containerHeight, containerRef } = useContainerHeight();
  const violationTypes = translate("violationTypes");

  if (store.isLoading) {
    return <LoadingChart containerHeight={containerHeight} />;
  }

  if (store.isError) {
    return <ErrorMessage />;
  }

  const updateFilters = (updatedFilters) => {
    filtersStore.setFilters(updatedFilters);
  };

  const isFiltered =
    mobxGet(filters, VIOLATION_TYPE) || mobxGet(filters, REPORTED_VIOLATIONS);

  const filteredData = pipe(
    filter((data) => violationTypes.includes(data.violation_type)),
  )(store.filteredData);

  const dataMatrix = pipe(
    groupBy("violation_type"),
    mapValues(
      pipe(
        groupBy("reported_violations"),
        mapValues(sumByInteger("total_revocations")),
      ),
    ),
  )(filteredData);

  if (!dataMatrix) {
    return null;
  }

  const maxRevocations = pipe(
    () =>
      violationTypes.map((rowLabel) =>
        VIOLATION_COUNTS.map((columnLabel) =>
          getOr(0, [rowLabel, columnLabel], dataMatrix),
        ),
      ),
    flatten,
    max,
  )();

  const violationsSum = sumByInteger("total_revocations")(filteredData);
  const reportedViolationsSum = pipe(
    (count) =>
      filter((data) => data.reported_violations === count, filteredData),
    sumByInteger("total_revocations"),
  );

  const isSelected = (violationType, reportedViolations) =>
    mobxGet(filters, VIOLATION_TYPE) === violationType &&
    mobxGet(filters, REPORTED_VIOLATIONS) === reportedViolations;

  const updateFilter = (violationType, reportedViolations) => {
    if (isSelected(violationType, reportedViolations)) {
      updateFilters({
        violationType: filterOptions[VIOLATION_TYPE].defaultValue,
        reportedViolations: filterOptions[REPORTED_VIOLATIONS].defaultValue,
      });
    } else {
      updateFilters({ violationType, reportedViolations });
    }
  };

  const exportableMatrixData = violationTypes.map((rowLabel) => ({
    label: matrixViolationTypeToLabel[rowLabel],
    data: VIOLATION_COUNTS.map((columnLabel) =>
      getOr(0, [rowLabel, columnLabel], dataMatrix),
    ),
  }));

  return (
    <div ref={containerRef} className="Matrix">
      <h4 className="Matrix__title">
        {CHART_TITLE}
        <ExportMenu
          chartId={CHART_ID}
          regularElement
          datasets={exportableMatrixData}
          labels={VIOLATION_COUNTS.map(violationCountLabel)}
          metricTitle={CHART_TITLE}
          timeWindowDescription={timeDescription}
          fixLabelsInColumns
          dataExportLabel="Violations"
        />
      </h4>
      <h6 className="Matrix__dates">{timeDescription}</h6>
      <div className="Matrix__x-label">
        # of {translate("violationReports")}
      </div>
      <div id={CHART_ID} className="Matrix__chart-container">
        <div className="Matrix__y-label" data-html2canvas-ignore>
          Most severe violation reported
        </div>
        <div
          className={cx("Matrix__matrix", {
            "Matrix__matrix--is-filtered": isFiltered,
          })}
        >
          <div className="Matrix__violation-counts">
            <span className="Matrix__empty-cell" />
            {VIOLATION_COUNTS.map((count, i) => (
              <span key={i} className="Matrix__violation-column">
                {violationCountLabel(count)}
              </span>
            ))}
            <span
              className={cx(
                "Matrix__violation-sum-column",
                "Matrix__top-right-total",
              )}
            >
              Total
            </span>
          </div>

          {violationTypes.map((violationType, i) => (
            <MatrixRow
              key={i}
              violationType={violationType}
              sum={sumRow(dataMatrix[violationType])}
              onClick={() => updateFilter(violationType, "All")}
            >
              {VIOLATION_COUNTS.map((violationCount, j) => (
                <MatrixCell
                  key={j}
                  count={getOr(0, [violationType, violationCount], dataMatrix)}
                  maxCount={maxRevocations}
                  violationType={violationType}
                  reportedViolations={violationCount}
                  onClick={() => updateFilter(violationType, violationCount)}
                />
              ))}
            </MatrixRow>
          ))}

          <div className="Matrix__violation-sum-row">
            <span className="Matrix__empty-cell" />
            {VIOLATION_COUNTS.map((count, i) => (
              <span
                key={i}
                className={cx(
                  "Matrix__violation-column",
                  "Matrix__violation-sum",
                )}
              >
                {reportedViolationsSum(count)}
              </span>
            ))}

            <span
              className={cx(
                "Matrix__violation-sum-column",
                "Matrix__violation-sum",
                "Matrix__bottom-right-total",
              )}
            >
              {violationsSum}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

Matrix.propTypes = {
  timeDescription: PropTypes.string.isRequired,
};

export default observer(Matrix);
