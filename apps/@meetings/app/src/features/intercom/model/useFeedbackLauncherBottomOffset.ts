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

import { useIsFocused } from "@react-navigation/native";
import { useEffect, useId } from "react";

import { useFeedbackLauncherVisibilityStore } from "./feedbackLauncherVisibility";

/**
 * Lifts the feedback launcher by `offset` pixels while the calling screen is focused
 */
export function useFeedbackLauncherBottomOffset(offset: number) {
  const key = useId();
  const isFocused = useIsFocused();
  const setBottomOffset = useFeedbackLauncherVisibilityStore(
    (state) => state.setBottomOffset,
  );

  useEffect(() => {
    if (!isFocused) return;
    setBottomOffset(key, offset);
    return () => setBottomOffset(key, null);
  }, [key, isFocused, offset, setBottomOffset]);
}
