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

import { withErrorBoundary } from "@sentry/react";
import { observer } from "mobx-react-lite";
import { Suspense, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

import AuthProvider from "../AuthProvider/AuthProvider";
import PublicPathwaysLoading from "../PublicPathwaysLoading";
import { PageError } from "./PageError";
import { PageContainer } from "./styles";

export const PageRoot = withErrorBoundary(
  observer(function AppRoot() {
    const { pathname } = useLocation();

    useEffect(() => {
      window.scrollTo(0, 0);
    }, [pathname]);

    return (
      <Suspense fallback={<PublicPathwaysLoading />}>
        <AuthProvider>
          <PageContainer>
            <Outlet />
          </PageContainer>
        </AuthProvider>
      </Suspense>
    );
  }),
  { fallback: PageError },
);
