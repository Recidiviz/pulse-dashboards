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

import { memo } from "react";
import { Outlet } from "react-router-dom";

import { AuthClientHydrator } from "~auth";

import { BaseLayout } from "../BaseLayout/BaseLayout";
import { ScrollToTop } from "../ScrollToTop/ScrollToTop";
import { useRootStore } from "../StoreProvider/useRootStore";

export const PageRoot = memo(function AppRoot() {
  const {
    userStore: { authClient },
  } = useRootStore();

  return (
    <AuthClientHydrator authClient={authClient}>
      <BaseLayout>
        <Outlet />
      </BaseLayout>
      <ScrollToTop />
    </AuthClientHydrator>
  );
});
