// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2020 Recidiviz, Inc.
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

import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

import Pagination from "./Pagination";
import Sortable from "./Sortable";
import useSort from "./useSort";

import ExportMenu from "../../ExportMenu";
import Loading from "../../../Loading";

// eslint-disable-next-line import/no-cycle
import { useAuth0 } from "../../../../react-auth0-spa";
import usePrevious from "../../../../hooks/usePrevious";
import {
  fetchChartData,
  awaitingResults,
} from "../../../../utils/metricsClient";

import { COLORS } from "../../../../assets/scripts/constants/colors";
import {
  getTrailingLabelFromMetricPeriodMonthsToggle,
  getPeriodLabelFromMetricPeriodMonthsToggle,
} from "../../../../utils/charts/toggles";
import { parseAndFormatViolationRecord } from "../../../../utils/charts/violationRecord";
import {
  humanReadableTitleCase,
  nameFromOfficerId,
  riskLevelValuetoLabel,
} from "../../../../utils/transforms/labels";

const CASES_PER_PAGE = 15;

const unknownStyle = {
  fontStyle: "italic",
  fontSize: "13px",
  color: COLORS["grey-500"],
};

const chartId = "filteredCaseTable";

const CaseTable = ({
  dataFilter,
  filterStates,
  metricPeriodMonths,
  skippedFilters,
  treatCategoryAllAsAbsent,
  stateCode,
}) => {
  const [index, setIndex] = useState(0);
  const [countData, setCountData] = useState(0);

  const { loading, user, getTokenSilently } = useAuth0();
  const [apiData, setApiData] = useState({});
  const [awaitingApi, setAwaitingApi] = useState(true);

  const { toggleOrder, comparator, getOrder } = useSort();

  useEffect(() => {
    fetchChartData(
      stateCode,
      "newRevocations",
      "revocations_matrix_filtered_caseload",
      setApiData,
      setAwaitingApi,
      getTokenSilently
    );
  }, [getTokenSilently, stateCode]);

  // TODO: After moving the API call inside this component, the pagination protections are not
  // working exactly as intended. We are relying on the commented safe-guard near the end only.
  const prevCount = usePrevious(countData);

  useEffect(() => {
    setCountData(apiData.length);
  }, [apiData.length]);

  if (awaitingResults(loading, user, awaitingApi)) {
    return <Loading />;
  }

  const filteredData = dataFilter(
    apiData,
    skippedFilters,
    treatCategoryAllAsAbsent
  );

  // Sort case load first by district, second by officer name, third by person id (all ascending)
  const caseLoad = filteredData.sort(comparator);
  let beginning = countData !== prevCount ? 0 : index * CASES_PER_PAGE;
  let end =
    beginning + CASES_PER_PAGE < filteredData.length
      ? beginning + CASES_PER_PAGE
      : filteredData.length;

  // Extra safe-guard against non-sensical pagination results
  if (beginning >= end) {
    beginning = 0;
    end = beginning + CASES_PER_PAGE;
  }

  function updatePage(change) {
    if (beginning === 0) {
      setIndex(1);
    } else {
      setIndex(index + change);
    }
  }

  const page = caseLoad.slice(beginning, end);

  const normalizeLabel = (label) =>
    label ? humanReadableTitleCase(label) : "";
  const nullSafeLabel = (label) => label || "Unknown";
  const nullSafeCell = (label) => {
    if (label) {
      return <td>{label}</td>;
    }
    return <td style={unknownStyle}>{nullSafeLabel(label)}</td>;
  };

  const labels = [
    "DOC ID",
    "District",
    "Officer",
    "Risk level",
    "Officer Recommendation",
    "Violation record",
  ];

  const tableData = (filteredData || []).map((record) => ({
    data: [
      nullSafeLabel(record.state_id),
      nullSafeLabel(record.district),
      nullSafeLabel(nameFromOfficerId(record.officer)),
      nullSafeLabel(riskLevelValuetoLabel[record.risk_level]),
      nullSafeLabel(normalizeLabel(record.officer_recommendation)),
      nullSafeLabel(parseAndFormatViolationRecord(record.violation_record)),
    ],
  }));

  const trailingLabel = getTrailingLabelFromMetricPeriodMonthsToggle(
    metricPeriodMonths
  );
  const periodLabel = getPeriodLabelFromMetricPeriodMonthsToggle(
    metricPeriodMonths
  );

  const sortableProps = (field) => ({
    order: getOrder(field),
    onClick: () => {
      toggleOrder(field);
      setIndex(0);
    },
  });

  return (
    <div className="case-table">
      <h4>
        Admitted individuals
        <ExportMenu
          chartId={chartId}
          shouldExport={false}
          tableData={tableData}
          metricTitle="Admitted individuals"
          isTable
          tableLabels={labels}
          timeWindowDescription={`${trailingLabel} (${periodLabel})`}
          filters={filterStates}
        />
      </h4>
      <h6 className="pB-20">{`${trailingLabel} ${periodLabel}`}</h6>
      <table>
        <thead>
          <tr>
            <th>
              <Sortable {...sortableProps("state_id")}>DOC ID</Sortable>
            </th>
            <th>
              <Sortable {...sortableProps("district")}>District</Sortable>
            </th>
            <th>
              <Sortable {...sortableProps("officer")}>Officer</Sortable>
            </th>
            <th>
              <Sortable {...sortableProps("risk_level")}>Risk level</Sortable>
            </th>
            <th className="long-title">
              <Sortable {...sortableProps("officer_recommendation")}>
                Last Rec. (Including Supplemental)
              </Sortable>
            </th>
            <th>
              <Sortable {...sortableProps("violation_record")}>
                Violation record
              </Sortable>
            </th>
          </tr>
        </thead>
        <tbody className="fs-block">
          {page.map((details, i) => (
            // Need to know unique set of fields for uniq key
            // eslint-disable-next-line react/no-array-index-key
            <tr key={i}>
              <td>{details.state_id}</td>
              {nullSafeCell(details.district)}
              {nullSafeCell(nameFromOfficerId(details.officer))}
              {nullSafeCell(riskLevelValuetoLabel[details.risk_level])}
              {nullSafeCell(normalizeLabel(details.officer_recommendation))}
              {nullSafeCell(
                parseAndFormatViolationRecord(details.violation_record)
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {filteredData.length > CASES_PER_PAGE && (
        <Pagination
          beginning={beginning}
          end={end}
          total={filteredData.length}
          onUpdatePage={updatePage}
        />
      )}
    </div>
  );
};

CaseTable.defaultProps = {
  skippedFilters: [],
};

const metricPeriodMonthsType = PropTypes.oneOfType([
  PropTypes.string,
  PropTypes.number,
]);

CaseTable.propTypes = {
  dataFilter: PropTypes.func.isRequired,
  filterStates: PropTypes.shape({
    metricPeriodMonths: metricPeriodMonthsType.isRequired,
    chargeCategory: PropTypes.string,
    district: PropTypes.string,
    supervisionType: PropTypes.string,
  }).isRequired,
  skippedFilters: PropTypes.arrayOf(PropTypes.string),
  treatCategoryAllAsAbsent: PropTypes.bool.isRequired,
  metricPeriodMonths: metricPeriodMonthsType.isRequired,
  stateCode: PropTypes.string.isRequired,
};

export default CaseTable;
