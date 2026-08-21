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

import { runInAction } from "mobx";
import { useLayoutEffect } from "react";

import { useRootStore } from "~@jii/data";

/**
 * Activates the header override for the duration of the component's lifetime,
 * hiding AppLayout's default header so a feature can render its own nav header.
 * useLayoutEffect (not useEffect) ensures the flag is set before the first paint,
 * preventing a flash of the default header.
 *
 * To use this correctly:
 * 1. Call this at the component whose lifecycle matches the desired override
 *    duration — route-level for a full-page takeover, feature-level if the custom
 *    header should only be active while a specific feature is mounted.
 * 2. Render a replacement header in that same component — without one, users are
 *    left with no navigation.
 * 3. Pin your replacement header's height to HEADER_HEIGHT from ~@jii/common-ui
 *    to stay compatible with other layout assumptions in AppLayout.
 * 4. If your header is fixed/sticky, add matching top padding to the page content
 *    so it isn't obscured.
 *
 * TODO: the app shell should support custom nav bar features on deep routes more
 * structurally to remove these implicit coupling requirements across unrelated
 * components. See: https://app.notion.com/p/3c27889f4d1980879896c89447783c86
 */
export function useHeaderOverride() {
  const { uiStore } = useRootStore();

  useLayoutEffect(() => {
    runInAction(() => {
      uiStore.headerOverrideActive = true;
    });
    return () => {
      runInAction(() => {
        uiStore.headerOverrideActive = false;
        uiStore.hideHeaderBar = false;
      });
    };
  }, [uiStore]);
}
