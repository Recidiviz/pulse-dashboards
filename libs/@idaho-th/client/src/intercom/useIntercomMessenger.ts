// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import Intercom, { shutdown, update } from "@intercom/messenger-js-sdk";
import { useEffect } from "react";

import { USER_ROLE, type UserRole } from "~@idaho-th/shared";

import { getIdahoThRuntimeConfig } from "../runtimeConfig";
import { trpc } from "../trpc/client";

/**
 * Boots the Intercom Messenger for the signed-in user and identifies them by
 * the backend-provided external_id (plus `user_hash` once Identity Verification
 * is configured server-side). Identity carries no PII — only the pseudonymous
 * external_id.
 *
 * Identity is fetched from the role's own endpoint, each guarded server-side by
 * the matching role procedure.
 *
 * No-ops when no Intercom app id is configured, so local/dev without
 * `VITE_INTERCOM_APP_ID` is unaffected. Shuts the Messenger down on unmount so a
 * conversation never bleeds across users on a shared device.
 *
 * Call this only from an authenticated surface.
 */
export function useIntercomMessenger(role: UserRole | undefined): void {
  const { intercomAppId } = getIdahoThRuntimeConfig();
  const active = Boolean(role) && Boolean(intercomAppId);

  const { data: staffAuth } = trpc.intercom.getMessengerAuthForStaff.useQuery(
    undefined,
    {
      enabled: active && role === USER_ROLE.STAFF,
      staleTime: Infinity,
      meta: { suppressGlobalError: true },
    },
  );

  const { data: providerAuth } =
    trpc.intercom.getMessengerAuthForProvider.useQuery(undefined, {
      enabled: active && role === USER_ROLE.PROVIDER,
      staleTime: Infinity,
      meta: { suppressGlobalError: true },
    });

  const data = staffAuth ?? providerAuth;

  useEffect(() => {
    if (!active || !intercomAppId) {
      return;
    }
    // Boot with the launcher visible so the bubble appears as soon as the app
    // id is configured, independent of the identity call below. Identity is
    // attached via update() once the role's query resolves.
    Intercom({ app_id: intercomAppId });
    return () => {
      shutdown();
    };
  }, [active, intercomAppId]);

  useEffect(() => {
    if (!active || !data) {
      return;
    }
    update({
      user_id: data.userId,
      ...(data.userHash ? { user_hash: data.userHash } : {}),
    });
  }, [active, data]);
}
