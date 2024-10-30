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

import {
  ResidentRecord,
  WorkflowsJusticeInvolvedPersonRecord,
} from "~datatypes";

import { ResidentMetadata } from ".";

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

/**
 * Data from the Recidiviz data platform about an incarcerated person
 */
export type WorkflowsResidentRecord = WorkflowsJusticeInvolvedPersonRecord &
  ResidentRecord["output"] & {
    metadata: ResidentMetadata;
  };
