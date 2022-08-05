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

import { has } from "lodash";
import {
  action,
  entries,
  makeObservable,
  observable,
  reaction,
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
  CompliantReportingReferralForm,
  FullName,
  SpecialConditionCode,
  SpecialConditionsStatus,
  subscribeToClientUpdates,
  subscribeToClientUpdatesV2,
  subscribeToCompliantReportingReferral,
  subscribeToEarlyTerminationReferral,
  updateCompliantReportingCompleted,
  updateCompliantReportingDenial,
} from "../firestore";
import type { RootStore } from "../RootStore";
import {
  CompliantReportingReferralRecord,
  TransformedCompliantReportingReferral,
} from "./CompliantReportingReferralRecord";
import {
  createCompliantReportingOpportunity,
  createEarlyTerminationOpportunity,
  Opportunity,
  OpportunityType,
} from "./Opportunity";
import { EarlyTerminationReferralRecord } from "./Opportunity/EarlyTerminationReferralRecord";
import {
  observableSubscription,
  optionalFieldToDate,
  SubscriptionValue,
} from "./utils";
import { OTHER_KEY } from "./WorkflowsStore";

export const UNKNOWN = "Unknown" as const;

// these are the only values supported for now, limited to the Compliant Reporting flow
type SupervisionLevel = "Medium" | "Minimum" | typeof UNKNOWN;

const SUPERVISION_LEVEL_MAP: Record<string, SupervisionLevel> = {
  "STANDARD: MEDIUM": "Medium",
  "STANDARD: MINIMUM": "Minimum",
};

type OpportunityMapping = Partial<Record<OpportunityType, Opportunity>>;

export class Client {
  rootStore: RootStore;

  recordId: string;

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

  opportunities: OpportunityMapping;

  private fetchedUpdates: SubscriptionValue<ClientUpdateRecord>;

  private fetchedUpdatesV2: SubscriptionValue<ClientUpdateRecord>;

  formIsPrinting = false;

  compliantReportingReferralDraftData: Partial<TransformedCompliantReportingReferral>;

  private fetchedCompliantReportingReferral: SubscriptionValue<CompliantReportingReferralRecord>;

  private fetchedEarlyTerminationReferral: SubscriptionValue<EarlyTerminationReferralRecord>;

  constructor(record: ClientRecord, rootStore: RootStore) {
    makeObservable(this, {
      opportunities: true,
      compliantReportingReferralDraftData: true,
      currentUserEmail: true,
      formIsPrinting: true,
      opportunitiesAlmostEligible: true,
      opportunitiesEligible: true,
      printCompliantReportingReferralForm: true,
      setCompliantReportingReferralDataField: action,
      setFormIsPrinting: true,
    });

    this.rootStore = rootStore;

    this.recordId = record.recordId;
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

    reaction(
      () => [this.fetchedEarlyTerminationReferral?.current()],
      ([earlyTerminationReferralRecord]) => {
        runInAction(() => {
          if (earlyTerminationReferralRecord)
            this.opportunities.earlyTermination = createEarlyTerminationOpportunity(
              record.earlyTerminationEligible,
              earlyTerminationReferralRecord,
              this
            );
        });
      }
    );

    // connect to additional data sources for this client
    this.fetchedUpdatesV2 = observableSubscription((handler) => {
      return subscribeToClientUpdatesV2(this.recordId, (r) => {
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
      });
    });

    this.fetchedUpdates = observableSubscription((handler) => {
      return subscribeToClientUpdates(this.id, (r) => {
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
      });
    });

    this.fetchedCompliantReportingReferral = observableSubscription((handler) =>
      subscribeToCompliantReportingReferral(this.recordId, (result) => {
        if (result) handler(result);
      })
    );

    this.fetchedEarlyTerminationReferral = observableSubscription((handler) => {
      return subscribeToEarlyTerminationReferral(this.id, (result) => {
        if (result) handler(result);
      });
    });

    this.opportunities = {
      compliantReporting: createCompliantReportingOpportunity(
        record.compliantReportingEligible,
        this
      ),
      earlyTermination: createEarlyTerminationOpportunity(
        record.earlyTerminationEligible,
        this.fetchedEarlyTerminationReferral.current(),
        this
      ),
    };
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
    const officer = this.rootStore.workflowsStore?.availableOfficers.find(
      (o) => o.id === this.officerId
    );
    return officer?.district;
  }

  get updates(): ClientUpdateRecord | undefined {
    // TODO(#2108): Clean up requests to `clientUpdates` after fully migrating to `clientUpdatesV2`
    if (
      this.fetchedUpdatesV2.current() &&
      Object.keys(this.fetchedUpdatesV2.current() as Record<string, any>)
        .length > 0
    ) {
      return this.fetchedUpdatesV2.current();
    }
    return this.fetchedUpdates.current();
  }

  get opportunitiesEligible(): OpportunityMapping {
    return entries(this.opportunities).reduce((opportunities, [key, opp]) => {
      if (opp !== undefined && !opp.almostEligible) {
        return { ...opportunities, [key as OpportunityType]: opp };
      }
      return opportunities;
    }, {} as OpportunityMapping);
  }

  get opportunitiesAlmostEligible(): OpportunityMapping {
    return entries(this.opportunities).reduce((opportunities, [key, opp]) => {
      if (opp !== undefined && opp.almostEligible) {
        return { ...opportunities, [key as OpportunityType]: opp };
      }
      return opportunities;
    }, {} as OpportunityMapping);
  }

  get currentUserEmail(): string | null | undefined {
    return this.rootStore.workflowsStore.user?.info.email;
  }

  get currentUserName(): string | null | undefined {
    return this.rootStore.workflowsStore.user?.info.email;
  }

  async setCompliantReportingDenialReasons(reasons: string[]): Promise<void> {
    if (this.currentUserEmail) {
      // clear irrelevant "other" text if necessary
      const deletions = reasons.includes(OTHER_KEY)
        ? undefined
        : { otherReason: true };

      await updateCompliantReportingDenial(
        this.currentUserEmail,
        this.id,
        this.recordId,
        { reasons },
        deletions
      );

      await updateCompliantReportingCompleted(
        this.currentUserEmail,
        this.id,
        this.recordId,
        true
      );

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
      await updateCompliantReportingDenial(
        this.currentUserEmail,
        this.id,
        this.recordId,
        {
          otherReason,
        }
      );
    }
  }

  setFormIsPrinting(value: boolean): void {
    this.formIsPrinting = value;
  }

  printCompliantReportingReferralForm(): void {
    if (this.currentUserEmail) {
      if (this.opportunities.compliantReporting?.reviewStatus !== "DENIED") {
        updateCompliantReportingCompleted(
          this.currentUserEmail,
          this.id,
          this.recordId
        );
        if (
          this.opportunities.compliantReporting?.reviewStatus !== "COMPLETED"
        ) {
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
