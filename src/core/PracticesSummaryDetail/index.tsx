// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2021 Recidiviz, Inc.
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

import "./PracticesSummaryDetail.scss";

import { observer } from "mobx-react-lite";
import React from "react";

import { formatPercent } from "../../utils/formatStrings";
import { useCoreStore } from "../CoreStoreProvider";

const PracticesSummaryDetail: React.FC = () => {
  const { pagePracticesStore } = useCoreStore();
  const { summaryDetail } = pagePracticesStore;
  return (
    <div className="PracticesSummaryDetail">
      <div className="PracticesSummaryDetail__title">{summaryDetail.title}</div>
      <div
        className={`PracticesSummaryDetail__status PracticesSummaryDetail__status--${summaryDetail.status}`}
      />
      <div className="PracticesSummaryDetail__value">
        {formatPercent(summaryDetail.value)}
      </div>
      <div className="PracticesSummaryDetail__description">
        {summaryDetail.description}
      </div>
    </div>
  );
};
export default observer(PracticesSummaryDetail);
