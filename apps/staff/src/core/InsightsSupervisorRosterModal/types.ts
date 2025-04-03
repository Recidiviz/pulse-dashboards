// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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
  RosterChangeRequest,
  RosterChangeRequestResponse,
  SupervisionOfficer,
} from "~datatypes";

import { InsightsSupervisionStore } from "../../InsightsStore/stores/InsightsSupervisionStore";
import { SelectOption } from "../CaseloadSelect/CaseloadSelect";
import { useRosterChangeRequestForm } from "./utils/useRosterChangeRequestForm";

export type SelectOptionWithLocation = SelectOption & {
  location: string | undefined | null;
};

export type RosterChangeRequestParams = Parameters<
  InsightsSupervisionStore["submitRosterChangeRequestIntercomTicket"]
>;

/**
 * Promise used by and for the form.
 */
export type FormPromise = (
  ...args: RosterChangeRequestParams
) => Promise<RosterChangeRequestResponse>;

/**
 * This encapsulates all the necessary functionalities related to the form.
 * It allows you to manage form state, handle submissions, and interact with form fields
 */
export type InsightsRosterChangeRequestFormManager = ReturnType<
  typeof useRosterChangeRequestForm
>;

/**
 * The form's input options
 */
export type InsightsRosterChangeRequestFormOptions = Omit<
  RosterChangeRequest,
  "affectedOfficersExternalIds" | "requesterName"
> & {
  affectedOfficers: SupervisionOfficer[];
};
