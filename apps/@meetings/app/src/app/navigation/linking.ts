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

import {
  findFocusedRoute,
  getPathFromState as defaultGetPathFromState,
  getStateFromPath as defaultGetStateFromPath,
  LinkingOptions,
} from "@react-navigation/native";

import {
  extractAndRemoveStateCode,
  stateCodeParam,
} from "~@meetings/app/entities/state-code";
import { AppStackParamList } from "~@meetings/app/shared/config";

export const linking: LinkingOptions<AppStackParamList> = {
  prefixes: [],
  config: {
    screens: {
      Login: "login",
      Main: {
        screens: {
          Onboarding: "onboarding",
          ClientsRoot: {
            screens: {
              Clients: "clients",
              ClientProfile: "clients/:personId",
              ClientNewMeeting: "clients/:personId/new-meeting",
              ClientMeeting: "clients/:personId/meetings/:meetingId",
            },
          },
          ResidentsRoot: {
            screens: {
              Residents: "residents",
              ResidentProfile: "residents/:personId",
              ResidentNewMeeting: "residents/:personId/new-meeting",
              ResidentMeeting: "residents/:personId/meetings/:meetingId",
            },
          },
          StateSelection: "settings",
        },
      },
    },
  },
  // Extract stateCode before default URL parsing so it isn't stored as a
  // screen param. The value is kept in stateCodeParam for getPathFromState.
  getStateFromPath(path, config) {
    const { stateCode, cleanPath } = extractAndRemoveStateCode(path);
    if (stateCode) {
      stateCodeParam.current = stateCode;
    }
    const state = defaultGetStateFromPath(cleanPath, config);
    // Drop the focused route's stamped path: getPathForRoute prefers it over
    // getPathFromState, which would strip the stateCode param we re-inject there.
    const focused = state ? findFocusedRoute(state) : undefined;
    if (focused) {
      delete (focused as { path?: string }).path;
    }
    return state;
  },
  // Re-inject stateCode as a query param on every URL React Navigation generates,
  // so it persists across all navigation events.
  getPathFromState(state, config) {
    const path = defaultGetPathFromState(state, config);
    if (!stateCodeParam.current) return path;
    const separator = path.includes("?") ? "&" : "?";
    return `${path}${separator}stateCode=${encodeURIComponent(stateCodeParam.current)}`;
  },
};
