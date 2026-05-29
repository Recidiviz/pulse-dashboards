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
import { z } from "zod";

import { UsAzTFunction } from "~@jii/translation";

import { UsAzDisplayedDates } from "../UsAzSingleResidentContext/SingleResidentContextPresenter";
import { getInfoPageHashForDateKey, UsAzDateHash } from "../utils/utils";

const toggledPanelsSchema = z.record(z.string(), z.boolean().optional());
const toggledPanelsBySectionSchema = z.record(z.string(), toggledPanelsSchema);
export type ToggledPanels = z.output<typeof toggledPanelsSchema>;

/**
 * Manages information about the resident for the Important Dates FAQ page,
 * such as which view someone has selected (their own release dates or all release types)
 * and which release dates they have.
 *
 * View state -- whether the user is viewing their own dates or all dates, and
 * which accordion panels are open -- is stored in SessionStorage. This state is
 * not tracked within the presenter because we need it to persist even when the FAQ
 * component is unmounted and remounted (such as when the user clicks a hash/anchor
 * link, which causes the page to reload), which destroys and re-creates the presenter.
 * At the same time, we don't need it to persist across user sessions.
 */
export class ImportantDatesFAQPresenter {
  // Keys used for sessionStorage. These should not be accessed outside of the
  // presenter in order to ensure Mobx can track updates to these values -
  // use the presenter setters to change the stored settings.
  private static VIEWING_ALL_DATES_KEY = "azImportantDatesViewingAll";
  private static TOGGLED_PANELS_KEY = "azImportantDatesToggledPanels";

  private _isViewingAllDates: boolean;
  private _toggledPanelsBySection: Record<string, ToggledPanels>;

  // The hashes of all date sections, in the order that they should be displayed
  allDateHashes: UsAzDateHash[] = [
    "tprDate",
    "dtpDate",
    "csbdDate-trToAddDate",
    "ercdDate-addDate",
    "sedDate",
    "csedDate",
  ];

  // The hashes of the date sections that apply to this person
  personalDates: UsAzDateHash[];

  constructor(
    displayedDates: UsAzDisplayedDates,
    private t: UsAzTFunction,
    hash: UsAzDateHash,
  ) {
    try {
      const stored = sessionStorage.getItem(
        ImportantDatesFAQPresenter.TOGGLED_PANELS_KEY,
      );
      if (!stored) {
        this._toggledPanelsBySection = {};
      } else {
        this._toggledPanelsBySection = toggledPanelsBySectionSchema.parse(
          JSON.parse(stored),
        );
      }
    } catch {
      this._toggledPanelsBySection = {};
    }

    const displayedDateHashes = displayedDates.map(({ dateKey }) =>
      getInfoPageHashForDateKey(dateKey),
    );
    this.personalDates = this.allDateHashes.filter((hash) =>
      displayedDateHashes.includes(hash),
    );

    // Get whether the user is viewing All Dates or My Dates from session storage.
    // However, if the person has no dates, or if the requested hash is not visible
    // on this page but would be if we were viewing all date hashes (such as clicking on
    // a link from one of My Dates that leads to a section that isn't in My Dates),
    // switch the user over to view All Dates.
    this._isViewingAllDates = Boolean(
      sessionStorage.getItem(ImportantDatesFAQPresenter.VIEWING_ALL_DATES_KEY),
    );
    const noPersonalDates = this.personalDates.length === 0;
    const dateDoesNotApply =
      !this.personalDates.includes(hash) && this.allDateHashes.includes(hash);
    this.isViewingAllDates = // use the setter to update the persisted value
      this._isViewingAllDates || noPersonalDates || dateDoesNotApply;

    makeAutoObservable(this);
  }

  get isViewingAllDates() {
    return this._isViewingAllDates;
  }

  set isViewingAllDates(viewAll: boolean) {
    this._isViewingAllDates = viewAll;
    if (viewAll) {
      // Any truthy string works here
      sessionStorage.setItem(
        ImportantDatesFAQPresenter.VIEWING_ALL_DATES_KEY,
        "all",
      );
    } else {
      sessionStorage.removeItem(
        ImportantDatesFAQPresenter.VIEWING_ALL_DATES_KEY,
      );
    }
  }

  get toggledPanelsBySection(): Record<string, ToggledPanels> {
    return this._toggledPanelsBySection;
  }

  set toggledPanelsBySection(newPanels: Record<string, ToggledPanels>) {
    this._toggledPanelsBySection = newPanels;
    sessionStorage.setItem(
      ImportantDatesFAQPresenter.TOGGLED_PANELS_KEY,
      JSON.stringify(newPanels),
    );
  }

  get dateHashes(): UsAzDateHash[] {
    return this.isViewingAllDates ? this.allDateHashes : this.personalDates;
  }

  get nonDateSectionHashes(): string[] {
    return Object.keys(
      this.t(($) => $.importantDatesInfoPage.generalFAQ, {
        returnObjects: true,
      }),
    );
  }
}
