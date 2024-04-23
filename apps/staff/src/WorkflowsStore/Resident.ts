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

import { PortionServedDates, WorkflowsResidentRecord } from "../FirestoreStore";
import { RootStore } from "../RootStore";
import tenants from "../tenants";
import { JusticeInvolvedPersonBase } from "./JusticeInvolvedPersonBase";
import {
  IncarcerationOpportunityType,
  Opportunity,
  OpportunityFactory,
  UsMeSCCPOpportunity,
} from "./Opportunity";
import { UsIdExpandedCRCOpportunity } from "./Opportunity/UsId";
import { UsIdCRCResidentWorkerOpportunity } from "./Opportunity/UsId/UsIdCRCResidentWorkerOpportunity/UsIdCRCResidentWorkerOpportunity";
import { UsIdCRCWorkReleaseOpportunity } from "./Opportunity/UsId/UsIdCRCWorkReleaseOpportunity";
import {
  UsMeFurloughReleaseOpportunity,
  UsMeWorkReleaseOpportunity,
} from "./Opportunity/UsMe";
import { UsMeAnnualReclassificationOpportunity } from "./Opportunity/UsMe/UsMeAnnualReclassificationOpportunity";
import { UsMeMediumTrusteeOpportunity } from "./Opportunity/UsMe/UsMeMediumTrusteeOpportunity";
import { usMiReclassificationRequestOpportunity } from "./Opportunity/UsMi/UsMiReclassificationRequestOpportunity";
import { usMiSecurityClassificationCommitteeReviewOpportunity } from "./Opportunity/UsMi/UsMiSecurityClassificationCommitteeReviewOpportunity";
import { UsMoOverdueRestrictiveHousingInitialHearingOpportunity } from "./Opportunity/UsMo/UsMoOverdueRestrictiveHousingInitialHearingOpportunity";
import { UsMoOverdueRestrictiveHousingReleaseOpportunity } from "./Opportunity/UsMo/UsMoOverdueRestrictiveHousingReleaseOpportunity";
import { UsMoOverdueRestrictiveHousingReviewHearingOpportunity } from "./Opportunity/UsMo/UsMoOverdueRestrictiveHousingReviewHearingOpportunity";
import { UsMoRestrictiveHousingStatusHearingOpportunity } from "./Opportunity/UsMo/UsMoRestrictiveHousingStatusHearingOpportunity";
import { UsTnCustodyLevelDowngradeOpportunity } from "./Opportunity/UsTn";
import { UsTnAnnualReclassificationReviewOpportunity } from "./Opportunity/UsTn/UsTnAnnualReclassificationReviewOpportunity/UsTnAnnualReclassificationReviewOpportunity";
import { fractionalDateBetweenTwoDates, optionalFieldToDate } from "./utils";

const residentialOpportunityConstructors: Record<
  IncarcerationOpportunityType,
  new (c: Resident) => Opportunity<Resident>
> = {
  usIdCRCResidentWorker: UsIdCRCResidentWorkerOpportunity,
  usIdCRCWorkRelease: UsIdCRCWorkReleaseOpportunity,
  usIdExpandedCRC: UsIdExpandedCRCOpportunity,
  usMeFurloughRelease: UsMeFurloughReleaseOpportunity,
  usMeMediumTrustee: UsMeMediumTrusteeOpportunity,
  usMeSCCP: UsMeSCCPOpportunity,
  usMeWorkRelease: UsMeWorkReleaseOpportunity,
  usMoRestrictiveHousingStatusHearing:
    UsMoRestrictiveHousingStatusHearingOpportunity,
  usTnCustodyLevelDowngrade: UsTnCustodyLevelDowngradeOpportunity,
  usTnAnnualReclassification: UsTnAnnualReclassificationReviewOpportunity,
  usMoOverdueRestrictiveHousingRelease:
    UsMoOverdueRestrictiveHousingReleaseOpportunity,
  usMoOverdueRestrictiveHousingInitialHearing:
    UsMoOverdueRestrictiveHousingInitialHearingOpportunity,
  usMoOverdueRestrictiveHousingReviewHearing:
    UsMoOverdueRestrictiveHousingReviewHearingOpportunity,
  usMeReclassificationReview: UsMeAnnualReclassificationOpportunity,
  usMiReclassificationRequest: usMiReclassificationRequestOpportunity,
  usMiSecurityClassificationCommitteeReview:
    usMiSecurityClassificationCommitteeReviewOpportunity,
};

const createResidentOpportunity: OpportunityFactory<
  IncarcerationOpportunityType,
  Resident
> = (type, person) => {
  return new residentialOpportunityConstructors[type](person);
};

export class Resident extends JusticeInvolvedPersonBase<WorkflowsResidentRecord> {
  constructor(record: WorkflowsResidentRecord, rootStore: RootStore) {
    super(record, rootStore, createResidentOpportunity);
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

  get sccpEligibilityDate(): Date | undefined {
    return optionalFieldToDate(this.record.sccpEligibilityDate);
  }

  get portionServedDates(): PortionServedDates {
    const startDate = optionalFieldToDate(this.record.admissionDate);
    const endDate = optionalFieldToDate(this.record.releaseDate);
    const halfTimeDate = fractionalDateBetweenTwoDates(startDate, endDate, 0.5);
    const twoThirdsTimeDate = fractionalDateBetweenTwoDates(
      startDate,
      endDate,
      2 / 3,
    );

    const opportunityDates: PortionServedDates = [];

    if (this.rootStore.currentTenantId === "US_ME") {
      opportunityDates.push({
        heading: "Half Time",
        date: halfTimeDate,
      });

      if (
        this.rootStore.workflowsStore.selectedResident?.portionServedNeeded ===
        "2/3"
      )
        opportunityDates.push({
          heading: "Two Thirds Time",
          date: twoThirdsTimeDate,
        });
    }

    return uniqBy(opportunityDates, "heading");
  }
}
