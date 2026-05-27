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
import { ResidentRecord, UsNdResidentMetadata } from "~datatypes";

import { dateIdEnum, isUnavailableDateId } from "./types";

export class ResidentHomepagePresenter {
  constructor(
    private residentData: UsNdResidentMetadata,
    private residentRecord: ResidentRecord,
  ) {
    makeAutoObservable(this);
  }

  get sentenceDatesData(): SentenceDatesData {
    return {
      // these are in a fixed order and should not be sorted by date
      dates: dateIdEnum.options.map((id) => ({
        id,
        // this suppresses the data itself for the "unavailable" dates
        // but there will also be some UI overrides on top of this
        date: isUnavailableDateId(id)
          ? undefined
          : this.residentData[`${id}Date`],
      })),
    };
  }

  get lastUpdatedDate() {
    return this.residentData.lastUpdatedDate;
  }

  get isOSUResident() {
    return this.residentRecord.unitId?.startsWith("NDSP-ORU");
  }
}
