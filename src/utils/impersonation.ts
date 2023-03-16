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

import { RawUserAppMetadata, UserAppMetadata } from "../RootStore/types";

export function stopImpersonating() {
  window.location.reload();
}

// TODO #3160 remove this transform once we change the shape of UserAppMetadata
export function transformImpersonatedUserAppMetadata(
  rawData: RawUserAppMetadata
): UserAppMetadata {
  return {
    state_code: rawData?.stateCode,
    allowed_supervision_location_ids: rawData?.allowedSupervisionLocationIds,
    allowed_supervision_location_level:
      rawData?.allowedSupervisionLocationLevel,
    routes: rawData?.routes,
    user_hash: rawData?.userHash,
  };
}

export function getEmailDomain(email: string) {
  return email.split("@").pop();
}
