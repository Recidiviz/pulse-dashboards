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

import { entries, makeObservable, remove, set, when } from "mobx";
import { format as formatPhone } from "phone-fns";

import {
  trackClientProfileViewed,
  trackOpportunityPreviewed,
  trackProfileOpportunityClicked,
  trackReferralFormPrinted,
  trackReferralFormViewed,
  trackSetOpportunityStatus,
  trackSurfacedInList,
} from "../analytics";
import {
  ClientRecord,
  FullName,
  SpecialConditionCode,
  updateOpportunityCompleted,
  updateOpportunityDenial,
} from "../firestore";
import type { RootStore } from "../RootStore";
import {
  CompliantReportingOpportunity,
  EarlyTerminationOpportunity,
  EarnedDischargeOpportunity,
  LSUOpportunity,
  Opportunity,
  OPPORTUNITY_TYPES,
  OpportunityType,
  PastFTRDOpportunity,
} from "./Opportunity";
import { optionalFieldToDate } from "./utils";
import { OTHER_KEY } from "./WorkflowsStore";

export const UNKNOWN = "Unknown" as const;

const SUPERVISION_LEVEL_MAP: Record<string, string> = {
  // TODO(#2287): remove these levels derived from TN raw data
  "STANDARD: MEDIUM": "Medium",
  "STANDARD: MINIMUM": "Minimum",
};

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

type OpportunityConfig = {
  flag: `${OpportunityType}Eligible`;
  OpportunityClass: {
    new (client: Client): Opportunity;
  };
};

const OPPORTUNITY_CREATION_MAPPING: Record<
  OpportunityType,
  OpportunityConfig
> = {
  compliantReporting: {
    flag: "compliantReportingEligible",
    OpportunityClass: CompliantReportingOpportunity,
  },
  earlyTermination: {
    flag: "earlyTerminationEligible",
    OpportunityClass: EarlyTerminationOpportunity,
  },
  earnedDischarge: {
    flag: "earnedDischargeEligible",
    OpportunityClass: EarnedDischargeOpportunity,
  },
  LSU: { flag: "LSUEligible", OpportunityClass: LSUOpportunity },
  pastFTRD: { flag: "pastFTRDEligible", OpportunityClass: PastFTRDOpportunity },
};

type OpportunityMapping = {
  earlyTermination?: EarlyTerminationOpportunity;
  compliantReporting?: CompliantReportingOpportunity;
  earnedDischarge?: EarnedDischargeOpportunity;
  LSU?: LSUOpportunity;
  pastFTRD?: PastFTRDOpportunity;
};

export class Client {
  rootStore: RootStore;

  recordId!: string;

  id!: string;

  record!: ClientRecord;

  pseudonymizedId!: string;

  stateCode!: string;

  fullName!: FullName;

  officerId!: string;

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

  formIsPrinting = false;

  opportunities: OpportunityMapping = {};

  constructor(record: ClientRecord, rootStore: RootStore) {
    makeObservable(this, {
      opportunities: true,
      record: true,
      currentUserEmail: true,
      formIsPrinting: true,
      opportunitiesAlmostEligible: true,
      opportunitiesEligible: true,
      printReferralForm: true,
      setFormIsPrinting: true,
      supervisionLevel: true,
      updateRecord: true,
    });

    this.rootStore = rootStore;

    this.updateRecord(record);
  }

  updateRecord(record: ClientRecord): void {
    this.recordId = record.recordId;
    this.record = record;
    this.id = record.personExternalId;
    this.pseudonymizedId = record.pseudonymizedId;
    this.stateCode = record.stateCode.toUpperCase();
    this.fullName = record.personName;
    this.officerId = record.officerId;
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

    OPPORTUNITY_TYPES.forEach((t) => {
      const { flag, OpportunityClass } = OPPORTUNITY_CREATION_MAPPING[t];
      if (record[flag]) {
        if (!this.opportunities[t]) {
          set(this.opportunities, t, new OpportunityClass(this));
        }
      } else {
        remove(this.opportunities, t);
      }
    });
  }

  get displayName(): string {
    return [this.fullName.givenNames, this.fullName.surname]
      .filter((n) => Boolean(n))
      .join(" ");
  }

  get supervisionLevel(): string {
    const levelFromFilters = this.rootStore.workflowsStore.supervisionLevels.find(
      (opt) => opt.value === this.record.supervisionLevel
    )?.label;
    // some levels are mapped locally for historical reasons (e.g., to patch gaps in ingest or handle raw data)
    const locallyMappedLevel =
      SUPERVISION_LEVEL_MAP[this.record.supervisionLevel ?? ""];
    return (
      levelFromFilters ??
      locallyMappedLevel ??
      // TODO(#2287): remove TN-specific override once data is migrated;
      // this prevents a sudden proliferation of "Unknown" labels in TN in the interim
      (this.stateCode === "US_TN" ? "" : UNKNOWN)
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
      (o) => o.id === this.officerId
    );
    return officer?.district;
  }

  get opportunitiesEligible(): OpportunityMapping {
    return entries(this.opportunities).reduce((opportunities, [key, opp]) => {
      if (opp?.isHydrated && !opp.almostEligible) {
        return { ...opportunities, [key as OpportunityType]: opp };
      }
      return opportunities;
    }, {} as OpportunityMapping);
  }

  get opportunitiesAlmostEligible(): OpportunityMapping {
    return entries(this.opportunities).reduce((opportunities, [key, opp]) => {
      if (opp?.isHydrated && opp.almostEligible) {
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

  async setOpportunityDenialReasons(
    reasons: string[],
    opportunityType: OpportunityType
  ): Promise<void> {
    if (this.currentUserEmail) {
      // clear irrelevant "other" text if necessary
      const deletions = reasons.includes(OTHER_KEY)
        ? undefined
        : { otherReason: true };

      await updateOpportunityDenial(
        this.currentUserEmail,
        this.recordId,
        { reasons },
        opportunityType,
        deletions
      );

      await updateOpportunityCompleted(
        this.currentUserEmail,
        this.recordId,
        opportunityType,
        true
      );

      if (reasons.length) {
        trackSetOpportunityStatus({
          clientId: this.pseudonymizedId,
          status: "DENIED",
          opportunityType,
          deniedReasons: reasons,
        });
      } else {
        trackSetOpportunityStatus({
          clientId: this.pseudonymizedId,
          status: "IN_PROGRESS",
          opportunityType,
        });
      }
    }
  }

  async setOpportunityOtherReason(
    opportunityType: OpportunityType,
    otherReason?: string
  ): Promise<void> {
    if (this.currentUserEmail) {
      await updateOpportunityDenial(
        this.currentUserEmail,
        this.recordId,
        {
          otherReason,
        },
        opportunityType
      );
    }
  }

  setFormIsPrinting(value: boolean): void {
    this.formIsPrinting = value;
  }

  printReferralForm(opportunityType: OpportunityType): void {
    const opportunity = this.opportunities[opportunityType];
    if (this.currentUserEmail && opportunity?.isHydrated) {
      if (opportunity.reviewStatus !== "DENIED") {
        updateOpportunityCompleted(
          this.currentUserEmail,
          this.recordId,
          opportunityType
        );
        if (opportunity.reviewStatus !== "COMPLETED") {
          trackSetOpportunityStatus({
            clientId: this.pseudonymizedId,
            status: "COMPLETED",
            opportunityType,
          });
        }
      }

      this.setFormIsPrinting(true);
      trackReferralFormPrinted({
        clientId: this.pseudonymizedId,
        opportunityType,
      });
    }
  }

  async trackFormViewed(formType: OpportunityType): Promise<void> {
    await when(() => this.opportunities[formType]?.isLoading === false);

    trackReferralFormViewed({
      clientId: this.pseudonymizedId,
      opportunityType: formType,
    });
  }

  async trackListViewed(listType: OpportunityType): Promise<void> {
    await when(() => this.opportunities[listType]?.isLoading === false);

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

  async trackOpportunityPreviewed(
    opportunityType: OpportunityType
  ): Promise<void> {
    await when(() => this.opportunities[opportunityType]?.isLoading === false);

    trackOpportunityPreviewed({
      clientId: this.pseudonymizedId,
      opportunityType,
    });
  }

  get detailsCopy(): ClientDetailsCopy {
    return CLIENT_DETAILS_COPY[this.stateCode];
  }
}
