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

import { makeObservable } from "mobx";
import { format as formatPhone } from "phone-fns";

import {
  ClientRecord,
  ClientUpdateRecord,
  FullName,
  OpportunityType,
  subscribeToClientUpdates,
  updateCompliantReportingCompleted,
  updateCompliantReportingDenial,
} from "../firestore";
import type { RootStore } from "../RootStore";
import { toTitleCase } from "../utils";
import { OTHER_KEY } from "./PracticesStore";
import { observableSubscription, SubscriptionValue } from "./utils";

// these are the only values supported for now, limited to the Compliant Reporting flow
type SupervisionLevel = "Medium" | "Minimum";

const SUPERVISION_LEVEL_MAP: Record<string, SupervisionLevel> = {
  "STANDARD: MEDIUM": "Medium",
  "STANDARD: MINIMUM": "Minimum",
};

export class Client {
  rootStore: RootStore;

  id: string;

  stateCode: string;

  fullName: FullName;

  officerId: string;

  supervisionType: string;

  supervisionLevel: SupervisionLevel;

  supervisionLevelStart: Date;

  address: string;

  private rawPhoneNumber: string;

  expirationDate: Date;

  currentBalance: number;

  lastPaymentAmount?: number;

  lastPaymentDate?: Date;

  feeExemptions?: string;

  specialConditions: string;

  nextSpecialConditionsCheck?: Date;

  compliantReportingEligible?: {
    eligibleLevelStart: Date;
    currentOffenses: string[];
    lifetimeOffensesExpired: string[];
    judicialDistrict: string;
    drugScreensPastYear: { result: string; date: Date }[];
    sanctionsPastYear: { type: string }[];
    mostRecentArrestCheck?: Date;
  };

  private fetchedUpdates: SubscriptionValue<ClientUpdateRecord>;

  formIsPrinting = false;

  constructor(record: ClientRecord, rootStore: RootStore) {
    makeObservable(this, {
      formIsPrinting: true,
      setFormIsPrinting: true,
      printCurrentForm: true,
      currentUserEmail: true,
      eligibilityStatus: true,
      reviewStatus: true,
    });

    this.rootStore = rootStore;

    this.id = record.personExternalId;
    this.stateCode = record.stateCode;
    this.fullName = record.personName;
    this.officerId = record.officerId;
    this.supervisionType = toTitleCase(record.supervisionType);
    this.supervisionLevel = SUPERVISION_LEVEL_MAP[record.supervisionLevel];
    this.supervisionLevelStart = record.supervisionLevelStart.toDate();
    this.address = record.address;
    this.rawPhoneNumber = record.phoneNumber;
    this.expirationDate = record.expirationDate.toDate();
    this.currentBalance = record.currentBalance;
    this.lastPaymentDate = record.lastPaymentDate?.toDate();
    this.lastPaymentAmount = record.lastPaymentAmount;
    this.feeExemptions = record.feeExemptions;
    this.specialConditions = record.specialConditions;
    this.nextSpecialConditionsCheck = record.nextSpecialConditionsCheck?.toDate();

    const { compliantReportingEligible } = record;
    if (compliantReportingEligible) {
      this.compliantReportingEligible = {
        eligibleLevelStart: compliantReportingEligible.eligibleLevelStart.toDate(),
        currentOffenses: compliantReportingEligible.currentOffenses,
        lifetimeOffensesExpired:
          compliantReportingEligible.lifetimeOffensesExpired,
        judicialDistrict: compliantReportingEligible.judicialDistrict,
        drugScreensPastYear: compliantReportingEligible.drugScreensPastYear.map(
          ({ result, date }) => ({ result, date: date.toDate() })
        ),
        sanctionsPastYear:
          compliantReportingEligible.sanctionsPastYear.map((type) => ({
            type,
          })) || [],
        mostRecentArrestCheck: compliantReportingEligible.mostRecentArrestCheck?.toDate(),
      };
    }

    // connect to additional data sources for this client
    this.fetchedUpdates = observableSubscription((handler) =>
      subscribeToClientUpdates(this.id, (r) => {
        if (r) {
          handler(r);
        }
      })
    );
  }

  get displayName(): string {
    return toTitleCase(
      [this.fullName.givenNames, this.fullName.surname]
        .filter((n) => Boolean(n))
        .join(" ")
    );
  }

  get phoneNumber(): string {
    return formatPhone("(NNN) NNN-NNNN", this.rawPhoneNumber);
  }

  get updates(): ClientUpdateRecord | undefined {
    return this.fetchedUpdates.current();
  }

  get eligibilityStatus(): Record<OpportunityType, boolean> {
    const compliantReporting =
      (this.updates?.compliantReporting?.denial?.reasons?.length || 0) === 0;

    return {
      compliantReporting,
    };
  }

  get reviewStatus(): Record<OpportunityType, string> {
    let compliantReporting = "Needs referral";

    if (!this.eligibilityStatus.compliantReporting) {
      compliantReporting = "Currently ineligible";
    } else {
      const updates = this.updates?.compliantReporting;

      if (updates) {
        if (updates.completed) {
          compliantReporting = "Referral form complete";
        } else {
          compliantReporting = "Referral in progress";
        }
      }
    }

    return { compliantReporting };
  }

  get currentUserEmail(): string | null | undefined {
    return this.rootStore.practicesStore.user?.info.email;
  }

  async setCompliantReportingDenialReasons(reasons: string[]): Promise<void> {
    if (this.currentUserEmail) {
      // clear irrelevant "other" text if necessary
      const deletions = reasons.includes(OTHER_KEY)
        ? undefined
        : { otherReason: true };

      await Promise.all([
        updateCompliantReportingDenial(
          this.currentUserEmail,
          this.id,
          { reasons },
          deletions
        ),
        updateCompliantReportingCompleted(this.currentUserEmail, this.id, true),
      ]);
    }
  }

  async setCompliantReportingDenialOtherReason(
    otherReason?: string
  ): Promise<void> {
    if (this.currentUserEmail) {
      await updateCompliantReportingDenial(this.currentUserEmail, this.id, {
        otherReason,
      });
    }
  }

  setFormIsPrinting(value: boolean): void {
    this.formIsPrinting = value;
  }

  printCurrentForm(): void {
    if (this.currentUserEmail) {
      if (this.eligibilityStatus.compliantReporting) {
        updateCompliantReportingCompleted(this.currentUserEmail, this.id);
      }

      this.setFormIsPrinting(true);
    }
  }
}
