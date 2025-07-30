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

import {
  Selector,
  SelectorProps,
} from "../../../../components/Selector/Selector";
import { UsMaEGTMonthlyReport } from "../../models/UsMaEGTMonthlyReport";
import { useEGTDataContext } from "../EGTDataContext/context";

type MonthlyReportSelectorProps = Pick<SelectorProps<Date>, "onChange"> & {
  selectedReport: UsMaEGTMonthlyReport;
};

export const MonthlyReportSelector = observer(function MonthlyReportSelector({
  onChange,
  selectedReport,
}: MonthlyReportSelectorProps) {
  const labelId = useId();
  const { monthlyReports } = useEGTDataContext();

  return (
    <Selector
      {...{ onChange }}
      labelId={labelId}
      placeholder=""
      value={selectedReport.selectOption}
      options={monthlyReports
        .map((r) => r.selectOption)
        .sort((a, b) => descending(a.value, b.value))}
    />
  );
});
