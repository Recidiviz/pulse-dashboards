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

import { Loading } from "@recidiviz/design-system";
import { withErrorBoundary } from "@sentry/react";
import { observer } from "mobx-react-lite";
import { Suspense } from "react";
import { Outlet } from "react-router-dom";

import { PageContainer } from "~@jii/common-ui";

import { AuthManagerHydrator } from "../AuthManagerHydrator/AuthManagerHydrator";
import { ErrorPage } from "../ErrorPage/ErrorPage";
import { ScrollToTop } from "../ScrollToTop/ScrollToTop";
import { usePageviewTracking } from "../usePageviewTracking/usePageviewTracking";

export const PageRoot = withErrorBoundary(
  observer(function AppRoot() {
    usePageviewTracking();

    return (
      <Suspense fallback={<Loading />}>
        <AuthManagerHydrator>
          <PageContainer>
            <Outlet />
          </PageContainer>
          <ScrollToTop />
        </AuthManagerHydrator>
      </Suspense>
    );
  }),
  { fallback: ErrorPage },
);
