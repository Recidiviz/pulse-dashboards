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

import { ErrorPage } from "@recidiviz/design-system";
import { Navigate, Route, Routes } from "react-router-dom";

import { QueryProvider } from "./core/query";
import { CPAStore, CPAStoreProvider, useCPAStore } from "./core/store";
import { cpaUrl, ROUTES } from "./core/utils/routing";
import { CaseloadOverviewPage } from "./pages/CaseloadOverviewPage";

type AppProps = {
  /**
   * `CPAStore` (initialized in the staff app) receives a `RootStore` reference and
   * exposes only the specific data CPA needs.
   *
   * CPA components only need to interact with the `CPAStore` (without needing to know
   * about the `RootStore` or other staff app internals).
   */
  store: CPAStore;
};

function RedirectToCaseloadOverviewPage() {
  const { staffPseudoId } = useCPAStore();
  if (!staffPseudoId) {
    return (
      <ErrorPage headerText="Sorry, we're having trouble loading this page">
        Try reloading the page. If that doesn't work, log out and log back in.
        Contact us at{" "}
        <a href="mailto:feedback@recidiviz.org">feedback@recidiviz.org</a> if
        the issue continues.
      </ErrorPage>
    );
  }
  return (
    <Navigate to={cpaUrl("caseloadOverview", { staffPseudoId })} replace />
  );
}

export function App({ store }: AppProps) {
  return (
    <QueryProvider>
      <CPAStoreProvider store={store}>
        <Routes>
          <Route index element={<RedirectToCaseloadOverviewPage />} />
          <Route
            path={ROUTES.caseloadOverview}
            element={<CaseloadOverviewPage />}
          />
        </Routes>
      </CPAStoreProvider>
    </QueryProvider>
  );
}
