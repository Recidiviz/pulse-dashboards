// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { FC } from "react";
import { useTypedParams } from "react-router-typesafe-routes/dom";

import { EmailVerification, State } from "../../routes/routes";
import { LandingPageLayout } from "../LandingPages/LandingPageLayout";
import { LandingStateSpecific } from "../LandingPages/LandingStateSpecific";
import { Redirect } from "../Redirect/Redirect";
import { useRootStore } from "../StoreProvider/useRootStore";

export const PageState: FC = () => {
  const { userStore } = useRootStore();
  const { stateSlug } = useTypedParams(State);

  try {
    if (userStore.authClient.isAuthorized) {
      if (userStore.isAuthorizedForCurrentState) {
        // known residents should be sent to their homepage
        if (userStore.pseudonymizedId) {
          return (
            <Redirect
              to={State.Resident.Eligibility.buildPath({
                stateSlug,
                personPseudoId: userStore.pseudonymizedId,
              })}
            />
          );
        }

        // if not a known resident, search is the only other fallback.
        // if they don't have permission it will be handled by that page
        return <Redirect to={State.Search.buildPath({ stateSlug })} />;
      }
    }
  } catch {
    // fall through
  }

  if (userStore.authClient.isEmailVerificationRequired) {
    return <Redirect to={EmailVerification.buildPath({})} />;
  }

  return (
    <LandingPageLayout>
      <LandingStateSpecific />
    </LandingPageLayout>
  );
};
