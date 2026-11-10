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

import { Assets } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import React from "react";

import { useIdahoTHStore } from "../../../datastores/IdahoTHStoreContext";
import { BodyS1 } from "../../../styles";
import { ActionItem } from "../types";
import * as Styled from "./AppHeader.styles";

interface AppHeaderProps {
  actions?: ActionItem[];
}

// eslint-disable-next-line react/display-name
export const AppHeader: React.FC<AppHeaderProps> = observer(({ actions }) => {
  const { rootStore } = useIdahoTHStore();
  const userStore = rootStore.userStore;

  const handleLoginClick = () => {
    userStore.loginWithRedirect();
  };

  const handleLogoutClick = () => {
    userStore.logout?.({ logoutParams: { returnTo: window.location.origin } });
  };

  return (
    <Styled.Header>
      <Styled.LogoContainer>
        <Styled.Logo>
          <Styled.RecidivizLogoImg src={Assets.LOGO} alt="Recidiviz" />
        </Styled.Logo>
      </Styled.LogoContainer>
      <Styled.ActionsContainer>
        {actions?.map(({ key, label, onClick }) => (
          <Styled.TextButton key={key} type="button" onClick={onClick}>
            <BodyS1>{label}</BodyS1>
          </Styled.TextButton>
        ))}
        {userStore.isAuthorized ? (
          <Styled.TextButton type="button" onClick={handleLogoutClick}>
            <BodyS1>Log out</BodyS1>
          </Styled.TextButton>
        ) : (
          <Styled.TextButton type="button" onClick={handleLoginClick}>
            <BodyS1>Log in</BodyS1>
          </Styled.TextButton>
        )}
      </Styled.ActionsContainer>
    </Styled.Header>
  );
});
