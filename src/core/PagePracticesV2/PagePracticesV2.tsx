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
import { rem } from "polished";
import React from "react";
import { Switch, useRouteMatch } from "react-router-dom";
import styled, { ThemeProvider } from "styled-components/macro";

import NotFound from "../../components/NotFound";
import { useRootStore } from "../../components/StoreProvider";
import isIE11 from "../../utils/isIE11";
import cssVars from "../CoreConstants.scss";
import ModelHydrator from "../ModelHydrator";
import { PracticesCaseloadSelection } from "../PracticesCaseloadSelection";
import PracticesClientProfile from "../PracticesClientProfile";
import PracticesCompliantReportingForm from "../PracticesCompliantReportingForm/PracticesCompliantReportingForm";
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
  padding: ${rem(spacing.md)};
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

const PracticesSidebar: React.FC = ({ children }) => {
  return (
    <Sidebar>
      <LogoImg src={Assets.LOGO} alt="Recidiviz" />
      <Divider />
      {children}
    </Sidebar>
  );
};

const SidebarHeading = styled.h1`
  color: ${palette.pine2};
  font-family: ${(props) => props.theme.fonts.sans};
  font-size: ${rem(18)};
  font-weight: 500;
  letter-spacing: -0.02em;
  line-height: 1.3;
`;

const IE11Warning = styled.div`
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-content: center;
  text-align: center;
  height: auto;
  width: 100%;
  margin: auto;
`;

const PagePracticesV2: React.FC = () => {
  const { practicesStore } = useRootStore();
  const { path } = useRouteMatch();

  if (isIE11()) {
    return (
      <IE11Warning>
        <h1>This page is not supported in Internet Explorer 11.</h1>
        <h3>
          Please switch to Chrome, Firefox, Edge, or another modern browser and
          try again.
        </h3>
      </IE11Warning>
    );
  }

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
          <Switch>
            <PracticesRoute exact path={path}>
              <PracticesSidebar>
                <SidebarHeading>Compliant Reporting</SidebarHeading>
                <PracticesCaseloadSelection />
              </PracticesSidebar>
            </PracticesRoute>
            <PracticesRoute
              path={`${path}/${PRACTICES_PAGES.compliantReporting}/:clientId`}
            >
              <PracticesSidebar>
                <PracticesClientProfile />
              </PracticesSidebar>
              <PracticesCompliantReportingForm />
            </PracticesRoute>
            <NotFound />
          </Switch>
        </Wrapper>
      </ModelHydrator>
    </ThemeProvider>
  );
};

export default observer(PagePracticesV2);
