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

import { parseISO } from "date-fns";
import { Timestamp } from "firebase/firestore";
import { has } from "lodash";
import { action, computed, keys, makeObservable, observable, set } from "mobx";
import { format as formatPhone } from "phone-fns";

import { trackReferralFormPrinted } from "../analytics";
import { transform } from "../core/Paperwork/US_TN/Transformer";
import {
  ClientRecord,
  ClientUpdateRecord,
  CompliantReportingReferralForm,
  FullName,
  OpportunityType,
  subscribeToClientUpdates,
  subscribeToCompliantReportingReferral,
  updateCompliantReportingCompleted,
  updateCompliantReportingDenial,
} from "../firestore";
import type { RootStore } from "../RootStore";
import {
  CompliantReportingReferralRecord,
  TransformedCompliantReportingReferral,
} from "./CompliantReportingReferralRecord";
import { OTHER_KEY } from "./PracticesStore";
import { observableSubscription, SubscriptionValue } from "./utils";

export const UNKNOWN = "Unknown" as const;

// these are the only values supported for now, limited to the Compliant Reporting flow
type SupervisionLevel = "Medium" | "Minimum" | typeof UNKNOWN;

const SUPERVISION_LEVEL_MAP: Record<string, SupervisionLevel> = {
  "STANDARD: MEDIUM": "Medium",
  "STANDARD: MINIMUM": "Minimum",
};

function fieldToDate(field: Timestamp | string): Date {
  if (typeof field === "string") {
    return parseISO(field);
  }
  return field.toDate();
}

function optionalFieldToDate(field?: Timestamp | string): Date | undefined {
  if (field) return fieldToDate(field);
}

export class Client {
  rootStore: RootStore;

  id: string;

  stateCode: string;

  fullName: FullName;

  officerId: string;

  supervisionType: string;

  supervisionLevel: SupervisionLevel;

  supervisionLevelStart?: Date;

  address: string;

  private rawPhoneNumber?: string;

  expirationDate?: Date;

  currentBalance: number;

  lastPaymentAmount?: number;

  lastPaymentDate?: Date;

  feeExemptions?: string;

  specialConditions: string[];

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

  compliantReportingReferralDraftData: Partial<TransformedCompliantReportingReferral>;

  private fetchedCompliantReportingReferral: SubscriptionValue<CompliantReportingReferralRecord>;

  constructor(record: ClientRecord, rootStore: RootStore) {
    makeObservable(this, {
      formIsPrinting: true,
      setFormIsPrinting: true,
      printCompliantReportingReferralForm: true,
      currentUserEmail: true,
      eligibilityStatus: true,
      reviewStatus: true,
      compliantReportingReferralDraftData: true,
      setCompliantReportingReferralDataField: action,
      compliantReportingReferralFormData: computed.struct,
    });

    this.rootStore = rootStore;

    this.id = record.personExternalId;
    this.stateCode = record.stateCode;
    this.fullName = record.personName;
    this.officerId = record.officerId;
    this.supervisionType = record.supervisionType;
    this.supervisionLevel = record.supervisionLevel
      ? SUPERVISION_LEVEL_MAP[record.supervisionLevel]
      : UNKNOWN;
    this.supervisionLevelStart = optionalFieldToDate(
      record.supervisionLevelStart
    );
    this.address = record.address || UNKNOWN;
    this.rawPhoneNumber = record.phoneNumber;
    this.expirationDate = optionalFieldToDate(record.expirationDate);
    this.currentBalance = record.currentBalance;
    this.lastPaymentDate = optionalFieldToDate(record.lastPaymentDate);
    this.lastPaymentAmount = record.lastPaymentAmount;
    this.feeExemptions = record.feeExemptions;
    this.specialConditions = record.specialConditions;
    this.nextSpecialConditionsCheck = optionalFieldToDate(
      record.nextSpecialConditionsCheck
    );
    this.compliantReportingReferralDraftData = observable<
      Partial<TransformedCompliantReportingReferral>
    >({});

    const { compliantReportingEligible } = record;
    if (compliantReportingEligible) {
      this.compliantReportingEligible = {
        eligibleLevelStart: fieldToDate(
          compliantReportingEligible.eligibleLevelStart
        ),
        currentOffenses: compliantReportingEligible.currentOffenses,
        lifetimeOffensesExpired:
          compliantReportingEligible.lifetimeOffensesExpired,
        judicialDistrict:
          compliantReportingEligible.judicialDistrict ?? UNKNOWN,
        drugScreensPastYear: compliantReportingEligible.drugScreensPastYear.map(
          ({ result, date }) => ({ result, date: fieldToDate(date) })
        ),
        sanctionsPastYear:
          compliantReportingEligible.sanctionsPastYear.map((type) => ({
            type,
          })) || [],
        mostRecentArrestCheck: optionalFieldToDate(
          compliantReportingEligible.mostRecentArrestCheck
        ),
      };
    }

    // connect to additional data sources for this client
    this.fetchedUpdates = observableSubscription((handler) =>
      subscribeToClientUpdates(this.id, (r) => {
        if (r) {
          handler(r);
          const data = r.compliantReporting?.referralForm?.data ?? {};

          set(this.compliantReportingReferralDraftData, data);
        }
      })
    );

    this.fetchedCompliantReportingReferral = observableSubscription((handler) =>
      subscribeToCompliantReportingReferral(this.id, (result) => {
        if (result) handler(result);
      })
    );
  }

  get displayName(): string {
    return [this.fullName.givenNames, this.fullName.surname]
      .filter((n) => Boolean(n))
      .join(" ");
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
    const officer = this.rootStore.practicesStore?.availableOfficers.find(
      (o) => o.id === this.officerId
    );
    return officer?.district;
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

  get currentUserName(): string | null | undefined {
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

  printCompliantReportingReferralForm(): void {
    if (this.currentUserEmail) {
      if (this.eligibilityStatus.compliantReporting) {
        updateCompliantReportingCompleted(this.currentUserEmail, this.id);
      }

      this.setFormIsPrinting(true);
      trackReferralFormPrinted({
        formType: "compliantReportingReferral",
        district: this.officerDistrict,
        eligibilityStatus: this.eligibilityStatus,
        denialReasons: this.updates?.compliantReporting?.denial?.reasons,
        otherReason: this.updates?.compliantReporting?.denial?.otherReason,
      });
    }
  }

  get compliantReportingReferralFormData(): Partial<TransformedCompliantReportingReferral> {
    // Use keys() to avoid mobx es5 error regarding detecting added/removed properties
    const draft: Partial<TransformedCompliantReportingReferral> = keys(
      this.compliantReportingReferralDraftData
    ).reduce((memo, key) => {
      return {
        ...memo,
        [key]: this.compliantReportingReferralDraftData[
          key as keyof TransformedCompliantReportingReferral
        ],
      };
    }, {});

    return {
      ...this.prefilledCompliantReferralForm,
      ...draft,
    };
  }

  getCompliantReportingReferralDataField(
    key: keyof TransformedCompliantReportingReferral
  ):
    | TransformedCompliantReportingReferral[keyof TransformedCompliantReportingReferral]
    | undefined {
    const draftData = this.compliantReportingReferralFormData[key];
    const prefillData = this.prefilledCompliantReferralForm[key];
    return has(this.compliantReportingReferralDraftData, key)
      ? draftData
      : prefillData;
  }

  setCompliantReportingReferralDataField(
    key: keyof TransformedCompliantReportingReferral,
    value: boolean | string | string[]
  ): void {
    set(this.compliantReportingReferralDraftData, key, value);
  }

  get prefilledCompliantReferralForm(): Partial<TransformedCompliantReportingReferral> {
    const prefillSourceInformation = this.fetchedCompliantReportingReferral?.current();

    if (prefillSourceInformation) {
      return transform(this, prefillSourceInformation);
    }

    return {};
  }

  get compliantReportingReferralDraft():
    | CompliantReportingReferralForm
    | undefined {
    return this.updates?.compliantReporting?.referralForm;
  }
}
