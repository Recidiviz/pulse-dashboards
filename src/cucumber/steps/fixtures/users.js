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

export const defaultOfflineUser = {
  picture:
    "https://ui-avatars.com/api/?name=Demo+Jones&background=0D8ABC&color=fff&rounded=false",
  name: "Demo Jones",
  email: "notarealemail@recidiviz.org",
  [`${process.env.METADATA_NAMESPACE}app_metadata`]: {
    stateCode: "recidiviz",
    allowedSupervisionLocationIds: [],
    allowedSupervisionLocationLevel: null,
    routes: {
      system_prison: true,
      system_supervision: true,
      operations: true,
      system_supervisionToLiberty: true,
      system_supervisionToPrison: true,
      community_practices: true,
      worfklows: true,
    },
    userHash: "hash123abc",
  },
};
