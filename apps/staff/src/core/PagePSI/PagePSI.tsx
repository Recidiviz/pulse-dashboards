// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import { palette, spacing, typography } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import styled from "styled-components/macro";

import { CaseDetails, Dashboard, psiRoute, psiUrl } from "~sentencing-client";

import NotFound from "../../components/NotFound";
import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { NavigationLayout } from "../NavigationLayout";

const Wrapper = styled.div`
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  background-color: ${palette.marble1};
  ${typography.Sans14};
`;

const Main = styled.main<{
  isMobile: boolean;
  hasPadding?: boolean;
}>`
  display: flex;
  flex-direction: column;
  flex: auto;
  padding: ${({ isMobile }) =>
    isMobile ? `${rem(spacing.lg)} ${rem(spacing.md)}` : `${rem(spacing.lg)}`};
  ${({ hasPadding }) => !hasPadding && `padding: 0 !important;`}
`;

const PagePSI: React.FC = function PagePSI() {
  window.scrollTo({
    top: 0,
  });

  const { psiStore } = useRootStore();
  const { isMobile } = useIsMobile(true);

  return (
    <Wrapper>
      <NavigationLayout />
      <Main isMobile={isMobile}>
        <Routes>
          <Route
            index
            element={
              <Navigate
                to={psiUrl("dashboard", {
                  staffPseudoId: psiStore.staffPseudoId,
                })}
                replace
              />
            }
          />
          <Route
            path={psiRoute({ routeName: "dashboard" })}
            element={<Dashboard psiStore={psiStore} />}
          />
          <Route
            path={psiRoute({ routeName: "caseDetails" })}
            element={<CaseDetails psiStore={psiStore} />}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Main>
    </Wrapper>
  );
};

export default observer(PagePSI);
