/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2024 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 */
import type { Timestamp } from "firebase/firestore";

import { JusticeInvolvedPersonRecord, ResidentRecord } from "~datatypes";

import {
  IncarcerationOpportunityType,
  SupervisionOpportunityType,
} from "../../WorkflowsStore";
import { ResidentMetadata } from ".";
import { Milestone } from "./milestones";

export type PersonUpdateType = "preferredName" | "preferredContactMethod";
export const contactMethods = ["Call", "Text", "Email", "None"];
export type ContactMethodType = (typeof contactMethods)[number];
export type PortionServedDates = {
  heading: string;
  date: Date | undefined;
}[];

/**
 * Person-level data generated within this application
 */
export type PersonUpdateRecord = {
  preferredName?: string;
  preferredContactMethod?: ContactMethodType;
};

export type SpecialConditionCode = {
  condition: string;
  conditionDescription: string;
};

export type WorkflowsJusticeInvolvedPersonRecord =
  JusticeInvolvedPersonRecord & {
    recordId: string;
    allEligibleOpportunities:
      | SupervisionOpportunityType[]
      | IncarcerationOpportunityType[];
  };

export type ClientEmployer = {
  name: string;
  address?: string;
};

/**
 * Data from the Recidiviz data platform about a person on supervision
 */
export type ClientRecord = WorkflowsJusticeInvolvedPersonRecord & {
  personType: "CLIENT";
  district?: string;
  supervisionType?: string;
  supervisionLevel?: string;
  supervisionLevelStart?: Timestamp | string;
  address?: string;
  phoneNumber?: string;
  supervisionStartDate?: string;
  expirationDate?: Timestamp | string;
  currentBalance?: number;
  lastPaymentAmount?: number;
  lastPaymentDate?: Timestamp | string;
  specialConditions?: string[];
  boardConditions?: SpecialConditionCode[];
  allEligibleOpportunities: SupervisionOpportunityType[];
  currentEmployers?: ClientEmployer[];
  milestones?: Milestone[];
  emailAddress?: string;
  officerId: string;
};

/**
 * Data from the Recidiviz data platform about an incarcerated person
 */
export type WorkflowsResidentRecord = WorkflowsJusticeInvolvedPersonRecord &
  ResidentRecord["output"] & {
    allEligibleOpportunities: IncarcerationOpportunityType[];
    metadata: ResidentMetadata;
  };
