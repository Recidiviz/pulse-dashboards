// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { observer } from "mobx-react-lite";
import { Toaster } from "react-hot-toast";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import {
  HousingApplications,
  HousingProviderGate,
  LoginPage,
  ProviderApplications,
  useIntercomMessenger,
} from "~@idaho-th/client";
import {
  APP_METADATA_KEY,
  type IdahoThAppMetadata,
  USER_ROLE,
  type UserRole,
} from "~@idaho-th/shared";

import { StoreProvider, useRootStore } from "./datastores/StoreProvider";
import { ErrorBoundary } from "./ErrorBoundary";
import ProtectedLayout from "./ProtectedLayout/ProtectedLayout";

const RoleBasedRoutes = observer(function RoleBasedRoutes() {
  const { userStore } = useRootStore();
  const { user } = userStore;

  const appMetadata = user?.[APP_METADATA_KEY] as
    | IdahoThAppMetadata
    | undefined;
  const role = appMetadata?.role as UserRole | undefined;
  const providerPseudonymizedId =
    role === USER_ROLE.PROVIDER ? appMetadata?.pseudonymizedId : undefined;

  // Boot the Intercom Messenger for the signed-in user. No-ops until a role is
  // resolved and an Intercom app id is configured.
  useIntercomMessenger(role);

  if (!role) {
    throw new Error("User role not found in session.");
  }

  if (role === USER_ROLE.PROVIDER && !providerPseudonymizedId) {
    throw new Error("Session is invalid or incomplete.");
  }

  if (user) {
    user.role = role;
    user.providerPseudonymizedId = providerPseudonymizedId;
  }

  const staffRoutes = (
    <Routes>
      <Route path="/" element={<HousingApplications />} />
    </Routes>
  );

  // The gate wraps the whole provider branch, not each route, so a route added
  // later is gated by construction. Anything inside it mounts only once the
  // active organization is known; without that, a provider-scoped query batches
  // with the resolve query and is rejected before the organization exists.
  const providerRoutes = (
    <HousingProviderGate>
      <Routes>
        <Route path="/" element={<ProviderApplications />} />
      </Routes>
    </HousingProviderGate>
  );

  return role === USER_ROLE.STAFF ? staffRoutes : providerRoutes;
});

function App() {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <Toaster position="bottom-left" />
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedLayout />}>
              <Route path="/*" element={<RoleBasedRoutes />} />
            </Route>
          </Routes>
        </Router>
      </StoreProvider>
    </ErrorBoundary>
  );
}

export default App;
