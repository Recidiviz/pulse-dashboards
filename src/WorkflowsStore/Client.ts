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

import { mapValues, toUpper } from "lodash";
import { makeObservable, override } from "mobx";
import { format as formatPhone } from "phone-fns";

import {
  ClientEmployer,
  ClientRecord,
  Milestone,
  SpecialConditionCode,
} from "../FirestoreStore";
import type { RootStore } from "../RootStore";
import tenants from "../tenants";
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
  UsMeEarlyTerminationOpportunity,
  UsTnExpirationOpportunity,
  UsTnSupervisionLevelDowngradeOpportunity,
} from "./Opportunity";
import { UsIdSupervisionLevelDowngradeOpportunity } from "./Opportunity/UsIdSupervisionLevelDowngradeOpportunity";
import { UsMiClassificationReviewOpportunity } from "./Opportunity/UsMiClassificationReviewOpportunity";
import { UsMiEarlyDischargeOpportunity } from "./Opportunity/UsMiEarlyDischargeOpportunity";
import { SupervisionTaskInterface } from "./Task/types";
import { UsIdSupervisionTasks } from "./Task/UsIdSupervisionTasks";
import { JusticeInvolvedPerson } from "./types";
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
  usMiClassificationReview: UsMiClassificationReviewOpportunity,
  usMiEarlyDischarge: UsMiEarlyDischargeOpportunity,
  usTnExpiration: UsTnExpirationOpportunity,
  usMeEarlyTermination: UsMeEarlyTerminationOpportunity,
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

export type TaskFactory<PersonType extends JusticeInvolvedPerson> = (
  person: PersonType
) => SupervisionTaskInterface | undefined;

const createClientSupervisionTasks: TaskFactory<Client> = (
  person
): SupervisionTaskInterface | undefined => {
  const { allowSupervisionTasks } = person.rootStore.workflowsStore;
  if (person instanceof Client && allowSupervisionTasks) {
    return new UsIdSupervisionTasks(person);
  }
};

// TODO(#1735): the real type should be cleaner than this
export type ParsedSpecialCondition = {
  // eslint-disable-next-line camelcase
  note_update_date: string;
  // eslint-disable-next-line camelcase
  conditions_on_date: string | null;
};

export type ParsedSpecialConditionOrString =
  | NonNullable<ParsedSpecialCondition>
  | string;

/**
 * Represents a person on supervision
 */
export class Client extends JusticeInvolvedPersonBase<ClientRecord> {
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

  currentEmployers?: ClientEmployer[];

  milestones?: Milestone[];

  emailAddress?: string;

  constructor(record: ClientRecord, rootStore: RootStore) {
    super(
      record,
      rootStore,
      createClientOpportunity,
      createClientSupervisionTasks
    );
    makeObservable(this, {
      supervisionLevel: true,
      updateRecord: override,
    });

    this.updateRecord(record);
  }

  updateRecord(record: ClientRecord): void {
    super.updateRecord(record);
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
    this.currentEmployers = record.currentEmployers;
    this.milestones = record.milestones;
    this.emailAddress = record.emailAddress;
  }

  get supervisionType(): string {
    const { supervisionType } = this.record;

    return supervisionType === "INTERNAL_UNKNOWN" ? "Unknown" : supervisionType;
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

  get detailsCopy(): ClientDetailsCopy {
    return CLIENT_DETAILS_COPY[this.stateCode];
  }

  get formattedProbationSpecialConditions(): ParsedSpecialConditionOrString[] {
    // we will flatten the nested lists of conditions into this
    const conditionsToDisplay: ParsedSpecialConditionOrString[] = [];

    // TODO(#1735): after data/ETL change we should expect structured data
    // rather than a JSON-ish string
    this.probationSpecialConditions?.forEach((conditionsJson) => {
      try {
        const conditionsForSentence: {
          // eslint-disable-next-line camelcase
          note_update_date: string;
          // eslint-disable-next-line camelcase
          conditions_on_date: string | null;
        }[] = JSON.parse(
          // the specialConditions strings are almost valid JSON,
          // except they may include NULL instead of null as a value;
          // work around this by converting to lowercase
          conditionsJson.toLowerCase()
        );

        conditionsForSentence.forEach(
          // eslint-disable-next-line camelcase
          ({ note_update_date, conditions_on_date }) => {
            // don't display nulls
            // eslint-disable-next-line camelcase
            if (!conditions_on_date) return;

            // note that we have to convert the actual values back to uppercase
            // to display them properly
            conditionsToDisplay.push(
              // eslint-disable-next-line camelcase
              mapValues({ note_update_date, conditions_on_date }, toUpper)
            );
          }
        );
      } catch (e) {
        // if we couldn't hack our way to valid JSON,
        // display the whole ugly string so there's no data loss
        conditionsToDisplay.push(conditionsJson);
      }
    });
    return conditionsToDisplay;
  }

  get searchIdValue(): any {
    const { currentTenantId } = this.rootStore;
    const searchField =
      currentTenantId &&
      tenants[currentTenantId]?.workflowsSystemConfigs?.SUPERVISION
        ?.searchField;

    return searchField ? this.record[searchField] : this.assignedStaffId;
  }
}
