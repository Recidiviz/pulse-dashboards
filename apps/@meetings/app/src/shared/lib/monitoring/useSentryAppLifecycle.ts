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

import * as Sentry from "@sentry/react-native";
import { useEffect } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";

export function useSentryAppLifecycle() {
  useEffect(() => {
    if (Platform.OS === "web") {
      const handleVisibilityChange = () => {
        if (document.visibilityState === "hidden") {
          Sentry.logger.info("app.background", { trigger: "visibilitychange" });
        } else if (document.visibilityState === "visible") {
          Sentry.logger.info("app.foreground", { trigger: "visibilitychange" });
        }
      };

      const handleBeforeUnload = () => {
        Sentry.logger.info("app.unload");
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("beforeunload", handleBeforeUnload);

      return () => {
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange,
        );
        window.removeEventListener("beforeunload", handleBeforeUnload);
      };
    } else {
      const handleAppStateChange = (nextState: AppStateStatus) => {
        if (nextState === "background" || nextState === "inactive") {
          Sentry.logger.info("app.background", { appState: nextState });
        } else if (nextState === "active") {
          Sentry.logger.info("app.foreground", { appState: nextState });
        }
      };

      const subscription = AppState.addEventListener(
        "change",
        handleAppStateChange,
      );

      return () => {
        subscription.remove();
      };
    }
  }, []);
}
