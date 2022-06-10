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

import "./PracticesSummaryCard.scss";

import cn from "classnames";
import React from "react";

import { formatPercent } from "../../utils/formatStrings";
import { SummaryStatus } from "../PagePractices/types";

const getStatusClassName = (status: SummaryStatus) => {
  switch (status) {
    case "NEEDS_IMPROVEMENT":
      return "PracticesSummaryCard__needs-improvement";
    case "POOR":
      return "PracticesSummaryCard__poor";
    case "GOOD":
      return "PracticesSummaryCard__good";
    case "GREAT":
      return "PracticesSummaryCard__great";
    case "EXCELLENT":
      return "PracticesSummaryCard__excellent";

    default:
      return "";
  }
};

interface PropTypes {
  id: string;
  title: string;
  percentage: number;
  status: SummaryStatus;
  onClick: () => void;
  selected?: boolean;
}

const PracticesSummaryCard: React.FC<PropTypes> = ({
  id,
  title,
  percentage,
  status,
  selected,
  onClick,
}) => (
  <div
    role="presentation"
    onKeyDown={onClick}
    onClick={onClick}
    className={cn(
      "PracticesSummaryCard",
      `PracticesSummaryCard__${id}`,
      { selected },
      getStatusClassName(status),
      "p-0"
    )}
  >
    <div
      className={`${cn(getStatusClassName(status))}__top-border top-border`}
    />
    <div className={`${cn(getStatusClassName(status))}__content content p-0`}>
      <div className="PracticesSummaryCard__title">
        <span>{title}</span>
      </div>
      <div
        className={`PracticesSummaryCard__percent ${cn(
          getStatusClassName(status)
        )}__percent`}
      >
        <span>{formatPercent(percentage)}</span>
      </div>
    </div>
  </div>
);

PracticesSummaryCard.defaultProps = {
  selected: false,
};

export default PracticesSummaryCard;
