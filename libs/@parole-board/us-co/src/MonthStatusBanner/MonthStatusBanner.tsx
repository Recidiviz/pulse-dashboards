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

import styled from "styled-components";

import type { MonthDetail } from "~@parole-board/common";
import { Callout, semantics, useParoleBoardHost } from "~@parole-board/common";

import { formatMonthYear } from "../model/month";
import { publicMonthUrl } from "../model/publicCalendarUrl";
import { PublishedBanner } from "../PublishedBanner/PublishedBanner";

export type MonthStatusBannerProps = {
  month: Pick<
    MonthDetail,
    "year" | "month" | "status" | "latestPublication" | "counts"
  > | null;
  /** The calendar's IANA time zone, which the publish time is shown in. */
  timeZone: string;
};

// As tall as the published banner, so the page below doesn't move between a
// month back in draft and a published one.
const Strip = styled(Callout)`
  min-height: ${semantics.size.banner};
`;

/**
 * The full-width strip under the header that says where the month stands
 * with the public calendar:
 *
 * - A PUBLISHED month shows the published banner, with the month's counts
 *   and its latest publish, for as long as the month is published.
 * - A DRAFT that was published before is back in draft after "Edit month",
 *   and shows the red DRAFT strip, since the public calendar no longer has it.
 * - Any other month shows nothing, so a never-published draft shows no
 *   strip, as in the design.
 *
 * Neither strip has a close button, since each says where the month stands.
 * The copy is the Calendar Unit Dashboard design's. View public page links to
 * the month on the host's public calendar address, and is left out when the
 * host has no valid one.
 */
export function MonthStatusBanner({ month, timeZone }: MonthStatusBannerProps) {
  const { publicCalendarUrl } = useParoleBoardHost();
  const publication =
    month?.status === "PUBLISHED" ? month.latestPublication : null;

  if (month && publication) {
    return (
      <PublishedBanner
        monthLabel={formatMonthYear(month)}
        hearingDays={month.counts.entryDays}
        hearings={month.counts.entryCount}
        publishedAt={publication.publishedAt}
        timeZone={timeZone}
        publishedByEmail={publication.publishedByEmail}
        publicPageUrl={publicMonthUrl(publicCalendarUrl, month)}
      />
    );
  }
  if (month?.status !== "DRAFT" || month.latestPublication === null) {
    return null;
  }
  return (
    <section aria-label="Month status">
      <Strip tone="error" layout="strip" tag="DRAFT" live={false}>
        {formatMonthYear(month)} is back in draft and no longer live on the
        public calendar. Re-publish when your edits are complete.
      </Strip>
    </section>
  );
}
