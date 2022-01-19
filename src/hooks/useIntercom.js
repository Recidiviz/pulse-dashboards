// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2021 Recidiviz, Inc.
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

import crypto from "crypto";
import { useEffect } from "react";

import { useRootStore } from "../components/StoreProvider";
import { isDemoMode } from "../utils/isDemoMode";

const useIntercom = () => {
  const { userStore, tenantStore } = useRootStore();
  const { user } = userStore;
  const hash = isDemoMode
    ? crypto
        .createHmac("sha256", process.env.REACT_APP_INTERCOM_APP_KEY)
        .update(user.sub || "")
        .digest("hex")
    : undefined;

  useEffect(() => {
    window.Intercom("update", {
      state_code: tenantStore.currentTenantId,
      name: user.name,
      nickname: user.nickname,
      email: user.email,
      user_id: user.sub,
      hide_default_launcher: false,
      user_hash: hash,
    });
  }, [
    tenantStore.currentTenantId,
    user.name,
    user.nickname,
    user.email,
    user.sub,
    hash,
  ]);

  useEffect(() => {
    return () => {
      window.Intercom("update", { hide_default_launcher: true });
    };
  }, []);
};

export default useIntercom;
