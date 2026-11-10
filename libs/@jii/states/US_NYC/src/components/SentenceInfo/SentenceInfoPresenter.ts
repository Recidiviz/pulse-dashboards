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

import type { UsNycResidentJiiData } from "~@jii/schemas";
import type { SentenceDatesData } from "~@jii/sentence-dates";
import type { UsNycTFunction } from "~@jii/translation";

export class SentenceInfoPresenter {
  constructor(
    private readonly stateSpecificData: UsNycResidentJiiData,
    private readonly t: UsNycTFunction,
  ) {
    makeAutoObservable(this, undefined, { autoBind: true });
  }

  get sentenceInfoData(): SentenceDatesData {
    return {
      dates: [
        {
          id: "projectedDischargeDate",
          date: this.stateSpecificData.projectedDischargeDate ?? undefined,
        },
        {
          id: "sentencedDate",
          date: this.stateSpecificData.sentencedDate ?? undefined,
        },
      ],
    };
  }

  get hasSentenceDate(): boolean {
    return this.stateSpecificData.sentencedDate != null;
  }

  get hasProjectedDischargeDate(): boolean {
    return this.stateSpecificData.projectedDischargeDate != null;
  }
}
