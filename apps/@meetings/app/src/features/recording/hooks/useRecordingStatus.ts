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

import { RecordingStatus } from "../types";
import { getRecordingState, setRecordingState } from "../utils/storage";

export function useRecordingStatus() {
  const [status, setStatus] = useState<RecordingStatus | null>(null);

  const updateStatus = async (newStatus: RecordingStatus) => {
    setStatus(newStatus);
    await setRecordingState(newStatus);
  };

  useEffect(() => {
    async function loadStatus() {
      const persistedStatus = await getRecordingState();
      setStatus(persistedStatus);
    }
    loadStatus();
  }, []);

  return [status, updateStatus] as const;
}
