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

import { makeObservable, override } from "mobx";
import { format as formatPhone } from "phone-fns";

import { ClientRecord, SpecialConditionCode } from "../firestore";
import type { RootStore } from "../RootStore";
import { JusticeInvolvedPersonBase } from "./JusticeInvolvedPersonBase";
import {
  CompliantReportingOpportunity,
  EarlyTerminationOpportunity,
  EarnedDischargeOpportunity,
  LSUOpportunity,
  Opportunity,
  OpportunityFactory,
  PastFTRDOpportunity,
  SupervisionOpportunityType,
  UsTnExpirationOpportunity,
  UsTnSupervisionLevelDowngradeOpportunity,
} from "./Opportunity";
import { UsIdSupervisionLevelDowngradeOpportunity } from "./Opportunity/UsIdSupervisionLevelDowngradeOpportunity";
import { optionalFieldToDate } from "./utils";

export const UNKNOWN = "Unknown" as const;

type ClientDetailsCopy = {
  supervisionStartDate?: {
    tooltip: string;
  };
};

export const CLIENT_DETAILS_COPY: Record<string, ClientDetailsCopy> = {
  US_ND: {
    supervisionStartDate: {
      tooltip:
        "This date is included in the filled form as the date that the Defendant was sentenced; in rare cases, the sentencing date and supervision start date may differ. Double check the date in the form to ensure that the sentencing date and supervision start date match in this case.",
    },
  },
};

const supervisionOpportunityConstructors: Record<
  SupervisionOpportunityType,
  new (c: Client) => Opportunity<Client>
> = {
  compliantReporting: CompliantReportingOpportunity,
  earlyTermination: EarlyTerminationOpportunity,
  earnedDischarge: EarnedDischargeOpportunity,
  LSU: LSUOpportunity,
  pastFTRD: PastFTRDOpportunity,
  supervisionLevelDowngrade: UsTnSupervisionLevelDowngradeOpportunity,
  usIdSupervisionLevelDowngrade: UsIdSupervisionLevelDowngradeOpportunity,
  usTnExpiration: UsTnExpirationOpportunity,
};

export const createClientOpportunity: OpportunityFactory<
  SupervisionOpportunityType,
  Client
> = (type, person): Opportunity => {
  if (person instanceof Client) {
    return new supervisionOpportunityConstructors[type](person);
  }
  throw new Error("Unsupported opportunity");
};

/**
 * Represents a person on supervision
 */
export class Client extends JusticeInvolvedPersonBase<ClientRecord> {
  rootStore: RootStore;

  supervisionType!: string;

  supervisionLevelStart?: Date;

  address!: string;

  private rawPhoneNumber?: string;

  expirationDate?: Date;

  supervisionStartDate?: Date;

  currentBalance?: number;

  lastPaymentAmount?: number;

  lastPaymentDate?: Date;

  probationSpecialConditions?: string[];

  paroleSpecialConditions?: SpecialConditionCode[];

  constructor(record: ClientRecord, rootStore: RootStore) {
    super(record, rootStore, createClientOpportunity);
    makeObservable(this, {
      supervisionLevel: true,
      updateRecord: override,
    });

    this.rootStore = rootStore;

    this.updateRecord(record);
  }

  updateRecord(record: ClientRecord): void {
    super.updateRecord(record);
    this.supervisionType = record.supervisionType;
    this.supervisionLevelStart = optionalFieldToDate(
      record.supervisionLevelStart
    );
    this.address = record.address || UNKNOWN;
    this.rawPhoneNumber = record.phoneNumber;
    this.expirationDate = optionalFieldToDate(record.expirationDate);
    this.currentBalance = record.currentBalance;
    this.lastPaymentDate = optionalFieldToDate(record.lastPaymentDate);
    this.lastPaymentAmount = record.lastPaymentAmount;
    this.probationSpecialConditions = record.specialConditions;
    this.paroleSpecialConditions = record.boardConditions ?? [];
    this.supervisionStartDate = optionalFieldToDate(
      record.supervisionStartDate
    );
  }

  get supervisionLevel(): string {
    return this.rootStore.workflowsStore.formatSupervisionLevel(
      this.record.supervisionLevel
    );
  }

  get formattedPhoneNumber(): string | undefined {
    return this.rawPhoneNumber
      ? formatPhone("(NNN) NNN-NNNN", this.rawPhoneNumber)
      : undefined;
  }

  get phoneNumber(): string {
    return this.formattedPhoneNumber || UNKNOWN;
  }

  get officerDistrict(): string | undefined {
    const officer = this.rootStore.workflowsStore?.availableOfficers.find(
      (o) => o.id === this.assignedStaffId
    );
    return officer?.district;
  }

  get detailsCopy(): ClientDetailsCopy {
    return CLIENT_DETAILS_COPY[this.stateCode];
  }
}
