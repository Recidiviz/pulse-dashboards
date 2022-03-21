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

import { Assets, palette, spacing } from "@recidiviz/design-system";
import cn from "classnames";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React from "react";
import { Switch, useRouteMatch } from "react-router-dom";
import ReactSelect from "react-select";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import cssVars from "../CoreConstants.scss";
import ModelHydrator from "../ModelHydrator";
import PracticesClientProfile from "../PracticesClientProfile";
import PracticesRoute from "../PracticesRoute";
import PracticesSearch from "../PracticesSearch";
import { PRACTICES_PAGES } from "../views";

const Wrapper = styled.div`
  display: grid;
  font: ${cssVars.fontUiSans16};
  grid-template-columns: 350px 1fr;
  position: relative;
  width: 100%;

  @media screen and (min-width: ${cssVars.breakpointSm}) {
    padding-right: 0;
  }
`;

const Sidebar = styled.div`
  padding: 0 ${spacing.md}px;
`;

const Contents = styled.div`
  padding: ${spacing.xxl}px;
  flex: 0 1 872px;
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

const Label = styled.div`
  font-style: normal;
  font-size: ${rem(13)};

  letter-spacing: -0.01em;

  color: ${palette.slate60};
`;

const PagePracticesV2: React.FC = () => {
  const { practicesStore } = useRootStore();
  const { path } = useRouteMatch();

  return (
    <ModelHydrator model={practicesStore}>
      <Wrapper>
        <Sidebar>
          <LogoImg src={Assets.LOGO} alt="Recidiviz" />
          <Divider />

          <Switch>
            <PracticesRoute exact path={path}>
              <Label>Officer</Label>
              <ReactSelect
                className={cn("Select")}
                classNamePrefix="Select"
                options={practicesStore.availableOfficers.map((officer) => ({
                  label: officer.name,
                  value: officer.id,
                }))}
                placeholder="Select an officer..."
              />
              <Divider />
            </PracticesRoute>
            <PracticesRoute
              path={`${path}/${PRACTICES_PAGES.compliantReporting}/:clientId`}
            >
              <PracticesClientProfile />
            </PracticesRoute>
          </Switch>
        </Sidebar>
        <Contents>
          <PracticesSearch />
          <Divider />
        </Contents>
      </Wrapper>
    </ModelHydrator>
  );
};

export default observer(PagePracticesV2);
