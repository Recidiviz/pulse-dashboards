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

import { useEffect, useState } from "react";

import { AudioUpload } from "../features/audio-upload";
import { RecordingProvider } from "../features/recording";
import useIsOnline from "../hooks/useIsOnline.native";
import { useOfflineQueueDrainer } from "../hooks/useOfflineQueueDrainer";
import DrawerNavigator from "./DrawerNavigator";

export function AuthenticatedContent() {
  const { drain: forceDrain } = useOfflineQueueDrainer();
  const { isOnline } = useIsOnline();
  const [isFirstRender, setIsFirstRender] = useState(true);

  // On fresh login, we want to force-drain the offline event queue in the event
  // that the user was logged out while the queue was being drained due to
  // losing auth.
  useEffect(
    function onLogin() {
      if (isOnline && isFirstRender) {
        forceDrain();
      }
      setIsFirstRender(false);
    },
    [forceDrain, isOnline, isFirstRender],
  );

  return (
    <RecordingProvider>
      <DrawerNavigator />
      <AudioUpload />
    </RecordingProvider>
  );
}
