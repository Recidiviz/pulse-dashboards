// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { observer } from "mobx-react-lite";
import React from "react";

import { SARDetailsPresenter } from "../../presenters/SARDetailsPresenter";
import * as Styled from "./Summary.styles";
import { SummaryOrMissing } from "./SummaryOrMissing";

interface SummarySexualHistoryDetailsProps {
  presenter: SARDetailsPresenter;
}

export const SummarySexualHistoryDetails: React.FC<SummarySexualHistoryDetailsProps> =
  observer(function SummarySexualHistoryDetails({ presenter }) {
    return (
      <>
        <Styled.InlineLabel>Sexual History</Styled.InlineLabel>
        <SummaryOrMissing
          summary={presenter.SARData?.sexualHistorySummary}
          labeled
        />
      </>
    );
  });
