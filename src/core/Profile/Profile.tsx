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

import "./Profile.scss";

import { Button, palette } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import React, { MutableRefObject, useCallback, useRef, useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components/macro";

import StateSelection from "../../components/StateSelection";
import StateSelector from "../../components/StateSelector";
import { useRootStore } from "../../components/StoreProvider";
import { stopImpersonating } from "../../utils/impersonation";
import { isOfflineMode } from "../../utils/isOfflineMode";
import MobileNavigation from "../MobileNavigation";
import PageTemplate from "../PageTemplate";

const EmailInput = styled.input`
  display: inline-block;
  min-height: 1.1em;
  border-color: ${palette.slate10};
  border-radius: 4px;
  border-width: 1px;
  margin: 0.5rem 0;
  width: 100%;
  font-family: "Public Sans", sans-serif;
  min-height: 2rem;
  padding: 0.5rem;
`;

const ImpersonationSection: React.FC<{
  isImpersonating: boolean;
  defaultStateCode: string;
  onSubmit: ({
    email,
    stateCode,
  }: {
    email: string;
    stateCode: string;
  }) => void;
}> = ({ defaultStateCode, isImpersonating, onSubmit }) => {
  const [stateCode, setStateCode] = useState(defaultStateCode);
  const inputRef = useRef<HTMLInputElement>(
    null
  ) as MutableRefObject<HTMLInputElement>;

  const setInputRef = React.useCallback(
    (inputElement: HTMLInputElement | null) => {
      if (inputElement) {
        inputRef.current = inputElement;
      }
    },
    []
  );
  return (
    <div className="Profile__impersonation">
      <div className="Profile__impersonation__title">
        Select state and enter e-mail address to impersonate:
      </div>
      <div className="Profile__impersonation__StateSelector">
        <StateSelector onChange={(option) => setStateCode(option.value)} />
      </div>
      <div className="Profile__impersonation__email">
        <EmailInput
          ref={setInputRef}
          placeholder="Enter an email to impersonate..."
        />
      </div>
      <div className="Profile__impersonation__submit">
        <Button
          className="Profile__impersonation__button"
          onClick={() => onSubmit({ email: inputRef.current.value, stateCode })}
          disabled={isOfflineMode()}
        >
          Impersonate
        </Button>
        {isImpersonating ? (
          <Button
            className="Profile__impersonation__button__stop"
            onClick={() => stopImpersonating()}
          >
            Stop Impersonating
          </Button>
        ) : null}
      </div>
    </div>
  );
};

function Profile() {
  const { userStore, tenantStore } = useRootStore();
  const { user, logout } = userStore;

  const onLogout = useCallback(
    (e) => {
      e.preventDefault();
      logout({ returnTo: window.location.origin });
    },
    [logout]
  );
  const showImpersonationSection =
    userStore.user.impersonator || userStore.isRecidivizUser;

  const handleImpersonation = async ({
    email,
    stateCode,
  }: {
    email: string;
    stateCode: string;
  }) => {
    await userStore.impersonateUser(email, stateCode);
  };

  return (
    <PageTemplate mobileNavigation={<MobileNavigation title="Profile" />}>
      <div className="Profile">
        <div className="Profile__header-container">
          <div className="Profile__title-container">
            <div className="Profile__title">{user.email}</div>
            <div className="Profile__subtitle">{userStore.stateName}</div>
          </div>
          {showImpersonationSection && (
            <ImpersonationSection
              defaultStateCode={tenantStore.currentTenantId}
              onSubmit={handleImpersonation}
              isImpersonating={userStore.isImpersonating}
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
            onClick={onLogout}
            disabled={isOfflineMode()}
          >
            Log out
          </Button>
        </div>
        <div className="Profile__footer">
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
}

export default observer(Profile);
