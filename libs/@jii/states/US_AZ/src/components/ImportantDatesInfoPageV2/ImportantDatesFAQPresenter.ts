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

import { UsAzTFunction } from "~@jii/translation";

import { UsAzDisplayedDates } from "../UsAzSingleResidentContext/SingleResidentContextPresenter";
import { getInfoPageHashForDateKey, UsAzDateHash } from "../utils/utils";

/**
 * Manages information about the resident for the Important Dates FAQ page,
 * such as which view someone has selected (their own release dates or all release types)
 * and which release dates they have.
 */
export class ImportantDatesFAQPresenter {
  isViewingAllDates = false;

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
  ) {
    const displayedDateHashes = displayedDates.map(({ dateKey }) =>
      getInfoPageHashForDateKey(dateKey),
    );
    this.personalDates = this.allDateHashes.filter((hash) =>
      displayedDateHashes.includes(hash),
    );

    makeAutoObservable(this);
  }

  showAllDates() {
    this.isViewingAllDates = true;
  }

  showPersonalDates() {
    this.isViewingAllDates = false;
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
