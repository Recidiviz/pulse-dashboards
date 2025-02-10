// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import dedent from "dedent";
import { deleteField, FieldValue, serverTimestamp } from "firebase/firestore";
import { mapValues, toUpper } from "lodash";
import { action, makeObservable, override } from "mobx";
import { format as formatPhone } from "phone-fns";
import { toast } from "react-hot-toast";

import {
  ClientEmployer,
  ClientRecord,
  congratulationsMilestoneTypes,
  Milestone,
  MilestoneType,
  profileMilestoneTypes,
  SpecialConditionCode,
} from "~datatypes";

import { workflowsUrl } from "../core/views";
import {
  DeclineReason,
  MilestonesMessage,
  PortionServedDates,
  TextMessageStatus,
  TextMessageStatuses,
} from "../FirestoreStore/types";
import type { RootStore } from "../RootStore";
import { TENANT_CONFIGS } from "../tenants";
import { JusticeInvolvedPersonBase } from "./JusticeInvolvedPersonBase";
import { MilestonesMessageUpdateSubscription } from "./subscriptions/MilestonesMessageUpdateSubscription";
import { SupervisionTaskInterface } from "./Task/types";
import { UsIdSupervisionTasks } from "./Task/UsIdSupervisionTasks";
import { UsTxSupervisionTasks } from "./Task/UsTxSupervisionTasks";
import { JusticeInvolvedPerson } from "./types";
import {
  clearPhoneNumberFormatting,
  formatSupervisionType,
  fractionalDateBetweenTwoDates,
  OTHER_KEY,
} from "./utils";

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

export type TaskFactory<PersonType extends JusticeInvolvedPerson> = (
  person: PersonType,
) => SupervisionTaskInterface | undefined;

const createClientSupervisionTasks: TaskFactory<Client> = (
  person,
): SupervisionTaskInterface | undefined => {
  const { allowSupervisionTasks } = person.rootStore.workflowsStore;
  if (!(person instanceof Client && allowSupervisionTasks)) return;

  if (person.rootStore.currentTenantId === "US_TX") {
    return new UsTxSupervisionTasks(person);
  }

  if (person.rootStore.currentTenantId === "US_ID") {
    return new UsIdSupervisionTasks(person);
  }
};

export function isClient(
  person: Client | JusticeInvolvedPerson,
): person is Client {
  return person instanceof Client;
}

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

function filteredMilestoneTypes(
  milestones: Milestone[] | undefined,
  types: readonly MilestoneType[],
) {
  return (milestones ?? []).filter(({ type }) => types.includes(type));
}

/**
 * Represents a person on supervision
 */
export class Client extends JusticeInvolvedPersonBase<ClientRecord> {
  supervisionLevelStart?: Date;

  address?: string;

  private rawPhoneNumber?: string;

  expirationDate?: Date;

  supervisionStartDate?: Date;

  currentBalance?: number;

  lastPaymentAmount?: number;

  lastPaymentDate?: Date;

  probationSpecialConditions?: string[];

  paroleSpecialConditions?: SpecialConditionCode[];

  currentEmployers?: ClientEmployer[];

  tenantMilestones?: Milestone[];

  emailAddress?: string;

  milestonesMessageUpdatesSubscription?: MilestonesMessageUpdateSubscription<MilestonesMessage>;

  constructor(record: ClientRecord, rootStore: RootStore) {
    super(record, rootStore, createClientSupervisionTasks);

    if (
      rootStore.currentTenantId &&
      TENANT_CONFIGS[
        rootStore.currentTenantId
      ]?.navigation?.workflows?.includes("milestones")
    ) {
      this.milestonesMessageUpdatesSubscription =
        new MilestonesMessageUpdateSubscription(
          this.rootStore.firestoreStore,
          record.recordId,
        );
    }

    makeObservable(this, {
      supervisionLevel: true,
      updateRecord: override,
      milestoneMessagesUpdates: true,
      milestonesPhoneNumber: true,
      milestonesPendingMessage: true,
      milestonesMessageStatus: true,
      updateMilestonesPhoneNumber: action,
      updateMilestonesTextMessage: action,
    });
    this.updateRecord(record);
  }

  updateRecord(record: ClientRecord): void {
    super.updateRecord(record);
    this.supervisionLevelStart = record.supervisionLevelStart;
    this.address = record.address;
    this.rawPhoneNumber = record.phoneNumber;
    this.expirationDate = record.expirationDate;
    this.currentBalance = record.currentBalance;
    this.lastPaymentDate = record.lastPaymentDate;
    this.lastPaymentAmount = record.lastPaymentAmount;
    this.probationSpecialConditions = record.specialConditions;
    this.paroleSpecialConditions = record.boardConditions ?? [];
    this.supervisionStartDate = record.supervisionStartDate;
    this.currentEmployers = record.currentEmployers;
    this.emailAddress = record.emailAddress;

    const tenantMilestoneTypes =
      this.rootStore.currentTenantId &&
      TENANT_CONFIGS[this.rootStore.currentTenantId]?.milestoneTypes;
    this.tenantMilestones = tenantMilestoneTypes
      ? filteredMilestoneTypes(record.milestones, tenantMilestoneTypes)
      : record.milestones;
  }

  get profileUrl(): string {
    return workflowsUrl("clientProfile", {
      justiceInvolvedPersonId: this.pseudonymizedId,
    });
  }

  get assignedStaffId(): string {
    return this.record.officerId;
  }

  get supervisionType(): string {
    const supervisionType = this.record.supervisionType;

    return !supervisionType || supervisionType === "INTERNAL_UNKNOWN"
      ? "Unknown"
      : formatSupervisionType(supervisionType);
  }

  get supervisionLevel(): string {
    return this.rootStore.workflowsStore.formatSupervisionLevel(
      this.record.supervisionLevel,
    );
  }

  get phoneNumber(): string | undefined {
    return this.rawPhoneNumber
      ? formatPhone("(NNN) NNN-NNNN", this.rawPhoneNumber)
      : undefined;
  }

  get detailsCopy(): ClientDetailsCopy {
    return CLIENT_DETAILS_COPY[this.stateCode];
  }

  get district() {
    // For some reason typescript doesn't like super.district
    // eslint-disable-next-line dot-notation
    return this.record.district ?? super["district"];
  }

  get portionServedDates(): PortionServedDates {
    const startDate = this.record.supervisionStartDate;
    const endDate = this.record.expirationDate;

    const opportunityDates: PortionServedDates = [];

    const opportunities = Object.values(this.opportunities).flat();

    opportunities.forEach((opp) => {
      if ("portionServedRequirement" in opp) {
        if (
          opp.portionServedRequirement &&
          opp.portionServedRequirement.includes("1/2")
        ) {
          opportunityDates.push({
            heading: "Half Time",
            date: fractionalDateBetweenTwoDates(startDate, endDate, 0.5),
          });
        }
      }
    });

    return opportunityDates;
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
          conditionsJson.toLowerCase(),
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
              mapValues({ note_update_date, conditions_on_date }, toUpper),
            );
          },
        );
      } catch (e) {
        // if we couldn't hack our way to valid JSON,
        // display the whole ugly string so there's no data loss
        conditionsToDisplay.push(conditionsJson);
      }
    });
    return conditionsToDisplay;
  }

  get systemConfig() {
    return this.rootStore.workflowsStore.systemConfigFor("SUPERVISION");
  }

  get profileMilestones(): Milestone[] {
    return filteredMilestoneTypes(this.tenantMilestones, profileMilestoneTypes);
  }

  get congratulationsMilestones(): Milestone[] {
    return filteredMilestoneTypes(
      this.tenantMilestones,
      congratulationsMilestoneTypes,
    );
  }

  get milestoneMessagesUpdates(): MilestonesMessage | undefined {
    return this.milestonesMessageUpdatesSubscription?.data;
  }

  get milestonesMessageStatus(): TextMessageStatus | undefined {
    return this.milestoneMessagesUpdates?.status;
  }

  get milestonesPendingMessage(): string | undefined {
    return this.milestoneMessagesUpdates?.pendingMessage;
  }

  get milestonesMessageErrors(): string[] | undefined {
    return this.milestoneMessagesUpdates?.errors;
  }

  get milestonesFullTextMessage(): string | undefined {
    return this.milestoneMessagesUpdates?.message;
  }

  get milestonesDeclinedReasons(): MilestonesMessage["declinedReasons"] {
    return this.milestoneMessagesUpdates?.declinedReasons;
  }

  get milestonesMessageUpdateLog(): MilestonesMessage["updated"] | undefined {
    return this.milestoneMessagesUpdates?.updated;
  }

  get milestonesPhoneNumber(): string | undefined {
    const userEnteredPhoneNumber = this.milestoneMessagesUpdates?.recipient;
    return userEnteredPhoneNumber?.length
      ? userEnteredPhoneNumber
      : this.rawPhoneNumber;
  }

  milestonesPhoneNumberDoesNotMatchClient(enteredPhoneNumber: string): boolean {
    if (!enteredPhoneNumber || !this.rawPhoneNumber) return false;
    return (
      clearPhoneNumberFormatting(enteredPhoneNumber) !== this.rawPhoneNumber
    );
  }

  async updateMilestonesDeclineReasons(
    reasons: DeclineReason[],
    otherReason?: string,
  ): Promise<void> {
    const otherReasonField = reasons.includes(OTHER_KEY)
      ? { otherReason }
      : { otherReason: deleteField() };

    const updated = {
      by: this.rootStore.workflowsStore.currentUserEmail,
      date: serverTimestamp(),
    };
    await this.rootStore.firestoreStore.updateMilestonesMessages(
      this.recordId,
      {
        updated,
        status: TextMessageStatuses.DECLINED,
        declinedReasons: {
          ...(reasons.length ? { reasons } : {}),
          ...otherReasonField,
        },
      },
    );
  }

  async undoMilestonesDeclined(): Promise<void> {
    const updated = {
      by: this.rootStore.workflowsStore.currentUserEmail,
      date: serverTimestamp(),
    };
    await this.rootStore.firestoreStore.updateMilestonesMessages(
      this.recordId,
      {
        updated,
        status: TextMessageStatuses.PENDING,
        declinedReasons: deleteField(),
      },
    );
  }

  async updateMilestonesPhoneNumber(
    phoneNumber: string,
    deletePhoneNumber = false,
  ): Promise<void> {
    const updated = {
      by: this.rootStore.workflowsStore.currentUserEmail,
      date: serverTimestamp(),
    };
    await this.rootStore.firestoreStore.updateMilestonesMessages(
      this.recordId,
      {
        updated,
        status: TextMessageStatuses.PENDING,
        stateCode: this.stateCode,
        recipient: deletePhoneNumber ? deleteField() : phoneNumber,
        userHash: this.rootStore.workflowsStore.currentUserHash,
      },
    );
  }

  async updateMilestonesTextMessage(
    additionalMessage?: string,
    deleteAdditionalMessage = false,
  ): Promise<void> {
    let pendingMessage: Partial<Record<"pendingMessage", string | FieldValue>>;
    if (deleteAdditionalMessage) {
      pendingMessage = { pendingMessage: deleteField() };
    } else if (additionalMessage && additionalMessage !== "") {
      pendingMessage = {
        pendingMessage: additionalMessage,
      };
    } else {
      pendingMessage = {};
    }

    const updated = {
      by: this.rootStore.workflowsStore.currentUserEmail,
      date: serverTimestamp(),
    };
    await this.rootStore.firestoreStore.updateMilestonesMessages(
      this.recordId,
      {
        updated,
        userHash: this.rootStore.workflowsStore.currentUserHash,
        status: TextMessageStatuses.PENDING,
        ...pendingMessage,
        stateCode: this.stateCode,
        message: dedent`
            ${this.defaultMilestonesMessage}

            ${additionalMessage || ""}
          `,
      },
    );
  }

  async updateMilestonesStatus(status: TextMessageStatus) {
    await this.rootStore.firestoreStore.updateMilestonesMessages(
      this.recordId,
      {
        updated: {
          by: this.rootStore.workflowsStore.currentUserEmail,
          date: serverTimestamp(),
        },
        status,
        userHash: this.rootStore.workflowsStore.currentUserHash,
      },
    );
  }

  async sendMilestonesMessage(): Promise<void> {
    if (!this.milestonesFullTextMessage || !this.milestonesPhoneNumber) return;
    try {
      await this.rootStore.firestoreStore.updateMilestonesMessages(
        this.recordId,
        {
          updated: {
            by: this.rootStore.workflowsStore.currentUserEmail,
            date: serverTimestamp(),
          },
          status: TextMessageStatuses.IN_PROGRESS,
          userHash: this.rootStore.workflowsStore.currentUserHash,
        },
      );
      await this.rootStore.apiStore.postExternalSMSMessage({
        message: this.milestonesFullTextMessage,
        recipientExternalId: this.externalId,
        recipientPhoneNumber: this.milestonesPhoneNumber,
        senderId: this.rootStore.workflowsStore.currentUserEmail ?? "Unknown",
        userHash: this.rootStore.workflowsStore.currentUserHash,
      });
    } catch (e) {
      await this.rootStore.firestoreStore.updateMilestonesMessages(
        this.recordId,
        {
          updated: {
            by: this.rootStore.workflowsStore.currentUserEmail,
            date: serverTimestamp(),
          },
          status: TextMessageStatuses.PENDING,
          userHash: this.rootStore.workflowsStore.currentUserHash,
        },
      );
      toast.error(
        "We couldn't send your message. Please wait a moment and try again.",
      );
      throw e;
    }
  }

  get defaultMilestonesMessage(): string {
    const {
      rootStore: {
        userStore: { userSurname },
      },
      congratulationsMilestones,
    } = this;

    const clientName = this.preferredName ?? this.fullName.givenNames;
    const salutation = clientName ? `Hey ${clientName}!` : `Hey!`;

    return dedent`
    Message from Agent ${userSurname} at ${
      !this.rootStore.currentTenantId
        ? "DOC"
        : TENANT_CONFIGS[this.rootStore.currentTenantId].DOCName
    }:

    ${salutation} Congratulations on reaching ${
      congratulationsMilestones.length > 1
        ? "these milestones"
        : "this milestone"
    }:

    ${congratulationsMilestones.map((m) => `- ${m.text}`).join("\n")}
  `;
  }
}
