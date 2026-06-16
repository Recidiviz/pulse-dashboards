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

import { TooltipTrigger } from "@recidiviz/design-system";
import { Row } from "@tanstack/react-table";
import simplur from "simplur";

import { UsMiSolitarySessionType } from "~datatypes";

import { Opportunity } from "../../../WorkflowsStore";
import { usMiAddInPersonSecurityClassificationCommitteeReviewV2Opportunity } from "../../../WorkflowsStore/Opportunity/UsMi/UsMiAddInPersonSecurityClassificationCommitteeReviewV2Opportunity";
import { usMiSecurityClassificationCommitteeReviewV2Opportunity } from "../../../WorkflowsStore/Opportunity/UsMi/UsMiSecurityClassificationCommitteeReviewV2Opportunity";
import { usMiWardenInPersonSecurityClassificationCommitteeReviewV2Opportunity } from "../../../WorkflowsStore/Opportunity/UsMi/UsMiWardenInPersonSecurityClassificationCommitteeReviewV2Opportunity";
import { PaletteKey, WorkflowsBadgePill } from "../../BadgePill/BadgePill";

type usMiSCCOppV2 =
  | usMiSecurityClassificationCommitteeReviewV2Opportunity
  | usMiWardenInPersonSecurityClassificationCommitteeReviewV2Opportunity
  | usMiAddInPersonSecurityClassificationCommitteeReviewV2Opportunity;

type AlertSettings = {
  palette: PaletteKey;
  tooltip: string;
};

// Alert thresholds in days
export const AD_SEG_INFO_THRESHOLD = 30 * 5; // 5 months
export const AD_SEG_WARNING_THRESHOLD = 365 / 2; // 6 months
export const AD_SEG_ALERT_THRESHOLD = 365;

export const TEMP_SEG_WARNING_THRESHOLD = 28;
export const TEMP_SEG_ALERT_THRESHOLD = 30;

export function useUsMiSegregationAlertSettings(
  daysInSolitarySession: number,
  solitarySessionType: UsMiSolitarySessionType,
): AlertSettings | undefined {
  if (solitarySessionType === "Administrative Segregation") {
    // Ad Seg
    if (daysInSolitarySession >= AD_SEG_ALERT_THRESHOLD)
      return {
        palette: "RED",
        tooltip: "Has Spent 12+ Months in Ad Seg",
      };
    if (daysInSolitarySession >= AD_SEG_WARNING_THRESHOLD)
      return {
        palette: "ORANGE",
        tooltip: "Approaching 12 Months in Ad Seg",
      };
    if (daysInSolitarySession >= AD_SEG_INFO_THRESHOLD)
      return {
        palette: "YELLOW",
        tooltip: "Approaching 6 Months in Ad Seg",
      };
  } else {
    // Temp Seg
    if (daysInSolitarySession >= TEMP_SEG_ALERT_THRESHOLD)
      return {
        palette: "RED",
        tooltip: "Has Spent 30+ Days in Temp Seg",
      };
    if (daysInSolitarySession >= TEMP_SEG_WARNING_THRESHOLD)
      return {
        palette: "ORANGE",
        tooltip: "Approaching 30 Day Maximum in Temp Seg",
      };
  }
  // No visual alert
  return undefined;
}

function UsMiSegDurationCell({ opp }: { opp: usMiSCCOppV2 }) {
  const {
    daysInSolitarySession,
    solitarySessionType,
    daysInSolitarySessionType,
  } = opp.record.metadata;
  const pillSettings = useUsMiSegregationAlertSettings(
    daysInSolitarySession,
    solitarySessionType,
  );

  const duration = simplur`${daysInSolitarySession} ${daysInSolitarySessionType.toLowerCase()} day[|s]`;
  if (!pillSettings) return duration;
  const { tooltip, palette } = pillSettings;

  return (
    <TooltipTrigger contents={tooltip}>
      <WorkflowsBadgePill text={duration} palette={palette} />
    </TooltipTrigger>
  );
}

export function UsMiSegDurationCellWrapper({ row }: { row: Row<Opportunity> }) {
  const opp = row.original;
  if (
    !(
      opp instanceof usMiSecurityClassificationCommitteeReviewV2Opportunity ||
      opp instanceof
        usMiWardenInPersonSecurityClassificationCommitteeReviewV2Opportunity ||
      opp instanceof
        usMiAddInPersonSecurityClassificationCommitteeReviewV2Opportunity
    )
  ) {
    return null;
  }

  return <UsMiSegDurationCell opp={opp} />;
}
