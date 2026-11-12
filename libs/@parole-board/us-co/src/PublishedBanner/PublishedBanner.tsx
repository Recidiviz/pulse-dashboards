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

import { hideVisually } from "polished";
import styled from "styled-components";

import { ButtonLink, Callout, semantics } from "~@parole-board/common";
import { pluralize } from "~utils";

import { formatPublishedAt } from "./formatPublishedAt";

// The DRAFT strip's min height too, so the page below doesn't move between a
// published month and one back in draft.
const Strip = styled(Callout)`
  min-height: ${semantics.size.banner};
`;

const VisuallyHidden = styled.span`
  ${hideVisually()}
`;

export type PublishedBannerProps = {
  /** The month's title, such as "September 2026". */
  monthLabel: string;
  /** Days with at least one hearing in the month. */
  hearingDays: number;
  /** Hearings in the month. */
  hearings: number;
  /** When the month was last published. */
  publishedAt: Date;
  /** The calendar's IANA time zone, which the publish time is shown in. */
  timeZone: string;
  /** The email of whoever last published the month. */
  publishedByEmail: string;
  /**
   * The month's page on the public calendar, which View public page opens, or
   * null to leave the link out.
   */
  publicPageUrl: string | null;
};

/**
 * The strip under the header of a published month, saying the month is live
 * and who published it when. It has no close button, like the DRAFT strip,
 * so it stays for as long as the month is published. Matches the UPLOAD
 * COMPLETE strip on the Public Calendar screen in the Calendar Unit Dashboard
 * design, without the design's line about notifying board members, since
 * nothing sends notifications. View public page opens the month's public
 * page in a new tab, so the editor keeps their place in the admin; without a
 * public page address, the strip has no link.
 */
export function PublishedBanner({
  monthLabel,
  hearingDays,
  hearings,
  publishedAt,
  timeZone,
  publishedByEmail,
  publicPageUrl,
}: PublishedBannerProps) {
  return (
    // Named like the DRAFT strip's section, since both say where the month
    // stands.
    <section aria-label="Month status">
      <Strip
        tone="success"
        layout="strip"
        live={false}
        tag="UPLOAD COMPLETE"
        detail={`Published ${formatPublishedAt(publishedAt, timeZone)} by ${publishedByEmail}`}
        action={
          publicPageUrl && (
            // noopener stops the public page controlling the admin tab
            // through window.opener, and noreferrer keeps the admin URL from
            // it.
            <ButtonLink
              href={publicPageUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              View public page
              <VisuallyHidden> (opens in a new tab)</VisuallyHidden>
            </ButtonLink>
          )
        }
      >
        {`${monthLabel} is live on the public calendar — ${pluralize(hearingDays, "hearing day")}, ${pluralize(hearings, "hearing")}.`}
      </Strip>
    </section>
  );
}
