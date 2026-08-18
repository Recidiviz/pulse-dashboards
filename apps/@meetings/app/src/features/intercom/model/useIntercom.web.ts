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

import Intercom, { show } from "@intercom/messenger-js-sdk";
import { useEffect } from "react";

import { useUserContext } from "~@meetings/app/entities/user";
import { env } from "~@meetings/app/shared/config";

export function useIntercom() {
  const { name, email, segmentId, intercomId } = useUserContext();

  useEffect(() => {
    if (!env.EXPO_PUBLIC_INTERCOM_APP_ID || !intercomId) return;
    Intercom({
      app_id: env.EXPO_PUBLIC_INTERCOM_APP_ID,
      name,
      email,
      user_id: segmentId,
      user_hash: intercomId,
    });
  }, [name, email, segmentId, intercomId]);

  return { openMessenger: show };
}
