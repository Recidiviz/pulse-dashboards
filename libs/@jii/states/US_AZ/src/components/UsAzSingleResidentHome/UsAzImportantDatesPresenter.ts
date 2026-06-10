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

import { startOfDay } from "date-fns";
import { makeAutoObservable } from "mobx";

import { UsAzTFunction } from "~@jii/translation";

import {
  UsAzDisplayedDate,
  UsAzDisplayedDates,
} from "../UsAzSingleResidentContext/SingleResidentContextPresenter";
import { linkToDateSection } from "../utils/utils";
import type { CardHighlightStyle } from "./styles";

export interface DateEntry extends UsAzDisplayedDate {
  //flags that determine copy and formatting
  isUpcoming: boolean;
  isPast: boolean;
  isTentative: boolean;
  //variables that hold different copy based on the above flags
  title: string;
  info: string;
  value: string;
  goLink: string;
  linkUrl: string;
  //formatting variables
  highlightType?: CardHighlightStyle;
  showInfoTag: boolean;
  //copy for tpr/dtp overlay
  overlay?: {
    // small label above the heading; empty for tentative dates
    eyebrow: string;
    heading: string;
    body: string;
    linkText: string;
    closeLabel: string;
  };
}

export class UsAzImportantDatesPresenter {
  constructor(
    private displayedDates: UsAzDisplayedDates,
    private t: UsAzTFunction,
    private approval: {
      isTprApproved: boolean;
      isDtpApproved: boolean;
      usAzFslImprovements?: boolean;
    } = {
      isTprApproved: false,
      isDtpApproved: false,
    },
  ) {
    makeAutoObservable(this, undefined, { autoBind: true });
  }

  private buildOverlayCopy({
    approvalDateKey,
    isTentative,
    date,
    shortName,
  }: {
    approvalDateKey: "tprDate" | "dtpDate";
    isTentative: boolean;
    date: Date;
    shortName: string;
  }): NonNullable<DateEntry["overlay"]> {
    const variant = isTentative ? "tentative" : "approved";
    /* The tentative body's criteria list is mirrored in
    importantDatesFAQ.[tprDate|dtpDate].questions.toBeReleasedOnThisDate.content.
    If eligibility criteria change, update BOTH places so the overlay and FAQ stay in sync. */
    return {
      eyebrow: this.t(
        ($) => $.importantDates.overlay[approvalDateKey][variant].eyebrow,
      ),
      heading: this.t(
        ($) => $.importantDates.overlay[approvalDateKey][variant].heading,
        { replace: { [approvalDateKey]: date } },
      ),
      body: this.t(
        ($) => $.importantDates.overlay[approvalDateKey][variant].body,
        { replace: { csedLinkUrl: linkToDateSection("csedDate") } },
      ),
      linkText: this.t(($) => $.importantDates.overlay.overlayLinkText, {
        replace: { label: shortName },
      }),
      closeLabel: this.t(($) => $.importantDates.overlay.closeLabel),
    };
  }

  private buildCardCopy(
    entry: UsAzDisplayedDate,
    {
      approvalDateKey,
      isUpcoming,
      isPast,
      showTentativeCopy,
      linkUrl,
      shortName,
    }: {
      approvalDateKey: "tprDate" | "dtpDate" | undefined;
      isUpcoming: boolean;
      isPast: boolean;
      showTentativeCopy: boolean;
      linkUrl: string;
      shortName: string;
    },
  ): Pick<DateEntry, "title" | "value" | "info" | "goLink"> {
    const title = this.t(($) => $.importantDates.dates[entry.dateKey].title);

    const value =
      showTentativeCopy && approvalDateKey
        ? this.t(
            ($) => $.importantDates.dates[approvalDateKey].tentative.value,
            { replace: { [approvalDateKey]: entry.date } },
          )
        : this.t(($) => $.importantDates.dates[entry.dateKey].value, {
            replace: { [entry.dateKey]: entry.date },
          });

    // Body copy. Precedence: upcoming > past > tentative > default.
    let info: string;
    if (isUpcoming) {
      info = this.t(($) => $.importantDates.upcomingDateMessage, {
        replace: { linkUrl },
      });
    } else if (isPast) {
      info = this.t(($) => $.importantDates.pastDateMessage, {
        replace: { linkUrl },
      });
    } else if (showTentativeCopy && approvalDateKey) {
      info = this.t(
        ($) => $.importantDates.dates[approvalDateKey].tentative.info,
        { replace: { [approvalDateKey]: entry.date } },
      );
    } else if (approvalDateKey) {
      info = this.t(
        ($) => $.importantDates.dates[approvalDateKey].approved.info,
      );
    } else {
      const replace: Record<string, unknown> = { linkUrl };
      if (entry.dateKey === "tprDate") {
        replace["trLinkUrl"] = linkToDateSection("trToAddDate");
      }
      info = this.t(($) => $.importantDates.dates[entry.dateKey].info, {
        replace,
      });
    }

    const goLink = showTentativeCopy
      ? this.t(($) => $.importantDates.overlay.goLink)
      : this.t(($) => $.goLink, { replace: { label: shortName } });

    return { title, value, info, goLink };
  }

  get dateEntries(): DateEntry[] {
    // Sort by earliest date first
    const sortedEntries = this.displayedDates.toSorted((a, b) => {
      return a.date.getTime() - b.date.getTime();
    });

    // Add highlighting and upcoming logic
    const today = startOfDay(new Date());
    const thirtyOneDaysFromNow = new Date(today);
    thirtyOneDaysFromNow.setDate(today.getDate() + 31);

    return sortedEntries.map((entry) => {
      const entryDate = entry.date;
      const isUpcoming =
        entryDate >= today && entryDate <= thirtyOneDaysFromNow;
      const isPast = entryDate < today;
      const linkUrl = linkToDateSection(entry.dateKey);

      /* Approval state and the learn-more overlay only apply to TPR and DTP
      when the usAzFslImprovements flag is enabled; otherwise undefined. */
      const approvalDateKey =
        this.approval.usAzFslImprovements &&
        (entry.dateKey === "tprDate" || entry.dateKey === "dtpDate")
          ? entry.dateKey
          : undefined;

      let isTentative = false;
      if (approvalDateKey === "tprDate") {
        isTentative = !this.approval.isTprApproved;
      } else if (approvalDateKey === "dtpDate") {
        isTentative = !this.approval.isDtpApproved;
      }

      /* tentative copy is only shown for future dates that are > 30 days away. If this
      changes, make sure to update importantDates.dates.tprDate/dtpDate.tentative.info */
      const showTentativeCopy = isTentative && !isUpcoming && !isPast;

      let highlightType: CardHighlightStyle | undefined;
      if (isPast || entry.dateKey === "csbdDate" || isTentative) {
        highlightType = "dashed";
      } else if (entry.dateKey === "tprDate") {
        highlightType = "green";
      } else if (entry.dateKey === "dtpDate") {
        highlightType = "purple";
      }

      const showInfoTag = highlightType === "dashed" && !approvalDateKey;

      const shortName = this.t(
        ($) => $.importantDates.dates[entry.dateKey].shortName,
      );

      const cardCopy = this.buildCardCopy(entry, {
        approvalDateKey,
        isUpcoming,
        isPast,
        showTentativeCopy,
        linkUrl,
        shortName,
      });

      const overlay = approvalDateKey
        ? this.buildOverlayCopy({
            approvalDateKey,
            isTentative,
            date: entry.date,
            shortName,
          })
        : undefined;

      return {
        ...entry,
        isUpcoming,
        isPast,
        ...cardCopy,
        linkUrl,
        isTentative,
        highlightType,
        showInfoTag,
        overlay,
      };
    });
  }

  get hasNoDates(): boolean {
    return this.dateEntries.length === 0;
  }
}
