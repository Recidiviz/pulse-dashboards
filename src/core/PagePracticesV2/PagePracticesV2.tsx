// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import {
  Assets,
  AVAILABLE_FONTS,
  palette,
  spacing,
} from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import React from "react";
import { Switch, useRouteMatch } from "react-router-dom";
import styled, { ThemeProvider } from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import cssVars from "../CoreConstants.scss";
import ModelHydrator from "../ModelHydrator";
import { PracticesCaseloadSelection } from "../PracticesCaseloadSelection";
import PracticesClientProfile from "../PracticesClientProfile";
import PracticesRoute from "../PracticesRoute";
import { PRACTICES_PAGES } from "../views";

const Wrapper = styled.div`
  display: grid;
  font-family: ${(props) => props.theme.fonts.body};
  font-weight: 500;
  grid-template-columns: 350px 1fr;
  letter-spacing: -0.01em;
  position: relative;
  width: 100%;

  @media screen and (min-width: ${cssVars.breakpointSm}) {
    padding-right: 0;
  }
`;

const Sidebar = styled.div`
  padding: 0 ${spacing.md}px;
`;

const Divider = styled.hr`
  border-top: 1px solid ${palette.slate20};
  margin: ${spacing.lg}px 0;
  width: 100%;
`;

const LogoImg = styled.img`
  width: auto;
  height: 22px;
`;

const PagePracticesV2: React.FC = () => {
  const { practicesStore } = useRootStore();
  const { path } = useRouteMatch();

  return (
    <ThemeProvider
      theme={{
        fonts: {
          heading: AVAILABLE_FONTS.LIBRE_BASKERVILLE,
          body: AVAILABLE_FONTS.PUBLIC_SANS,
          serif: AVAILABLE_FONTS.LIBRE_BASKERVILLE,
          sans: AVAILABLE_FONTS.PUBLIC_SANS,
        },
      }}
    >
      <ModelHydrator model={practicesStore}>
        <Wrapper>
          <Sidebar>
            <LogoImg src={Assets.LOGO} alt="Recidiviz" />
            <Divider />
            <Switch>
              <PracticesRoute exact path={path}>
                <PracticesCaseloadSelection />
              </PracticesRoute>
              <PracticesRoute
                path={`${path}/${PRACTICES_PAGES.compliantReporting}/:clientId`}
              >
                <PracticesClientProfile />
              </PracticesRoute>
            </Switch>
          </Sidebar>
        </Wrapper>
      </ModelHydrator>
    </ThemeProvider>
  );
};

export default observer(PagePracticesV2);
