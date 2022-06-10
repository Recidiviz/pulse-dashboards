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

import { palette, spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components/macro";

import cssVars from "../CoreConstants.module.scss";
import RecidivizLogo from "../RecidivizLogo";
import { PATHWAYS_VIEWS } from "../views";

const Wrapper = styled.div`
  align-items: stretch;
  display: grid;
  font-family: ${(props) => props.theme.fonts.body};
  font-weight: 500;
  grid-template-columns: 350px 1fr;
  letter-spacing: -0.01em;
  position: relative;
  min-height: 100vh;
  width: 100%;

  @media screen and (min-width: ${cssVars.breakpointSm}) {
    padding-right: 0;
  }
`;

const Sidebar = styled.div`
  background: ${palette.marble1};
`;

const SidebarSection = styled.section`
  padding: ${rem(spacing.md)};

  &:first-child {
    border-bottom: 1px solid ${palette.slate20};
  }
`;

const SidebarWrapper: React.FC = ({ children }) => {
  return (
    <Sidebar>
      <SidebarSection>
        <Link to={`/${PATHWAYS_VIEWS.workflows}`}>
          <RecidivizLogo />
        </Link>
      </SidebarSection>
      <SidebarSection>{children}</SidebarSection>
    </Sidebar>
  );
};

const FormWrapper = styled.div``;

type FormLayoutProps = {
  sidebarContents: React.ReactNode;
  formContents: React.ReactNode;
};

export const WorkflowsFormLayout = ({
  sidebarContents,
  formContents,
}: FormLayoutProps): JSX.Element => {
  return (
    <Wrapper>
      <SidebarWrapper>{sidebarContents}</SidebarWrapper>
      <FormWrapper>{formContents}</FormWrapper>
    </Wrapper>
  );
};
