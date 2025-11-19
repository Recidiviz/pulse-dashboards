// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { descending } from "d3-array";
import { observer } from "mobx-react-lite";
import { useId } from "react";
import styled from "styled-components";

import { Selector, SelectorProps } from "~@jii/common-ui";
import { useUsMaTranslations } from "~@jii/translation";

import { UsMaEGTMonthlyReport } from "../../models/UsMaEGTMonthlyReport";
import { useEGTDataContext } from "../EGTDataContext/context";

type MonthlyReportSelectorProps = Pick<
  SelectorProps<Date>,
  "onChange" | "menuAlign"
> & {
  selectedReport: UsMaEGTMonthlyReport;
};

const Wrapper = styled.div`
  min-width: 11em;
`;

export const MonthlyReportSelector = observer(function MonthlyReportSelector({
  onChange,
  selectedReport,
  menuAlign,
}: MonthlyReportSelectorProps) {
  const labelId = useId();
  const { monthlyReports } = useEGTDataContext();
  const { t } = useUsMaTranslations();

  const makeOption = (report: UsMaEGTMonthlyReport) => ({
    value: report.reportStartDate,
    label: t(($) => $.individualMonthlyReport.selectOptionLabel, {
      reportStartDate: report.reportStartDate,
    }),
  });

  return (
    <Wrapper>
      <Selector
        {...{ onChange, menuAlign }}
        labelId={labelId}
        placeholder=""
        value={makeOption(selectedReport)}
        options={monthlyReports
          .map(makeOption)
          .sort((a, b) => descending(a.value, b.value))}
      />
    </Wrapper>
  );
});
