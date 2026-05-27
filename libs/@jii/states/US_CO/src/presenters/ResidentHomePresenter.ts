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

import { SentenceDatesData } from "~@jii/sentence-dates";
import { UsCoResidentMetadata } from "~datatypes";

export class ResidentHomePresenter {
  constructor(private residentData: UsCoResidentMetadata) {
    makeAutoObservable(this);
  }

  get sentenceDatesData(): SentenceDatesData {
    // these are in a fixed order and should not be sorted by date
    const dateIds = ["mrdTent", "pedTent"] as const;

    return {
      dates: dateIds.map((id) => ({
        id,
        date: this.residentData[id],
      })),
    };
  }

  get lastUpdatedDate() {
    return this.residentData.lastUpdatedDate ?? undefined;
  }
}
