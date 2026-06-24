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

import { format } from "date-fns";
import React from "react";

import {
  CaseStatusToDisplay,
  isSARArchived,
  SARByClient,
  SARsByClient,
} from "~sentencing-client";

import { SARReportAction } from "./SARReportAction";
import { RowLabel, RowWithAction, Section, SectionHeading } from "./styles";

/** Map the wire-level SAR status enum to the display string used elsewhere in
 * the SAR product (`CaseStatusToDisplay` from `~sentencing-client`). Falls back
 * to the raw status if the value is unrecognized so we never render a blank. */
function humanStatus(status: SARByClient["status"]): string {
  return CaseStatusToDisplay[status] ?? status;
}

function rowLabel(sar: SARByClient): string {
  if (isSARArchived(sar) && sar.completionDate) {
    return `SAR - Completed ${format(sar.completionDate, "MM/dd/yyyy")}`;
  }
  return `SAR - ${humanStatus(sar.status)}`;
}

type SARReportsSectionProps = {
  sars: SARsByClient;
  /** Render + download the finished SAR PDF (archived rows). */
  onDownload: (sar: SARByClient) => Promise<void>;
  /** Warm the SAR data on hover/focus so the download is instant (archived rows). */
  onPrefetch: (sar: SARByClient) => void;
  /** Track the "Go to SAR Builder" link click (not-yet-archived rows). */
  onBuilderLinkClick: (sar: SARByClient) => void;
};

/**
 * Presentational "Reports" section of the US_MO Case Overview card. Renders one
 * row per SAR assigned to the calling officer for the current client:
 *
 * - Archived SAR (`completionDate` in the past): label shows "Completed {date}",
 *   and a "Download Report" button downloads the finished PDF in place
 *   (prefetched on hover/focus).
 * - Not-yet-archived SAR: label shows the current status, action link reads
 *   "Go to SAR Builder" and navigates to the SAR Builder.
 *
 * Pure/presentational — all data + side effects are injected by the container
 * (`SARReports`). Defensively returns `null` for an empty list so the section
 * never renders with just a heading.
 */
export function SARReportsSection({
  sars,
  onDownload,
  onPrefetch,
  onBuilderLinkClick,
}: SARReportsSectionProps): React.ReactElement | null {
  if (sars.length === 0) return null;

  return (
    <Section aria-labelledby="reports-heading">
      <SectionHeading id="reports-heading">Reports</SectionHeading>
      {sars.map((sar) => (
        <RowWithAction key={sar.id}>
          <RowLabel>{rowLabel(sar)}</RowLabel>
          <SARReportAction
            sar={sar}
            onDownload={onDownload}
            onPrefetch={onPrefetch}
            onBuilderLinkClick={onBuilderLinkClick}
          />
        </RowWithAction>
      ))}
    </Section>
  );
}

export default SARReportsSection;
