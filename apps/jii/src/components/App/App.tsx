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

import "./global.css";
import "@fontsource/public-sans/400.css";
import "@fontsource/public-sans/500.css";
import "@fontsource/public-sans/600.css";
import "@fontsource/public-sans/700.css";
import "@fontsource/libre-baskerville";

import {
  GlobalStyle as GlobalStyleBase,
  palette,
} from "@recidiviz/design-system";
import { Route, Routes } from "react-router-dom";
import styled, { createGlobalStyle } from "styled-components/macro";

import { EmailVerificationRequired } from "~auth";

import { NotFound } from "../NotFound/NotFound";
import { PageAfterLogin } from "../pages/PageAfterLogin";
import { PageEligibility } from "../pages/PageEligibility";
import { PageEligibilityHome } from "../pages/PageEligibilityHome";
import { PageHome } from "../pages/PageHome";
import { PageLanding } from "../pages/PageLanding";
import { PageOpportunityEligibility } from "../pages/PageOpportunityEligibility";
import { PageRoot } from "../pages/PageRoot";
import { PageSearch } from "../pages/PageSearch";
import { StoreProvider } from "../StoreProvider/StoreProvider";

const StyledApp = styled.div``;

const GlobalStyle = createGlobalStyle`
  body {
    background: ${palette.white};
  }
`;

export function App() {
  return (
    <StoreProvider>
      <GlobalStyleBase />
      <GlobalStyle />

      <StyledApp>
        <Routes>
          <Route path="/" element={<PageRoot />}>
            <Route index element={<PageHome />} />
            <Route path="welcome" element={<PageLanding />} />
            <Route path="verify" element={<EmailVerificationRequired />} />
            <Route path="after-login" element={<PageAfterLogin />} />
            <Route path="eligibility" element={<PageEligibility />}>
              <Route index element={<PageEligibilityHome />} />
              <Route path="search" element={<PageSearch />} />
              <Route path=":opportunityUrl">
                <Route index element={<PageOpportunityEligibility />} />
                <Route path="about" element={<div>about opportunity</div>} />
                <Route
                  path="requirements"
                  element={<div>opportunity requirements</div>}
                />
                <Route path="nextSteps" element={<div>next steps</div>} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </StyledApp>
    </StoreProvider>
  );
}
