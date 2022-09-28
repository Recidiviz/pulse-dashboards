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

export type OrderKeys = Record<string, number>;

export const DefaultSupervisionLevelOrder: OrderKeys = {
  ELECTRONIC_MONITORING_ONLY: 1,
  LIMITED: 2,
  MINIMUM: 3,
  MEDIUM: 4,
  HIGH: 5,
  MAXIMUM: 6,
  INCARCERATED: 7,
  IN_CUSTODY: 8,
  UNASSIGNED: 9,
  UNSUPERVISED: 10,
  DIVERSION: 11,
  INTERSTATE_COMPACT: 12,
  OTHER: 13,
  ABSCONDED: 14,
  WARRANT: 15,
  ALL: 16,
  UNKNOWN: 17,
};
