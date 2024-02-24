// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2021 Recidiviz, Inc.
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

import "react-aspect-ratio/aspect-ratio.css";
import "./assets/scripts/index";
import "./assets/styles/index.scss";

import { useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import tk from "timekeeper";
import { QueryParamProvider } from "use-query-params";
import { ReactRouter6Adapter } from "use-query-params/adapters/react-router-6";

import NotFound from "./components/NotFound";
import SentryErrorBoundary from "./components/SentryErrorBoundary";
import StoreProvider from "./components/StoreProvider";
import StyledToaster from "./components/StyledToaster";
import VerificationNeeded from "./components/VerificationNeeded";
import ProtectedLayout from "./ProtectedLayout";
import { initI18n } from "./utils/i18nSettings";
import initIntercomSettings from "./utils/initIntercomSettings";
import { isDemoMode } from "./utils/isDemoMode";

if (!isDemoMode()) {
  initIntercomSettings();
}
initI18n();

function App() {
  useEffect(() => {
    if (isDemoMode()) {
      const demoDate = new Date("2022-03-22T10:30:00");
      tk.travel(demoDate); // Freeze time to the desired date and time
    }

    return () => {
      if (isDemoMode()) {
        tk.reset(); // Reset the time to the actual system time when the component is unmounted
      }
    };
  }, []);
  return (
    <StoreProvider>
      <Router>
        <SentryErrorBoundary>
          <QueryParamProvider adapter={ReactRouter6Adapter}>
            <Routes>
              <Route path="/verify" element={<VerificationNeeded />} />
              <Route path="/*" element={<ProtectedLayout />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <StyledToaster />
          </QueryParamProvider>
        </SentryErrorBoundary>
      </Router>
    </StoreProvider>
  );
}

export default App;
