// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { useEffect, useEffectEvent } from "react";

import { useResidentsContext } from "~@jii/data";

export function useTrackOnboardingSeenOnMount() {
  const { userProperties, residentsStore } = useResidentsContext();

  // this doesn't need to be reactive, we only want to run it once when the component mounts
  const trackOnboardingSeen = useEffectEvent(() => {
    if (!userProperties?.hasSeenOnboarding) {
      residentsStore.setUserProperties({ hasSeenOnboarding: new Date() });
    }
  });

  useEffect(
    () => {
      trackOnboardingSeen();
    },
    // we only want this to run once when the component mounts
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
}
