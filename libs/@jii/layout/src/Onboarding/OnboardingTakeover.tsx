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

import { observer } from "mobx-react-lite";
import { FC, ReactNode } from "react";

import { Redirect } from "~@jii/common-ui";
import { useResidentsContext } from "~@jii/data";
import { isOfflineMode } from "~client-env-utils";

/**
 * Magic handle for bypassing the onboarding behavior. Mainly useful in e2e test scenarios
 */
function isOnboardingDisabled(): boolean {
  return (
    isOfflineMode() && localStorage.getItem("disableOnboarding") === "true"
  );
}

export const OnboardingTakeover: FC<{
  children: ReactNode;
  onboardingUrl: string;
}> = observer(function OnboardingTakeover({ children, onboardingUrl }) {
  const { userProperties } = useResidentsContext();

  const hasSeenOnboarding =
    isOnboardingDisabled() || userProperties?.hasSeenOnboarding;

  if (!hasSeenOnboarding) {
    return <Redirect to={onboardingUrl} />;
  }

  return children;
});
