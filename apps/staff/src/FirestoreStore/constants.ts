// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

export const FIRESTORE_GENERAL_COLLECTION_MAP = {
  staff: "staff",
  supervisionStaff: "supervisionStaff",
  incarcerationStaff: "incarcerationStaff",
  userUpdates: "userUpdates",
  clients: "clients",
  residents: "residents",
  clientUpdates: "clientUpdates",
  clientUpdatesV2: "clientUpdatesV2",
  clientOpportunityUpdates: "clientOpportunityUpdates",
  locations: "locations",
  milestonesMessages: "milestonesMessages",
  taskUpdates: "taskUpdates",
  usIdSupervisionTasks: "US_ID-supervisionTasks",
} as const;
