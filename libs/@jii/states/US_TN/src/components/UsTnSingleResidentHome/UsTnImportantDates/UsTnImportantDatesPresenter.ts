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

import { differenceInDays } from "date-fns";

import { UsTnResidentJiiData } from "~datatypes";

export class UsTnImportantDatesPresenter {
  constructor(public readonly residentData: UsTnResidentJiiData) {}

  get expirationDateReduced(): boolean {
    const { residentData } = this;
    if (residentData.stateCode !== "US_TN") return false;
    if (!residentData.expirationDate || !residentData.expirationDateOriginal)
      return false;

    return residentData.expirationDateOriginal > residentData.expirationDate;
  }

  get expirationDateReduction(): string {
    const { residentData } = this;
    if (residentData.stateCode !== "US_TN") return "";
    if (!residentData.expirationDate || !residentData.expirationDateOriginal)
      return "";

    // TODO(#9283):[JII][TN] Move copy into a central location
    return `${differenceInDays(
      residentData.expirationDateOriginal,
      residentData.expirationDate,
    )} days`;
  }
}
