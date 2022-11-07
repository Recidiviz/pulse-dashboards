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

import { entries, makeObservable, remove, set, values, when } from "mobx";
import { format as formatPhone } from "phone-fns";

import {
  trackClientProfileViewed,
  trackOpportunityMarkedEligible,
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
  OpportunityFlag,
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
import { SupervisionLevelDowngradeOpportunity } from "./Opportunity/SupervisionLevelDowngradeOpportunity";
import { UsTnExpirationOpportunity } from "./Opportunity/UsTnExpirationOpportunity";
import { optionalFieldToDate } from "./utils";
import { OTHER_KEY } from "./WorkflowsStore";

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

type OpportunityConfig = {
  flag: OpportunityFlag;
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
  supervisionLevelDowngrade: {
    flag: "supervisionLevelDowngradeEligible",
    OpportunityClass: SupervisionLevelDowngradeOpportunity,
  },
  usTnExpiration: {
    flag: "usTnExpirationEligible",
    OpportunityClass: UsTnExpirationOpportunity,
  },
};

type OpportunityMapping = {
  earlyTermination?: EarlyTerminationOpportunity;
  compliantReporting?: CompliantReportingOpportunity;
  earnedDischarge?: EarnedDischargeOpportunity;
  LSU?: LSUOpportunity;
  pastFTRD?: PastFTRDOpportunity;
  supervisionLevelDowngrade?: SupervisionLevelDowngradeOpportunity;
  usTnExpiration?: UsTnExpirationOpportunity;
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

  /**
   * These are all the opportunities we expect to be able to hydrate,
   * but some may be invalid or feature gated
   */
  potentialOpportunities: OpportunityMapping = {};

  constructor(record: ClientRecord, rootStore: RootStore) {
    makeObservable(this, {
      potentialOpportunities: true,
      verifiedOpportunities: true,
      record: true,
      currentUserEmail: true,
      formIsPrinting: true,
      opportunitiesAlmostEligible: true,
      opportunitiesEligible: true,
      printReferralForm: true,
      setFormIsPrinting: true,
      supervisionLevel: true,
      updateRecord: true,
      setOpportunityDenialReasons: true,
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
      if (
        record[flag] &&
        this.rootStore.workflowsStore.opportunityTypes.includes(t)
      ) {
        if (!this.potentialOpportunities[t]) {
          set(this.potentialOpportunities, t, new OpportunityClass(this));
        }
      } else {
        remove(this.potentialOpportunities, t);
      }
    });
  }

  get displayName(): string {
    return [this.fullName.givenNames, this.fullName.surname]
      .filter((n) => Boolean(n))
      .join(" ");
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
      (o) => o.id === this.officerId
    );
    return officer?.district;
  }

  /**
   * This mapping will only contain opportunities that are actually hydrated and valid;
   * in most cases these are the only ones that should ever be shown to users
   */
  get verifiedOpportunities(): OpportunityMapping {
    return entries(this.potentialOpportunities).reduce(
      (opportunities, [opportunityType, opportunity]) => {
        if (!opportunity?.isHydrated || opportunity.error) {
          return opportunities;
        }
        return {
          ...opportunities,
          [opportunityType as OpportunityType]: opportunity,
        };
      },
      {} as OpportunityMapping
    );
  }

  get opportunitiesEligible(): OpportunityMapping {
    return Object.entries(this.verifiedOpportunities).reduce(
      (opportunities, [key, opp]) => {
        if (opp && !opp.almostEligible) {
          return { ...opportunities, [key as OpportunityType]: opp };
        }
        return opportunities;
      },
      {} as OpportunityMapping
    );
  }

  get opportunitiesAlmostEligible(): OpportunityMapping {
    return Object.entries(this.verifiedOpportunities).reduce(
      (opportunities, [key, opp]) => {
        if (opp && opp.almostEligible) {
          return { ...opportunities, [key as OpportunityType]: opp };
        }
        return opportunities;
      },
      {} as OpportunityMapping
    );
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
    const { currentUserEmail, recordId, pseudonymizedId } = this;
    if (!currentUserEmail) return;

    // clear irrelevant "other" text if necessary
    const deletions = reasons.includes(OTHER_KEY)
      ? undefined
      : { otherReason: true };

    await updateOpportunityDenial(
      currentUserEmail,
      recordId,
      { reasons },
      opportunityType,
      deletions
    );

    await updateOpportunityCompleted(
      currentUserEmail,
      recordId,
      opportunityType,
      true
    );

    if (reasons.length) {
      trackSetOpportunityStatus({
        clientId: pseudonymizedId,
        status: "DENIED",
        opportunityType,
        deniedReasons: reasons,
      });
    } else {
      trackSetOpportunityStatus({
        clientId: pseudonymizedId,
        status: "IN_PROGRESS",
        opportunityType,
      });
      trackOpportunityMarkedEligible({
        clientId: pseudonymizedId,
        opportunityType,
      });
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
    const opportunity = this.verifiedOpportunities[opportunityType];
    opportunity?.setCompletedIfEligible();

    this.setFormIsPrinting(true);
    trackReferralFormPrinted({
      clientId: this.pseudonymizedId,
      opportunityType,
    });
  }

  async trackFormViewed(formType: OpportunityType): Promise<void> {
    await when(() => this.verifiedOpportunities[formType] !== undefined);

    trackReferralFormViewed({
      clientId: this.pseudonymizedId,
      opportunityType: formType,
    });
  }

  async trackListViewed(listType: OpportunityType): Promise<void> {
    await when(() => this.verifiedOpportunities[listType] !== undefined);

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
    await when(() => this.verifiedOpportunities[opportunityType] !== undefined);

    trackOpportunityPreviewed({
      clientId: this.pseudonymizedId,
      opportunityType,
    });
  }

  get detailsCopy(): ClientDetailsCopy {
    return CLIENT_DETAILS_COPY[this.stateCode];
  }

  get allClientOpportunitiesLoaded(): boolean {
    return (
      values(this.potentialOpportunities).filter(
        (opp) => opp !== undefined && !(opp.isLoading === false)
      ).length === 0
    );
  }
}
