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

import NetInfo, { useNetInfo } from "@react-native-community/netinfo";
import { onlineManager } from "@tanstack/react-query";

import env from "../env";

NetInfo.configure({
  reachabilityUrl: `${env.EXPO_PUBLIC_SERVER_URL}health`,
  reachabilityTest: async (response) => response.status === 200,
  reachabilityLongTimeout: 60 * 1000,
  reachabilityShortTimeout: 5 * 1000,
  reachabilityRequestTimeout: 10 * 1000,
});

// Override react-query's online management status with netinfo's so that
// connection status is 1:1
onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => {
    setOnline(state.isInternetReachable ?? state.isConnected ?? true);
  }),
);

export default function useIsOnline() {
  const { isInternetReachable } = useNetInfo();
  const isOnline = isInternetReachable ?? true;
  return { isOnline };
}
