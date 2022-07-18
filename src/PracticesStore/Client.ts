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
import {
  action,
  makeObservable,
  observable,
  runInAction,
  set,
  when,
} from "mobx";
import { format as formatPhone } from "phone-fns";

import {
  trackClientProfileViewed,
  trackProfileOpportunityClicked,
  trackReferralFormPrinted,
  trackReferralFormViewed,
  trackSetOpportunityStatus,
  trackSurfacedInList,
} from "../analytics";
import { transform } from "../core/Paperwork/US_TN/Transformer";
import {
  ClientRecord,
  ClientUpdateRecord,
  CompliantReportingFinesFeesEligible,
  CompliantReportingReferralForm,
  FullName,
  OpportunityType,
  SpecialConditionCode,
  SpecialConditionsStatus,
  subscribeToClientUpdates,
  subscribeToCompliantReportingReferral,
  updateCompliantReportingCompleted,
  updateCompliantReportingDenial,
} from "../firestore";
import type { RootStore } from "../RootStore";
import { isDemoMode } from "../utils/isDemoMode";
import {
  CompliantReportingReferralRecord,
  TransformedCompliantReportingReferral,
} from "./CompliantReportingReferralRecord";
import { OTHER_KEY } from "./PracticesStore";
import {
  observableSubscription,
  shiftDemoDate,
  SubscriptionValue,
} from "./utils";

export const UNKNOWN = "Unknown" as const;

// these are the only values supported for now, limited to the Compliant Reporting flow
type SupervisionLevel = "Medium" | "Minimum" | typeof UNKNOWN;

type CompliantReportingCriteria = {
  eligibilityCategory: string;
  /** Any number greater than zero indicates the client is _almost_ eligible. */
  remainingCriteriaNeeded: number;
  eligibleLevelStart?: Date;
  currentOffenses: string[];
  lifetimeOffensesExpired: string[];
  judicialDistrict: string;
  drugScreensPastYear: { result: string; date: Date }[];
  sanctionsPastYear: { type: string }[];
  mostRecentArrestCheck?: Date;
  finesFeesEligible: CompliantReportingFinesFeesEligible;
  pastOffenses: string[];
  zeroToleranceCodes: { contactNoteType: string; contactNoteDate: Date }[];
};

const SUPERVISION_LEVEL_MAP: Record<string, SupervisionLevel> = {
  "STANDARD: MEDIUM": "Medium",
  "STANDARD: MINIMUM": "Minimum",
};

/**
 * Given a raw field from Firestore, converts it to a Date.
 * When Demo Mode is active, it also applies a time shift so that
 * the date from demo fixture data is relevant to the current date.
 */
function fieldToDate(field: Timestamp | string): Date {
  let result: Date;
  if (typeof field === "string") {
    result = parseISO(field);
  } else {
    result = field.toDate();
  }
  if (isDemoMode()) {
    result = shiftDemoDate(result);
  }

  return result;
}

function optionalFieldToDate(field?: Timestamp | string): Date | undefined {
  if (field) return fieldToDate(field);
}

export const OPPORTUNITY_STATUS_RANKED = [
  "PENDING",
  "IN_PROGRESS",
  "DENIED",
  "COMPLETED",
] as const;
export type OpportunityStatus = typeof OPPORTUNITY_STATUS_RANKED[number];

const defaultOpportunityStatuses: Record<OpportunityStatus, string> = {
  PENDING: "Needs referral",
  DENIED: "Currently ineligible",
  COMPLETED: "Referral form complete",
  IN_PROGRESS: "Referral in progress",
};

const opportunityStatusMessages: Record<
  OpportunityType,
  Record<OpportunityStatus, string>
> = {
  compliantReporting: defaultOpportunityStatuses,
};

export class Client {
  rootStore: RootStore;

  id: string;

  pseudonymizedId: string;

  stateCode: string;

  fullName: FullName;

  officerId: string;

  supervisionType: string;

  supervisionLevel: SupervisionLevel;

  supervisionLevelStart?: Date;

  address: string;

  private rawPhoneNumber?: string;

  expirationDate?: Date;

  supervisionStartDate?: Date;

  currentBalance: number;

  lastPaymentAmount?: number;

  lastPaymentDate?: Date;

  feeExemptions?: string;

  specialConditionsFlag: SpecialConditionsStatus;

  probationSpecialConditions: string[];

  paroleSpecialConditions: SpecialConditionCode[];

  nextSpecialConditionsCheck?: Date;

  lastSpecialConditionsNote?: Date;

  specialConditionsTerminatedDate?: Date;

  private compliantReportingCriteria?: CompliantReportingCriteria;

  private fetchedUpdates: SubscriptionValue<ClientUpdateRecord>;

  formIsPrinting = false;

  compliantReportingReferralDraftData: Partial<TransformedCompliantReportingReferral>;

  private fetchedCompliantReportingReferral: SubscriptionValue<CompliantReportingReferralRecord>;

  constructor(record: ClientRecord, rootStore: RootStore) {
    makeObservable<Client, "compliantReportingCriteria">(this, {
      compliantReportingCriteria: true,
      compliantReportingReferralDraftData: true,
      currentUserEmail: true,
      formIsPrinting: true,
      opportunitiesEligible: true,
      printCompliantReportingReferralForm: true,
      reviewStatus: true,
      setCompliantReportingReferralDataField: action,
      setFormIsPrinting: true,
    });

    this.rootStore = rootStore;

    this.id = record.personExternalId;
    this.pseudonymizedId = record.pseudonymizedId;
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
    this.specialConditionsFlag = record.specialConditionsFlag;
    this.probationSpecialConditions = record.specialConditions;
    this.paroleSpecialConditions = record.boardConditions ?? [];
    this.nextSpecialConditionsCheck = optionalFieldToDate(
      record.nextSpecialConditionsCheck
    );
    this.lastSpecialConditionsNote = optionalFieldToDate(
      record.lastSpecialConditionsNote
    );
    this.specialConditionsTerminatedDate = optionalFieldToDate(
      record.specialConditionsTerminatedDate
    );
    this.supervisionStartDate = optionalFieldToDate(
      record.earliestSupervisionStartDateInLatestSystem
    );
    this.compliantReportingReferralDraftData = observable<
      Partial<TransformedCompliantReportingReferral>
    >({});

    const { compliantReportingEligible } = record;
    if (compliantReportingEligible) {
      this.compliantReportingCriteria = {
        eligibilityCategory: compliantReportingEligible.eligibilityCategory,
        remainingCriteriaNeeded:
          compliantReportingEligible.remainingCriteriaNeeded ?? 0,
        eligibleLevelStart: optionalFieldToDate(
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
        finesFeesEligible: compliantReportingEligible.finesFeesEligible,
        pastOffenses: compliantReportingEligible.pastOffenses,
        zeroToleranceCodes:
          compliantReportingEligible.zeroToleranceCodes?.map(
            ({ contactNoteDate, contactNoteType }) => ({
              contactNoteType,
              contactNoteDate: new Date(contactNoteDate),
            })
          ) ?? [],
      };
    }

    // connect to additional data sources for this client
    this.fetchedUpdates = observableSubscription((handler) =>
      subscribeToClientUpdates(this.id, (r) => {
        if (r) {
          runInAction(() => {
            handler(r);
            const data = r.compliantReporting?.referralForm?.data ?? {};
            set(this.compliantReportingReferralDraftData, data);
          });
        } else {
          // empty object will replace undefined, signifying completed fetch
          handler({});
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

  get opportunitiesEligible(): {
    compliantReporting?: CompliantReportingCriteria;
  } {
    let compliantReporting;

    if (
      this.compliantReportingCriteria &&
      ["c1", "c2", "c3", "c4"].includes(
        this.compliantReportingCriteria.eligibilityCategory
      ) &&
      // exclude anyone almost eligible
      this.compliantReportingCriteria.remainingCriteriaNeeded === 0
    ) {
      compliantReporting = this.compliantReportingCriteria;
    }

    return { compliantReporting };
  }

  get reviewStatus(): Record<OpportunityType, OpportunityStatus> {
    let compliantReporting: OpportunityStatus = "PENDING";

    if (
      (this.updates?.compliantReporting?.denial?.reasons?.length || 0) !== 0
    ) {
      compliantReporting = "DENIED";
    } else {
      const updates = this.updates?.compliantReporting;

      if (updates) {
        if (updates.completed) {
          compliantReporting = "COMPLETED";
        } else {
          compliantReporting = "IN_PROGRESS";
        }
      }
    }

    return {
      compliantReporting,
    };
  }

  get reviewStatusMessages(): Record<OpportunityType, string> {
    return {
      compliantReporting:
        opportunityStatusMessages.compliantReporting[
          this.reviewStatus.compliantReporting
        ],
    };
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

      if (reasons.length) {
        trackSetOpportunityStatus({
          clientId: this.pseudonymizedId,
          status: "DENIED",
          opportunityType: "compliantReporting",
          deniedReasons: reasons,
        });
      } else {
        trackSetOpportunityStatus({
          clientId: this.pseudonymizedId,
          status: "IN_PROGRESS",
          opportunityType: "compliantReporting",
        });
      }
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
      if (this.reviewStatus.compliantReporting !== "DENIED") {
        updateCompliantReportingCompleted(this.currentUserEmail, this.id);
        if (this.reviewStatus.compliantReporting !== "COMPLETED") {
          trackSetOpportunityStatus({
            clientId: this.pseudonymizedId,
            status: "COMPLETED",
            opportunityType: "compliantReporting",
          });
        }
      }

      this.setFormIsPrinting(true);
      trackReferralFormPrinted({
        clientId: this.pseudonymizedId,
        opportunityType: "compliantReporting",
      });
    }
  }

  getCompliantReportingReferralDataField(
    key: keyof TransformedCompliantReportingReferral
  ):
    | TransformedCompliantReportingReferral[keyof TransformedCompliantReportingReferral]
    | undefined {
    // Destructure prior to assignment to register dependencies on both fields
    const draftData = this.compliantReportingReferralDraftData[key];
    const prefillData = this.prefilledCompliantReferralForm[key];

    return has(this.compliantReportingReferralDraftData, key)
      ? draftData
      : prefillData;
  }

  async setCompliantReportingReferralDataField(
    key: keyof TransformedCompliantReportingReferral,
    value: boolean | string | string[]
  ): Promise<void> {
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

  async trackFormViewed(formType: OpportunityType): Promise<void> {
    await when(() => this.updates !== undefined);

    trackReferralFormViewed({
      clientId: this.pseudonymizedId,
      opportunityType: formType,
    });
  }

  async trackListViewed(listType: OpportunityType): Promise<void> {
    await when(() => this.updates !== undefined);

    trackSurfacedInList({
      clientId: this.pseudonymizedId,
      opportunityType: listType,
    });
  }

  trackProfileViewed(): void {
    trackClientProfileViewed({ clientId: this.pseudonymizedId });
  }

  trackProfileOpportunityClicked(opportunityType: OpportunityType): void {
    trackProfileOpportunityClicked({
      clientId: this.pseudonymizedId,
      opportunityType,
    });
  }
}
