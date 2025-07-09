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

import { ReactNode, useRef, useState } from "react";

import * as Styled from "../CaseDetails.styles";

const MAX_SUMMARY_HEIGHT = 280;

/**
 * Used specifically for determining whether or not the recommendation summary edited by
 * the user will overflow the height of the V2 report.
 */
export function useReportSummaryOverflowDetector(enabled?: boolean) {
  const measurementRef = useRef<HTMLDivElement>(null);
  const [showOverflowError, setShowOverflowError] = useState(false);

  function willOverflow(value: string): boolean {
    if (!enabled || !measurementRef.current) return false;

    measurementRef.current.innerText = value;

    const exceedsMaxHeight =
      measurementRef.current.offsetHeight > MAX_SUMMARY_HEIGHT;
    setShowOverflowError(exceedsMaxHeight);

    return exceedsMaxHeight;
  }

  /*
   * A `div` used to measure the height of the recommendation summary text input that
   * has the same dimensions as the available space for that text in the report.
   */
  const ReportSummaryOverflowDetector: ReactNode = enabled ? (
    <Styled.ReportSummaryOverflowDetector ref={measurementRef} />
  ) : null;

  return {
    ReportSummaryOverflowDetector,
    showOverflowError,
    willOverflow,
  };
}
