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

import {
  SARDetailsPresenter,
  SARReportType,
} from "../../presenters/SARDetailsPresenter";
import * as Styled from "./ReportTypeNotice.styles";

/**
 * The subset of SARDetailsPresenter this notice needs. Sub-presenters that
 * wrap a private SARDetailsPresenter (e.g. PriorTreatmentHistoryPresenter)
 * can satisfy this by proxying these members through, without exposing the
 * full presenter.
 */
export interface ReportTypeNoticeControls {
  reportType: SARDetailsPresenter["reportType"];
  isReportTypeLocked: SARDetailsPresenter["isReportTypeLocked"];
  isVictimImpactOnly: SARDetailsPresenter["isVictimImpactOnly"];
  startReportTypeChange: SARDetailsPresenter["startReportTypeChange"];
}

interface ReportTypeNoticeProps {
  presenter: ReportTypeNoticeControls;
}

function getReportTypeCopy(
  reportType: SARReportType | undefined,
  isVictimImpactOnly: boolean | null,
) {
  if (reportType === "SAR")
    return "You are filling out all sections of this report.";
  else if (isVictimImpactOnly === true)
    return "You are only filling out the Victim Impact section.";
  return "You are filling out all sections except Victim Impact.";
}

/**
 * Shows which sections of the SAR the officer selected to fill out (when the
 * report was split via the PSR builder), with a link to reopen that choice.
 */
export const ReportTypeNotice: React.FC<ReportTypeNoticeProps> = observer(
  function ReportTypeNotice({ presenter }) {
    if (
      presenter.isReportTypeLocked === undefined ||
      presenter.isReportTypeLocked === null ||
      presenter.isReportTypeLocked === true
    )
      return null;

    const copy = getReportTypeCopy(
      presenter.reportType,
      presenter.isVictimImpactOnly,
    );

    return (
      <Styled.Container>
        {copy}
        <Styled.Link onClick={() => presenter.startReportTypeChange()}>
          Change
        </Styled.Link>
      </Styled.Container>
    );
  },
);
