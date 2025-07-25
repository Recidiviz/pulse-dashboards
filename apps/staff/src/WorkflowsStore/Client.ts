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
import { capitalize, mapValues, toUpper } from "lodash";
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

import { reasonsIncludesOtherKey } from "../core/utils/workflowsUtils";
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
import { SupervisionTaskInterface, SupervisionTasks } from "./Task/types";
import { JusticeInvolvedPerson, PersonType } from "./types";
import {
  clearPhoneNumberFormatting,
  formatSupervisionType,
  fractionalDateBetweenTwoDates,
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
        "This date is the date that the Defendant was sentenced; in rare cases, the sentencing date and supervision start date may differ.",
    },
  },
};

export type TaskFactory<PersonType extends JusticeInvolvedPerson> = (
  person: PersonType,
) => SupervisionTaskInterface | undefined;

const createClientSupervisionTasks: TaskFactory<Client> = (
  person,
): SupervisionTaskInterface | undefined => {
  const { isSupervisionTasksConfigured } = person.rootStore.workflowsStore;
  if (!(person instanceof Client && isSupervisionTasksConfigured)) return;

  // Checking `isSupervisionTasksConfigured` ensures this will be an appropriate state code
  // but TS currently has no way of knowing that
  // @ts-expect-error
  return new SupervisionTasks(person.rootStore.currentTenantId, person);
};

export function isClient(
  person: Client | JusticeInvolvedPerson,
): person is Client {
  return person instanceof Client;
}

// TODO(#1735): the real type should be cleaner than this
export type ParsedSpecialCondition = {
  note_update_date: string;

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

  private _rawPhoneNumber?: string;

  expirationDate?: Date;

  supervisionStartDate?: Date;

  _caseType?: string;

  caseTypeRawText?: string;

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
    this._caseType = record.caseType;
    this.caseTypeRawText = record.caseTypeRawText;
    this.address = record.address;
    this._rawPhoneNumber = record.phoneNumber;
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

  get metadata() {
    return this.record.metadata ?? {};
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

  get caseType(): string {
    if (this.stateCode === "US_TX") {
      // This is the raw text we get from the state
      return capitalize(this.caseTypeRawText ?? "Unknown");
    }
    if (this.stateCode === "US_NE") {
      if (!this._caseType) return "Unknown";
      return capitalize(this._caseType.replaceAll("_", " "));
    }

    // This is the enum we use for case type internally
    return this._caseType ?? "Unknown";
  }

  get isInCustody(): boolean {
    // Note that we are only handling in-custody for Texas, but there's no reason
    // not to expand it to other states
    if (this.stateCode !== "US_TX") {
      return false;
    }

    // TODO(#8230): Check against dedicated in-custody flag
    return this.supervisionLevel === "In-custody";
  }

  get rawPhoneNumber(): string | undefined {
    return this._rawPhoneNumber;
  }

  get phoneNumber(): string | undefined {
    return this._rawPhoneNumber
      ? formatPhone("(NNN) NNN-NNNN", this._rawPhoneNumber)
      : undefined;
  }

  get detailsCopy(): ClientDetailsCopy {
    return CLIENT_DETAILS_COPY[this.stateCode];
  }

  get district() {
    return this.record.district ?? super.district;
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
          note_update_date: string;

          conditions_on_date: string | null;
        }[] = JSON.parse(
          // the specialConditions strings are almost valid JSON,
          // except they may include NULL instead of null as a value;
          // work around this by converting to lowercase
          conditionsJson.toLowerCase(),
        );

        conditionsForSentence.forEach(
          ({ note_update_date, conditions_on_date }) => {
            // don't display nulls

            if (!conditions_on_date) return;

            // note that we have to convert the actual values back to uppercase
            // to display them properly
            conditionsToDisplay.push(
              mapValues({ note_update_date, conditions_on_date }, toUpper),
            );
          },
        );
      } catch {
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
      : this._rawPhoneNumber;
  }

  get personType(): PersonType {
    return this.record.personType;
  }

  get sentencedBy(): string | undefined {
    if (!this.rootStore.currentTenantId) return;

    const sentencedByStates = [];
    if (this.record.hasAnyInStateSentences) {
      sentencedByStates.push(
        TENANT_CONFIGS[this.rootStore.currentTenantId].name,
      );
    }
    if (this.record.hasAnyOutOfStateSentences) {
      sentencedByStates.push("Other State");
    }

    // When `undefined`, the "Sentenced By" field will not be displayed in the `Supervision` sidebar component
    return sentencedByStates.join(" & ") || undefined;
  }

  get supervisedIn(): string | undefined {
    if (!this.rootStore.currentTenantId) return;

    const { custodialAuthority } = this.record;

    switch (custodialAuthority) {
      case "SUPERVISION_AUTHORITY":
      case "STATE_PRISON":
        return TENANT_CONFIGS[this.rootStore.currentTenantId]?.name;
      case "OTHER_STATE":
        return "Other State";
      case "FEDERAL_PRISON":
        return "Federal Court";
      case "OTHER_COUNTRY":
        return "Other Country";
      default:
        // When `undefined`, the "Supervised In" field will not be displayed in the `Supervision` sidebar component
        return undefined;
    }
  }

  milestonesPhoneNumberDoesNotMatchClient(enteredPhoneNumber: string): boolean {
    if (!enteredPhoneNumber || !this._rawPhoneNumber) return false;
    return (
      clearPhoneNumberFormatting(enteredPhoneNumber) !== this._rawPhoneNumber
    );
  }

  async updateMilestonesDeclineReasons(
    reasons: DeclineReason[],
    otherReason?: string,
  ): Promise<void> {
    const otherReasonField = reasonsIncludesOtherKey(reasons)
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
