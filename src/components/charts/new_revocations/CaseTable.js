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

import React, { useState } from 'react';

import ExportMenu from '../ExportMenu';

import { COLORS } from '../../../assets/scripts/constants/colors';
import { getTrailingLabelFromMetricPeriodMonthsToggle } from '../../../utils/charts/toggles';
import {
  humanReadableTitleCase, toInt, nameFromOfficerId, riskLevelValuetoLabel,
} from '../../../utils/transforms/labels';

const CASES_PER_PAGE = 15;
const VIOLATION_SEVERITY = [
  'fel', 'misd', 'absc', 'muni', 'subs', 'tech',
];

const unknownStyle = {
  fontStyle: 'italic',
  fontSize: '13px',
  color: COLORS['grey-500'],
};

const chartId = 'filteredCaseTable';

const CaseTable = (props) => {
  const [index, setIndex] = useState(0);

  const updatePage = (change) => {
    setIndex(index + change);
  };

  const { data } = props;

  // Sort case load first by district (ascending), second by officer name (ascending)
  const caseLoad = data.sort((a, b) => {
    if (toInt(a.district) > toInt(b.district)) return 1;
    if (toInt(a.district) < toInt(b.district)) return -1;

    const aOfficer = a.officer || '';
    const bOfficer = b.officer || '';

    if (aOfficer.toLowerCase() > bOfficer.toLowerCase()) return 1;
    if (aOfficer.toLowerCase() < bOfficer.toLowerCase()) return -1;
    return 0;
  });

  const beginning = index * CASES_PER_PAGE;
  const end = beginning + CASES_PER_PAGE < data.length
    ? (beginning + CASES_PER_PAGE) : data.length;
  const page = caseLoad.slice(beginning, end);

  const normalizeLabel = (label) => (label ? humanReadableTitleCase(label) : '');
  const nullSafeLabel = (label) => label || 'Unknown';
  const nullSafeCell = (label) => {
    if (label) {
      return <td>{label}</td>;
    }
    return <td style={unknownStyle}>{nullSafeLabel(label)}</td>;
  };

  const indexOf = (element, array) => {
    for (let i = 0; i < array.length; i += 1) {
      if (element === array[i]) {
        return i;
      }
    }
    return -1;
  };

  const parseViolationRecord = (recordLabel) => {
    if (!recordLabel) {
      return '';
    }

    const recordParts = recordLabel.split(';');
    const records = recordParts.map((recordPart) => {
      const number = recordPart[0];
      const abbreviation = recordPart.substring(1);
      return { number, abbreviation };
    });
    records.sort((a, b) => indexOf(a.abbreviation, VIOLATION_SEVERITY)
      - indexOf(b.abbreviation, VIOLATION_SEVERITY));

    return records.map((record) => `${record.number} ${record.abbreviation}`).join(', ');
  };

  return (
    <div className="case-table">
      <h4>
        Filtered cases
        <ExportMenu
          chartId={chartId}
          shouldExport={false}
        />
      </h4>
      <h6 className="pB-20">
        {getTrailingLabelFromMetricPeriodMonthsToggle(props.metricPeriodMonths)}
      </h6>

      <table>
        <thead>
          <tr>
            <th>State ID</th>
            <th>District</th>
            <th>Officer</th>
            <th>Risk level</th>
            <th>Officer rec.</th>
            <th>Violation record</th>
          </tr>
        </thead>
        <tbody>
          {page.map((details, i) => (
            <tr key={i}>
              <td>{details.state_id}</td>
              {nullSafeCell(details.district)}
              {nullSafeCell(nameFromOfficerId(details.officer))}
              {nullSafeCell(riskLevelValuetoLabel[details.risk_level])}
              {nullSafeCell(normalizeLabel(details.officer_recommendation))}
              {nullSafeCell(parseViolationRecord(details.violation_record))}
            </tr>
          ))}
        </tbody>
      </table>
      {props.data.length > CASES_PER_PAGE && (
        <div className="table-navigation">
          {beginning !== 0 &&
            <button onClick={(e) => updatePage(-1)}>&#10094;</button>
          }
          Showing {beginning + 1} {beginning + 1 !== end && <> - {end} </>} of {props.data.length}
          {end < props.data.length &&
            <button onClick={(e) => updatePage(1)}>&#10095;</button>
          }
        </div>
      )}
    </div>
  );
};

export default CaseTable;
