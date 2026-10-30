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

import { makeAutoObservable } from "mobx";

import { ResidentFlags } from "~@jii/data";
import { State } from "~@jii/paths";
import { UsArResidentJiiData } from "~@jii/schemas";
import { UsArTFunction } from "~@jii/translation";

import { DateInfoProps } from "./DateInfoCard";

/**
 * Returns the path to a section of the Understanding Release Dates page. The
 * section ids are set on headings in the page copy (importantDates.moreInfo.body
 * and protectAct.moreInfo.body), so keep them in sync.
 */
function linkToDatesPageSection(sectionId: "goodTime" | "programming") {
  return `${State.Resident.$.UsArMoreInformation.ImportantDates.buildRelativePath({})}#${sectionId}`;
}

export class UsArImportantDatesPresenter {
  constructor(
    private metadata: UsArResidentJiiData,
    private residentFlags: ResidentFlags,
    private t: UsArTFunction,
  ) {
    makeAutoObservable(this, undefined, { autoBind: true });
  }

  get dateEntries(): DateInfoProps[] {
    return [this.eligibilityDateEntry, this.maximumReleaseDateEntry];
  }

  private get programUnitsText(): string | undefined {
    const { metadata, t } = this;
    return this.residentFlags.usArMaxCpus &&
      metadata.maxCpus && // hide if null or 0
      metadata.eligibilityDateName === "Release Eligibility Date"
      ? t(
          ($) =>
            $.importantDates.eligibilityDate.card["Release Eligibility Date"]
              .programUnitsRequired,
          { count: metadata.maxCpus },
        )
      : undefined;
  }

  private get eligibilityDateEntry(): DateInfoProps {
    const { metadata, t } = this;
    return {
      date: metadata.eligibilityDate,
      // TODO(JII2-128): move the label into card
      label: t(
        ($) =>
          $.importantDates.eligibilityDate.labels[metadata.eligibilityDateName],
      ),
      description: this.programUnitsText
        ? `${this.eligibilityDescription} ${this.programUnitsText}`
        : this.eligibilityDescription,
      overlays: this.overlays,
    };
  }

  private get maximumReleaseDateEntry(): DateInfoProps {
    const { metadata, t } = this;
    return {
      date: metadata.maximumReleaseDate,
      label: t(($) => $.importantDates.maximumReleaseDate.label),
      description: t(($) => $.importantDates.maximumReleaseDate.description),
    };
  }

  // TODO(JII2-128): simplify after launch
  private get eligibilityDescription(): string {
    const { metadata, t } = this;
    return this.residentFlags.usArEdovoCredits
      ? t(
          ($) =>
            $.importantDates.eligibilityDate.card[metadata.eligibilityDateName]
              .description,
        )
      : t(
          ($) =>
            $.importantDates.eligibilityDate.description[
              metadata.eligibilityDateName
            ],
        );
  }

  private get overlays(): DateInfoProps["overlays"] {
    const { metadata, t } = this;
    if (!this.residentFlags.usArEdovoCredits) return undefined;

    const programmingOverlay = t(
      ($) =>
        $.importantDates.eligibilityDate.card[metadata.eligibilityDateName]
          .programmingOverlay,
      { returnObjects: true },
    );

    return [
      {
        id: "goodTime",
        overlayLinkUrl: linkToDatesPageSection("goodTime"),
        openOverlayLabel: t(
          ($) => $.importantDates.eligibilityDate.card.goodTimeLink,
        ),
        ...t(
          ($) =>
            $.importantDates.eligibilityDate.card[metadata.eligibilityDateName]
              .goodTimeOverlay,
          { returnObjects: true },
        ),
      },
      {
        id: "programming",
        overlayLinkUrl: linkToDatesPageSection("programming"),
        openOverlayLabel: t(
          ($) => $.importantDates.eligibilityDate.card.programmingLink,
        ),
        ...programmingOverlay,
        body: this.programUnitsText
          ? `${this.programUnitsText}\n\n${programmingOverlay.body}`
          : programmingOverlay.body,
      },
    ];
  }
}
