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

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth0 } from "react-native-auth0";

import { useSnackbar } from "../shared/ui/Snackbar";
import { useMeetingEventQueue } from "./useMeetingEventQueue";
import { useProcessOfflineEvent } from "./useProcessOfflineEvent";

const TIMEOUT_MS = 500;
const RETRY_MAX = 3;

export function useOfflineQueueDrainer({ isOnline }: { isOnline: boolean }) {
  const wasOnlineRef = useRef<boolean | null>(null);
  const [isDraining, setIsDraining] = useState(false);

  const { head, dequeue, events } = useMeetingEventQueue();
  const { processEvent } = useProcessOfflineEvent();
  const { clearSession } = useAuth0();
  const { showSnackbar } = useSnackbar();

  // Keep a stable ref so the drain closure always calls the latest version
  // without needing to re-run the effect.
  const processEventRef = useRef(processEvent);
  processEventRef.current = processEvent;

  const isDrainingRef = useRef(false);

  const drain = useCallback(async () => {
    if (isDrainingRef.current) return;
    isDrainingRef.current = true;
    setIsDraining(true);

    let event = head();
    let retryCount = 0;
    while (event !== null) {
      // Sequential awaits are intentional here
      // eslint-disable-next-line no-await-in-loop
      const res = await processEventRef.current(event);

      if (res.status === "error") {
        // If we've lost auth, force login before dequeueing
        if (res.unauthenticated) {
          isDrainingRef.current = false;
          setIsDraining(false);
          clearSession();
          return;
        }
        // If we want to retry this event...
        if (retryCount < RETRY_MAX) {
          retryCount++;
          // eslint-disable-next-line no-await-in-loop
          await new Promise((resolve) => setTimeout(resolve, TIMEOUT_MS));
          continue;
        } else {
          // We're out of retries, event has failed. Stop draining and leave
          // the event at the head of the queue so it can be retried later
          // (through ReconnectStatus.tsx).
          console.error(
            `Failed to process event after ${RETRY_MAX} attempts:`,
            res.error,
          );
          showSnackbar(
            "Offline sync failed. Please retry when your connection is stable.",
          );
          break;
        }
      }

      retryCount = 0;
      dequeue();
      event = head();
    }

    isDrainingRef.current = false;
    setIsDraining(false);
  }, [dequeue, clearSession, head, showSnackbar]);

  useEffect(
    function onConnectionRestored() {
      const previouslyOnline = wasOnlineRef.current;
      wasOnlineRef.current = isOnline;

      const isNotReconnect = previouslyOnline !== false || !isOnline;
      if (isNotReconnect || isDrainingRef.current || events.length === 0) {
        return;
      }
      drain();
    },
    [events.length, isOnline, drain],
  );

  return { drain, isDraining };
}
