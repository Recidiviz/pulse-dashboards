// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import { uniqBy } from "lodash";

import { PortionServedDates, ResidentRecord } from "../FirestoreStore";
import { RootStore } from "../RootStore";
import tenants from "../tenants";
import { JusticeInvolvedPersonBase } from "./JusticeInvolvedPersonBase";
import {
  IncarcerationOpportunityType,
  Opportunity,
  OpportunityFactory,
  UsMeSCCPOpportunity,
  UsMoRestrictiveHousingStatusHearingOpportunity,
} from "./Opportunity";
import { UsIdExpandedCRCOpportunity } from "./Opportunity/UsId";
import { UsIdCRCResidentWorkerOpportunity } from "./Opportunity/UsId/UsIdCRCResidentWorkerOpportunity/UsIdCRCResidentWorkerOpportunity";
import { UsIdCRCWorkReleaseOpportunity } from "./Opportunity/UsId/UsIdCRCWorkReleaseOpportunity";
import {
  UsMeFurloughReleaseOpportunity,
  UsMeWorkReleaseOpportunity,
} from "./Opportunity/UsMe";
import { UsTnCustodyLevelDowngradeOpportunity } from "./Opportunity/UsTn";
import { fractionalDateBetweenTwoDates, optionalFieldToDate } from "./utils";

const residentialOpportunityConstructors: Record<
  IncarcerationOpportunityType,
  new (c: Resident) => Opportunity<Resident>
> = {
  usIdCRCResidentWorker: UsIdCRCResidentWorkerOpportunity,
  usIdCRCWorkRelease: UsIdCRCWorkReleaseOpportunity,
  usIdExpandedCRC: UsIdExpandedCRCOpportunity,
  usMeFurloughRelease: UsMeFurloughReleaseOpportunity,
  usMeSCCP: UsMeSCCPOpportunity,
  usMeWorkRelease: UsMeWorkReleaseOpportunity,
  usMoRestrictiveHousingStatusHearing:
    UsMoRestrictiveHousingStatusHearingOpportunity,
  usTnCustodyLevelDowngrade: UsTnCustodyLevelDowngradeOpportunity,
};

const createResidentOpportunity: OpportunityFactory<
  IncarcerationOpportunityType,
  Resident
> = (type, person) => {
  return new residentialOpportunityConstructors[type](person);
};

export class Resident extends JusticeInvolvedPersonBase<ResidentRecord> {
  constructor(record: ResidentRecord, rootStore: RootStore) {
    super(record, rootStore, createResidentOpportunity);
  }

  get facilityId(): string | undefined {
    return this.record.facilityId;
  }

  get unitId(): string | undefined {
    return this.record.unitId;
  }

  get custodyLevel(): string | undefined {
    return this.record.custodyLevel;
  }

  get admissionDate(): Date | undefined {
    return optionalFieldToDate(this.record.admissionDate);
  }

  get releaseDate(): Date | undefined {
    return optionalFieldToDate(this.record.releaseDate);
  }

  get searchIdValue(): any {
    const { currentTenantId } = this.rootStore;
    const searchField =
      currentTenantId &&
      tenants[currentTenantId]?.workflowsSystemConfigs?.INCARCERATION
        ?.searchField;

    return searchField ? this.record[searchField] : this.assignedStaffId;
  }

  get portionServedNeeded(): string | undefined {
    return this.record.portionServedNeeded;
  }

  get portionServedDates(): PortionServedDates {
    const startDate = optionalFieldToDate(this.record.admissionDate);
    const endDate = optionalFieldToDate(this.record.releaseDate);
    const halfTimeDate = fractionalDateBetweenTwoDates(startDate, endDate, 0.5);
    const twoThirdsTimeDate = fractionalDateBetweenTwoDates(
      startDate,
      endDate,
      2 / 3
    );

    const opportunityDates: PortionServedDates = [];

    if (this.rootStore.currentTenantId === "US_ME") {
      opportunityDates.push({
        heading: "Half Time",
        date: halfTimeDate,
      });
    }

    const opportunities = Object.values(
      this.rootStore.workflowsStore.selectedPerson?.verifiedOpportunities || {}
    );

    opportunities.forEach((opp) => {
      if ("portionServedRequirement" in opp) {
        const onProfilePageOrOppIsSelected =
          this.rootStore.workflowsStore.selectedOpportunityType === undefined ||
          this.rootStore.workflowsStore.selectedOpportunityType === opp.type;
        if (onProfilePageOrOppIsSelected) {
          if (opp.type === "usMeSCCP") {
            if (
              this.rootStore.workflowsStore.selectedResident
                ?.portionServedNeeded === "2/3"
            )
              opportunityDates.push({
                heading: "Two Thirds Time",
                date: twoThirdsTimeDate,
              });
          }
        }
      }
    });

    return uniqBy(opportunityDates, "heading");
  }
}
