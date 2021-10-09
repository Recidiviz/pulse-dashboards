// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2021 Recidiviz, Inc.
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

import "./PathwaysProfile.scss";

import { observer } from "mobx-react-lite";
import React, { useCallback } from "react";

import StateSelection from "../../components/StateSelection";
import { useRootStore } from "../../components/StoreProvider";
import MobileNavigation from "../MobileNavigation";
import PageTemplate from "../PageTemplate";

const PathwaysProfile = () => {
  const { userStore } = useRootStore();
  const { user, logout } = userStore;

  const onLogout = useCallback(
    (e) => {
      e.preventDefault();
      logout({ returnTo: window.location.origin });
    },
    [logout]
  );

  return (
    <PageTemplate mobileNavigation={<MobileNavigation title="Profile" />}>
      <div className="PathwaysProfile">
        <>
          <div className="PathwaysProfile__title">{user.email}</div>
          <div className="PathwaysProfile__subtitle">{userStore.stateName}</div>
          <StateSelection />
          <button
            type="button"
            className="PathwaysProfile__log-out-button"
            onClick={onLogout}
          >
            Log out
          </button>
        </>
        <div className="PathwaysProfile__footer">
          © {new Date().getFullYear()}
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
  );
};

export default observer(PathwaysProfile);
