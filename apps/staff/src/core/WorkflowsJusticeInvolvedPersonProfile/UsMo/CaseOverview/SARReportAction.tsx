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

import React, { useState } from "react";

import { isSARArchived, SARByClient, sarUrl } from "~sentencing-client";

import { RowActionButton, RowActionLink } from "./styles";

/** Label for the in-place download action on an archived (court-submitted) SAR. */
const ARCHIVED_ACTION_LABEL = "Download Report";

/** Label shown on the download button while the PDF is being generated. */
const DOWNLOADING_LABEL = "Downloading…";

/** Label text for the link on a not-yet-archived SAR row. */
const ACTIVE_ACTION_LABEL = "Go to SAR Builder";

/** In-tool deep-link to the SAR Builder for a not-yet-archived SAR. Returns
 * `undefined` if the SAR has no associated staff record — Prisma marks the
 * relation optional because the SAR / Staff / Client loads run independently,
 * but the assigned-only authz on the tRPC procedure means we should not see
 * `null` staff here in practice. */
function builderHref(sar: SARByClient): string | undefined {
  if (!sar.staff) return undefined;
  return sarUrl("sarDetails", {
    staffPseudoId: sar.staff.pseudonymizedId,
    sarId: sar.id,
  });
}

type SARReportActionProps = {
  sar: SARByClient;
  /** Render + download the finished SAR PDF (archived rows). Awaited so this
   * component knows when generation finishes and can clear its in-flight lock. */
  onDownload: (sar: SARByClient) => Promise<void>;
  /** Warm the SAR data on hover/focus so the download is instant (archived rows). */
  onPrefetch: (sar: SARByClient) => void;
  /** Track the "Go to SAR Builder" link click (not-yet-archived rows). */
  onBuilderLinkClick: (sar: SARByClient) => void;
};

/**
 * Per-row action for a single SAR on the US_MO Case Overview "Reports" section.
 *
 * - Archived SAR (`completionDate` in the past): a "Download Report" button that
 *   renders + saves the finished PDF in place (prefetched on hover/focus).
 * - Not-yet-archived SAR: a "Go to SAR Builder" link that navigates to the
 *   builder.
 *
 * The in-flight download lock (`isDownloading`) is **owned by this component**,
 * not the shared download hook, so each row disables only its own button. A
 * single hook-level `downloadingId` would be overwritten the moment a second
 * row was clicked (re-enabling the first mid-download) and cleared for every
 * row by whichever download finished first — so the per-row lock here is what
 * actually prevents a double-click, even with overlapping downloads.
 */
export function SARReportAction({
  sar,
  onDownload,
  onPrefetch,
  onBuilderLinkClick,
}: SARReportActionProps): React.ReactElement {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isSARArchived(sar)) {
    return (
      <RowActionLink
        href={builderHref(sar)}
        onClick={() => onBuilderLinkClick(sar)}
      >
        {ACTIVE_ACTION_LABEL}
      </RowActionLink>
    );
  }

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await onDownload(sar);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <RowActionButton
      onMouseEnter={() => onPrefetch(sar)}
      onFocus={() => onPrefetch(sar)}
      onClick={handleDownload}
      disabled={isDownloading}
    >
      {isDownloading ? DOWNLOADING_LABEL : ARCHIVED_ACTION_LABEL}
    </RowActionButton>
  );
}

export default SARReportAction;
