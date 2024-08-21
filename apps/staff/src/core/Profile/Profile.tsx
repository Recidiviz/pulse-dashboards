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

import "./Profile.scss";

import { Button, TooltipTrigger } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import React from "react";
import { Link, useNavigate } from "react-router-dom";

import { isOfflineMode } from "~client-env-utils";

import StateSelection from "../../components/StateSelection";
import { useUserStore } from "../../components/StoreProvider";
import useLogout from "../../hooks/useLogout";
import CoreStoreProvider from "../CoreStoreProvider";
import MobileNavigation from "../MobileNavigation";
import PageTemplate from "../PageTemplate";
import FeatureVariantsList from "./FeatureVariantsList";
import { ImpersonationForm } from "./ImpersonationForm";

function Profile() {
  const userStore = useUserStore();
  const { user } = userStore;
  const logout = useLogout();
  const navigate = useNavigate();

  const showImpersonationForm =
    userStore.isImpersonating || userStore.isRecidivizUser;

  const showFeatureVariants =
    userStore.isImpersonating ||
    userStore.isRecidivizUser ||
    userStore.isCSGUser;

  const handleImpersonation = async ({ email }: { email: string }) => {
    const impersonated = await userStore.impersonateUser(email);
    if (impersonated) {
      navigate("/");
    }
  };

  const copyright = <span>© {new Date().getFullYear()}</span>;

  return (
    <CoreStoreProvider>
      <PageTemplate mobileNavigation={<MobileNavigation title="Profile" />}>
        <div className="Profile">
          <div className="Profile__header-container">
            <div className="Profile__title-container">
              <div className="Profile__title">{user?.email}</div>
              <div className="Profile__subtitle">{userStore.stateName}</div>
            </div>
            {showImpersonationForm && (
              <ImpersonationForm
                onSubmit={handleImpersonation}
                isImpersonating={userStore.isImpersonating}
                impersonationError={userStore.impersonationError}
              />
            )}
          </div>
          <StateSelection />
          <div>
            <Link to="/">
              <Button className="Profile__button">Back to dashboard</Button>
            </Link>
            <Button
              className="Profile__button"
              onClick={logout}
              disabled={isOfflineMode()}
            >
              Log out
            </Button>
          </div>
          <div className="Profile__footer">
            {showFeatureVariants ? (
              <TooltipTrigger contents={<FeatureVariantsList />}>
                {copyright}
              </TooltipTrigger>
            ) : (
              copyright
            )}
            <a
              href="https://www.recidiviz.org"
              target="_blank"
              rel="noopener noreferrer"
            >
              Recidiviz
            </a>
            ·
            <a
              href="https://www.recidiviz.org/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy Policy
            </a>
            ·
            <a
              href="https://www.recidiviz.org/legal/terms"
              target="_blank"
              rel="noopener noreferrer"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </PageTemplate>
    </CoreStoreProvider>
  );
}

export default observer(Profile);
