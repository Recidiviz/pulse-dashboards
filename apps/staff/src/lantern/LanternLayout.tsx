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

import "./LanternLayout.scss";

import { observer } from "mobx-react-lite";
import React from "react";
import { Helmet } from "react-helmet";

import Footer from "../components/Footer";
import IE11Banner from "../components/IE11Banner";
import NotFound from "../components/NotFound";
import { useRootStore } from "../components/StoreProvider";
import useIntercom from "../hooks/useIntercom";
import { LANTERN_TENANTS } from "../RootStore/TenantStore/lanternTenants";
import { setTranslateLocale } from "../utils/i18nSettings";
import LanternErrorBoundary from "./ErrorBoundary";
import LanternStoreProvider from "./LanternStoreProvider";
import LanternTopBar from "./LanternTopBar";
import Revocations from "./Revocations";

const LanternLayout: React.FC = (): React.ReactElement | null => {
  const { currentTenantId } = useRootStore();
  useIntercom();

  setTranslateLocale(currentTenantId);

  if (!LANTERN_TENANTS.includes(currentTenantId)) {
    return <NotFound />;
  }

  return (
    <LanternStoreProvider>
      <LanternErrorBoundary>
        <div className="LanternLayout" id="app">
          {/* @ts-expect-error Helmet component type relies on implicit children */}
          <Helmet>
            <link
              href="https://fonts.googleapis.com/css2?family=Libre+Franklin:wght@400;500;600;700&display=swap"
              rel="stylesheet"
            />
          </Helmet>
          <div className="wide-page-container">
            <LanternTopBar />
            <IE11Banner lantern />
            <Revocations />
            <Footer />
          </div>
        </div>
      </LanternErrorBoundary>
    </LanternStoreProvider>
  );
};

export default observer(LanternLayout);
