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

import { useEffect, useRef } from "react";

import useIsOnline from "./useIsOnline";
import { useMeetingEventQueue } from "./useMeetingEventQueue";
import { useOfflineFailureQueue } from "./useOfflineFailureQueue";
import { useProcessOfflineEvent } from "./useProcessOfflineEvent";

const TIMEOUT_MS = 500;
const RETRY_MAX = 3;

export function useOfflineQueueDrainer() {
  const { isOnline } = useIsOnline();
  const wasOnlineRef = useRef<boolean | null>(null);
  const isDrainingRef = useRef(false);

  const { dequeue, events } = useMeetingEventQueue();
  const { enqueue: enqueueFailure } = useOfflineFailureQueue();
  const { processEvent } = useProcessOfflineEvent();

  // Keep a stable ref so the drain closure always calls the latest version
  // without needing to re-run the effect.
  const processEventRef = useRef(processEvent);
  processEventRef.current = processEvent;

  useEffect(() => {
    const previouslyOnline = wasOnlineRef.current;
    wasOnlineRef.current = isOnline;

    const isNotReconnect = previouslyOnline !== false || !isOnline;
    if (isNotReconnect || isDrainingRef.current || events.length === 0) {
      return;
    }

    async function drain() {
      isDrainingRef.current = true;

      let event = dequeue();
      let retryCount = 0;
      while (event !== null) {
        // Sequential awaits are intentional here
        // eslint-disable-next-line no-await-in-loop
        const res = await processEventRef.current(event);

        if (res.status === "error") {
          // If we want to retry this event...
          if (retryCount < RETRY_MAX) {
            retryCount++;
            // eslint-disable-next-line no-await-in-loop
            await new Promise((resolve) => setTimeout(resolve, TIMEOUT_MS));
            continue;
          } else {
            // We're out of retries, event has failed.
            console.error(
              `Failed to process event after ${RETRY_MAX} attempts:`,
              res.error,
            );

            //TODO AVid - Persist truly-failed events, deal with in future ticket (12931/12928)
            enqueueFailure(event);
          }
        }

        retryCount = 0;
        event = dequeue();
      }

      isDrainingRef.current = false;
    }

    drain();
  }, [isOnline, dequeue, events.length, enqueueFailure]);
}
