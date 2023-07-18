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

import { ResidentRecord } from "../FirestoreStore";
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
import { UsMeFurloughReleaseOpportunity } from "./Opportunity/UsMeFurloughReleaseOpportunity";
import { UsMeWorkReleaseOpportunity } from "./Opportunity/UsMeWorkReleaseOpportunity";
import { UsTnCustodyLevelDowngradeOpportunity } from "./Opportunity/UsTnCustodyLevelDowngradeOpportunity";
import { optionalFieldToDate } from "./utils";

const residentialOpportunityConstructors: Record<
  IncarcerationOpportunityType,
  new (c: Resident) => Opportunity<Resident>
> = {
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
}
