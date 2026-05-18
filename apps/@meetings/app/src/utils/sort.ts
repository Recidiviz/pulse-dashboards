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

export enum SortOption {
  Name = "Name (A-Z)",
  Id = "ID",
  Facility = "Facility (A-Z)",
  SupervisionType = "Supervision Type (A-Z)",
  LastMeeting = "Last Meeting",
}

export enum SortDirection {
  Ascending = "asc",
  Descending = "desc",
}

export function serializeSort(sort: SortOption) {
  switch (sort) {
    case SortOption.Name:
      return "name";
    case SortOption.Id:
      return "id";
    case SortOption.Facility:
      return "facility";
    case SortOption.SupervisionType:
      return "supervisionType";
    case SortOption.LastMeeting:
      return "lastMeeting";
  }
}
