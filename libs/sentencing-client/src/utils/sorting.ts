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

export const sortFullNameByLastName = (a?: string, b?: string) => {
  if (!a || !b) return 0;
  const lastNameASplit = a.split(" ");
  const lastNameBSplit = b.split(" ");
  const lastNameA = lastNameASplit[lastNameASplit.length - 1];
  const lastNameB = lastNameBSplit[lastNameBSplit.length - 1];

  return lastNameA.localeCompare(lastNameB);
};
