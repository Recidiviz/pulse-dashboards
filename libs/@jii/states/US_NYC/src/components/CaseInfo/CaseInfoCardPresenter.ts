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

import { firstNameLastName, ResidentRecord } from "~@jii/data";
import type { UsNycResidentJiiData } from "~@jii/schemas";

import type { CaseInfoData } from "./CaseInfoCard";

const COPY = {
  idTitle: "NYSID",
  legalStatusTitle: "Legal Status",
  housingFacilityTitle: "Housing Facility",
  unknownLegalStatus: "Unknown",
  unknownHousingFacility: "Not assigned yet",
  "Pre-sentence": "Pre-sentence",
  Sentenced: "Sentenced",
};

export class CaseInfoPresenter {
  constructor(
    private readonly resident: ResidentRecord,
    private readonly stateSpecificData: UsNycResidentJiiData,
  ) {
    makeAutoObservable(this, undefined, { autoBind: true });
  }

  get fullName(): string {
    return firstNameLastName(this.resident);
  }

  get personId(): string {
    return this.resident.displayId;
  }

  get legalStatus(): string {
    return this.stateSpecificData.legalStatus
      ? COPY[this.stateSpecificData.legalStatus]
      : COPY.unknownLegalStatus;
  }

  get housingFacility(): string {
    return (
      this.stateSpecificData.housingFacility ?? COPY.unknownHousingFacility
    );
  }

  get cardHeading(): string {
    return this.fullName;
  }

  get cardLabelValuePairs(): [CaseInfoData, CaseInfoData, CaseInfoData] {
    return [
      { label: COPY.idTitle, value: this.personId },
      { label: COPY.legalStatusTitle, value: this.legalStatus },
      { label: COPY.housingFacilityTitle, value: this.housingFacility },
    ];
  }
}
