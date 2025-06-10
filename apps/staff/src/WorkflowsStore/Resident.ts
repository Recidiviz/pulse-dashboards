// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { addYears } from "date-fns";
import { uniqBy } from "lodash";

import { ResidentRecord } from "~datatypes";

import { workflowsUrl } from "../core/views";
import { PortionServedDates } from "../FirestoreStore";
import { JusticeInvolvedPersonBase } from "./JusticeInvolvedPersonBase";
import { PersonType } from "./types";
import { fractionalDateBetweenTwoDates } from "./utils";

const LIFE_SENTENCE_THRESHOLD = addYears(new Date(), 200);

export class Resident extends JusticeInvolvedPersonBase<ResidentRecord> {
  get profileUrl(): string {
    return workflowsUrl("residentProfile", {
      justiceInvolvedPersonId: this.pseudonymizedId,
    });
  }

  get facilityId(): string | undefined {
    return this.record.facilityId ?? undefined;
  }

  get gender(): string | undefined {
    return this.record.gender;
  }

  get unitId(): string | undefined {
    return this.record.unitId ?? undefined;
  }

  get custodyLevel(): string | undefined {
    return this.record.custodyLevel ?? undefined;
  }

  get displayCustodyLevel(): string {
    if (this.stateCode === "US_AZ") {
      if (
        !this.custodyLevel ||
        this.custodyLevel === "INTERNAL_UNKNOWN" ||
        this.custodyLevel === "EXTERNAL_UNKNOWN"
      ) {
        return "UNKNOWN CUSTODY LEVEL";
      } else {
        return `${this.custodyLevel.replace("_", " ")} CUSTODY`;
      }
    }

    return this.custodyLevel ?? "";
  }

  get admissionDate(): Date | undefined {
    return this.record.admissionDate;
  }

  get releaseDate(): Date | undefined {
    return this.record.releaseDate;
  }

  get onLifeSentence(): boolean | undefined {
    const { releaseDate } = this.record;
    if (!releaseDate) return;

    return new Date(releaseDate) > LIFE_SENTENCE_THRESHOLD;
  }

  get systemConfig() {
    return this.rootStore.workflowsStore.systemConfigFor("INCARCERATION");
  }

  get sccpEligibilityDate(): Date | undefined {
    if (this.record.metadata.stateCode !== "US_ME") {
      return;
    }

    return this.record.metadata.sccpEligibilityDate;
  }

  get usTnFacilityAdmissionDate(): Date | undefined {
    return this.record.usTnFacilityAdmissionDate;
  }

  get metadata() {
    return this.record.metadata;
  }

  get portionServedDates(): PortionServedDates {
    if (this.onLifeSentence) return [];

    const startDate = this.record.admissionDate;
    const endDate = this.record.releaseDate;
    const halfTimeDate = fractionalDateBetweenTwoDates(startDate, endDate, 0.5);
    const twoThirdsTimeDate = fractionalDateBetweenTwoDates(
      startDate,
      endDate,
      2 / 3,
    );

    const opportunityDates: PortionServedDates = [];

    if (this.metadata.stateCode === "US_ME") {
      opportunityDates.push({
        heading: "Half Time",
        date: halfTimeDate,
      });

      if (this.metadata.portionServedNeeded === "2/3")
        opportunityDates.push({
          heading: "Two Thirds Time",
          date: twoThirdsTimeDate,
        });
    }

    return uniqBy(opportunityDates, "heading");
  }

  get personType(): PersonType {
    return this.record.personType;
  }
}
