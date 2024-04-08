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

import { Link, Route, Routes } from "react-router-dom";
import styled from "styled-components/macro";

import { AuthWrapper } from "../AuthWrapper/AuthWrapper";
import { LogoutButton } from "../LogoutButton";
import { PageSearch } from "../PageSearch/PageSearch";
import { StoreProvider } from "../StoreProvider/StoreProvider";

const StyledApp = styled.div``;

export function App() {
  return (
    <StoreProvider>
      <AuthWrapper>
        <StyledApp>
          <br />
          <hr />
          <br />
          <div role="navigation">
            <ul>
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/search">search</Link>
              </li>
              <li>
                <Link to="/eligibility/sccp">SCCP</Link>
              </li>
              <li>
                <LogoutButton />
              </li>
            </ul>
          </div>
          <Routes>
            <Route path="/" element={<div>home page</div>} />
            <Route path="/search" element={<PageSearch />} />
            <Route path="/eligibility/:opportunityId/*">
              <Route
                index
                element={
                  <div>
                    <p>opportunity page</p>
                    <p>
                      <Link to="./about">about</Link>
                    </p>
                    <p>
                      <Link to="./requirements">requirements</Link>
                    </p>
                  </div>
                }
              />
              <Route path="about" element={<div>about opportunity</div>} />
              <Route
                path="requirements"
                element={<div>opportunity requirements</div>}
              />
            </Route>
          </Routes>
        </StyledApp>
      </AuthWrapper>
    </StoreProvider>
  );
}
