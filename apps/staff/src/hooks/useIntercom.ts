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

import { update } from "@intercom/messenger-js-sdk";
import { useEffect } from "react";

import {
  PartiallyTypedRootStore,
  useRootStore,
} from "../components/StoreProvider";

const useIntercom = () => {
  // TODO(#5636) Eliminate PartiallyTypedRootStore
  const { userStore, tenantStore } = useRootStore() as PartiallyTypedRootStore;
  const { user, userAppMetadata = {} } = userStore;

  useEffect(() => {
    update({
      state_code: tenantStore.currentTenantId,
      name: user.name,
      nickname: user.nickname,
      email: user.email,
      user_id: userAppMetadata.segmentId,
      hide_default_launcher: false,
      user_hash: userAppMetadata.intercomId,
    });
  }, [
    tenantStore.currentTenantId,
    user.name,
    user.nickname,
    user.email,
    user.sub,
    userAppMetadata.segmentId,
    userAppMetadata.intercomId,
  ]);

  useEffect(() => {
    return () => {
      update({ hide_default_launcher: true });
    };
  }, []);
};

export default useIntercom;
