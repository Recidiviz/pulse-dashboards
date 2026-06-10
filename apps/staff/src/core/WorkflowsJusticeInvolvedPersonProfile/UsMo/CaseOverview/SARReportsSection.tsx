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
  sarUrl,
} from "~sentencing-client";

import {
  RowActionLink,
  RowLabel,
  RowWithAction,
  Section,
  SectionHeading,
} from "./styles";

/** Label text for the link on an archived SAR row. Plan calls for link-only
 * navigation to the SAR Summary page; the in-tool Download button on that
 * page remains the affordance for downloading. */
const ARCHIVED_ACTION_LABEL = "View Report";

/** Label text for the link on a not-yet-archived SAR row. */
const ACTIVE_ACTION_LABEL = "Go to SAR Builder";

/** Map the wire-level SAR status enum to the display string used elsewhere in
 * the SAR product (`CaseStatusToDisplay` from `~sentencing-client`). Falls back
 * to the raw status if the value is unrecognized so we never render a blank.
 *
 * Note: `CaseStatusToDisplay.NotYetStarted` is `"Not yet started"` (only "N"
 * capitalized). The Figma comp shows "In progress" with a lowercase "p"; we
 * intentionally use the existing enum's `"In Progress"` to stay consistent
 * with the rest of the SAR product (Dashboard table, SAR Details header).
 */
function humanStatus(status: SARByClient["status"]): string {
  return CaseStatusToDisplay[status] ?? status;
}

function rowLabel(sar: SARByClient): string {
  if (isSARArchived(sar) && sar.completionDate) {
    return `SAR - Completed ${format(sar.completionDate, "MM/dd/yyyy")}`;
  }
  return `SAR - ${humanStatus(sar.status)}`;
}

/** Build the in-tool deep-link to the SAR for this row. Uses `sarDetails`,
 * which lands archived SARs on a read-only summary view and not-yet-archived
 * SARs in the SAR Builder. Returns `undefined` if the SAR has no associated
 * staff record — Prisma marks the relation optional because the SAR / Staff /
 * Client loads run independently, but the assigned-only authz on the tRPC
 * procedure means we should not see `null` staff here in practice. */
function rowHref(sar: SARByClient): string | undefined {
  if (!sar.staff) return undefined;
  return sarUrl("sarDetails", {
    staffPseudoId: sar.staff.pseudonymizedId,
    sarId: sar.id,
  });
}

function rowActionLabel(sar: SARByClient): string {
  return isSARArchived(sar) ? ARCHIVED_ACTION_LABEL : ACTIVE_ACTION_LABEL;
}

type SARReportsSectionProps = {
  sars: SARsByClient;
};

/**
 * Presentational "Reports" section of the US_MO Case Overview card. Renders
 * one row per SAR assigned to the calling officer for the current client:
 *
 * - Archived SAR (`completionDate` in the past): label shows "Completed {date}",
 *   action link reads "View Report" and navigates to the SAR Summary page.
 * - Not-yet-archived SAR: label shows the current status, action link reads
 *   "Go to SAR Builder" and navigates to the SAR Builder.
 *
 * Defensively returns `null` for an empty list so the section never renders
 * with just a heading; the container also gates this off but defending in
 * depth keeps this component safe to reuse.
 */
export function SARReportsSection({
  sars,
}: SARReportsSectionProps): React.ReactElement | null {
  if (sars.length === 0) return null;

  return (
    <Section aria-labelledby="reports-heading">
      <SectionHeading id="reports-heading">Reports</SectionHeading>
      {sars.map((sar) => (
        <RowWithAction key={sar.id}>
          <RowLabel>{rowLabel(sar)}</RowLabel>
          <RowActionLink href={rowHref(sar)}>
            {rowActionLabel(sar)}
          </RowActionLink>
        </RowWithAction>
      ))}
    </Section>
  );
}

export default SARReportsSection;
