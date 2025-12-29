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

import { OpportunityBase } from "../OpportunityBase";
import { OpportunityNotification } from "../types";

/**
 * The id is a concatenation of the config notification id, the person's pseudonymized id, the page, and the opportunity type.
 * @param opp - The opportunity instance
 * @param page - The page the notification is for
 * @returns The id of the notification
 * @example
 * createNotificationId("1", opp, "profile") => "1-p001-profile-TEST"
 * createNotificationId("1", opp, "supervisionSupervisor") => "1-p001-supervisionSupervisor-TEST"
 */
export const createNotificationId = (
  id: string,
  opp: OpportunityBase<any, any>,
  page: OpportunityNotification["pages"][number],
) => `${id}-${opp.person.pseudonymizedId}-${page}-${opp.type}`;
